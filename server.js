const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const https = require('https');
const { execSync, exec } = require('child_process');
const config = require('./config.js');

const app = express();
const PORT = 8080;
const RECIPES_FILE = path.join(__dirname, 'recipes.json');
const LOG_FILE     = path.join(__dirname, 'server.log');

// ── REQUEST LOGGER ───────────────────────────────────────────────────
app.use(express.json({ limit: '100mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  res.on('finish', () => {
    const entry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: Date.now() - start,
      ip: ip.replace('::ffff:', ''),
    };
    fs.appendFile(LOG_FILE, JSON.stringify(entry) + '\n', () => {});
  });
  next();
});

app.use(express.static(__dirname));

app.get('/recipes.json', (req, res) => {
  try {
    const data = fs.readFileSync(RECIPES_FILE, 'utf8');
    res.type('application/json').send(data);
  } catch (e) {
    res.json({ recipes: [] });
  }
});

app.post('/save-recipes', (req, res) => {
  try {
    const { recipes } = req.body;
    if (!Array.isArray(recipes)) {
      return res.status(400).json({ error: 'Expected { recipes: [...] }' });
    }
    fs.writeFileSync(RECIPES_FILE, JSON.stringify({ recipes }, null, 2), 'utf8');
    res.json({ ok: true, count: recipes.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── OLLAMA PROXY ─────────────────────────────────────────────────────
// Routes browser requests to Ollama, avoiding browser CORS restrictions.

function ollamaRequest(method, ollamaPath, body, res) {
  const opts = {
    hostname: 'localhost',
    port: 11434,
    path: ollamaPath,
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  const req = http.request(opts, ollamaRes => {
    res.status(ollamaRes.statusCode);
    let data = '';
    ollamaRes.on('data', chunk => { data += chunk; });
    ollamaRes.on('end', () => {
      try { res.json(JSON.parse(data)); }
      catch(e) { res.send(data); }
    });
  });
  req.on('error', err => res.status(502).json({ error: 'Ollama not reachable: ' + err.message }));
  if (body) req.write(JSON.stringify(body));
  req.end();
}

app.get('/api/ollama/status', (req, res) => {
  ollamaRequest('GET', '/api/tags', null, res);
});

app.post('/api/ollama/generate', (req, res) => {
  ollamaRequest('POST', '/api/generate', req.body, res);
});

app.post('/api/ollama/release', (req, res) => {
  ollamaRequest('POST', '/api/generate', { model: 'mistral', keep_alive: 0 }, res);
});

// ── IMAGE PROXY ───────────────────────────────────────────────────────
// Fetches external images server-side, bypassing browser CORS restrictions.
app.get('/api/proxy-image', (req, res) => {
  const url = req.query.url;
  if (!url || !/^https?:\/\//i.test(url))
    return res.status(400).json({ error: 'Invalid or missing url parameter' });

  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  const mod = url.startsWith('https') ? https : http;
  let responded = false;

  const timer = setTimeout(() => {
    if (!responded) { responded = true; proxyReq.destroy(); res.status(504).json({ error: 'Image fetch timed out' }); }
  }, 10000);

  const proxyReq = mod.get(url, proxyRes => {
    if (responded) return;
    // Follow a single redirect
    if ((proxyRes.statusCode === 301 || proxyRes.statusCode === 302) && proxyRes.headers.location) {
      clearTimeout(timer);
      return res.redirect(`/api/proxy-image?url=${encodeURIComponent(proxyRes.headers.location)}`);
    }
    if (proxyRes.statusCode !== 200) {
      clearTimeout(timer); responded = true;
      return res.status(proxyRes.statusCode).json({ error: `Upstream HTTP ${proxyRes.statusCode}` });
    }
    const mime = (proxyRes.headers['content-type'] || 'image/jpeg').split(';')[0].trim();
    if (!mime.startsWith('image/')) {
      clearTimeout(timer); responded = true;
      return res.status(415).json({ error: 'URL does not point to an image' });
    }
    const chunks = [];
    let size = 0;
    proxyRes.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_SIZE) {
        clearTimeout(timer); responded = true;
        proxyReq.destroy();
        return res.status(413).json({ error: 'Image exceeds 5 MB limit' });
      }
      chunks.push(chunk);
    });
    proxyRes.on('end', () => {
      if (responded) return;
      clearTimeout(timer); responded = true;
      const buf = Buffer.concat(chunks);
      res.json({ data: `data:${mime};base64,${buf.toString('base64')}`, mimeType: mime, size: buf.length });
    });
  });

  proxyReq.on('error', err => {
    if (responded) return;
    clearTimeout(timer); responded = true;
    res.status(502).json({ error: err.message });
  });
});

// ── URL FETCH PROXY ──────────────────────────────────────────────────
// Fetches external URLs server-side with a real browser User-Agent,
// bypassing CORS and bot-detection headers that block client-side fetches.
app.get('/api/fetch-url', (req, res) => {
  const url = req.query.url;
  if (!url || !/^https?:\/\//i.test(url))
    return res.status(400).json({ error: 'Invalid or missing url parameter' });

  const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'he,en-US;q=0.9,en;q=0.8',
  };

  function doFetch(targetUrl, redirectsLeft) {
    const mod = targetUrl.startsWith('https') ? https : http;
    let responded = false;
    const timer = setTimeout(() => {
      if (!responded) { responded = true; proxyReq.destroy(); res.status(504).json({ error: 'Fetch timed out' }); }
    }, 15000);

    const proxyReq = mod.get(targetUrl, { headers: BROWSER_HEADERS }, proxyRes => {
      if (responded) return;
      const { statusCode, headers: h } = proxyRes;
      if ((statusCode === 301 || statusCode === 302 || statusCode === 303 || statusCode === 307 || statusCode === 308) && h.location) {
        clearTimeout(timer);
        if (redirectsLeft <= 0) { responded = true; return res.status(310).json({ error: 'Too many redirects' }); }
        try {
          const next = new URL(h.location, targetUrl).href;
          return doFetch(next, redirectsLeft - 1);
        } catch(e) { responded = true; return res.status(502).json({ error: 'Bad redirect URL' }); }
      }
      if (statusCode !== 200) {
        clearTimeout(timer); responded = true;
        return res.status(statusCode).json({ error: `Upstream HTTP ${statusCode}` });
      }
      const chunks = [];
      let size = 0;
      const MAX = 5 * 1024 * 1024;
      proxyRes.on('data', chunk => {
        size += chunk.length;
        if (size > MAX) { clearTimeout(timer); responded = true; proxyReq.destroy(); return res.status(413).json({ error: 'Response too large (>5MB)' }); }
        chunks.push(chunk);
      });
      proxyRes.on('end', () => {
        if (responded) return;
        clearTimeout(timer); responded = true;
        res.json({ html: Buffer.concat(chunks).toString('utf8') });
      });
    });
    proxyReq.on('error', err => {
      if (responded) return;
      clearTimeout(timer); responded = true;
      res.status(502).json({ error: err.message });
    });
  }

  doFetch(url, 3);
});

// ── CONFIG ENDPOINT ──────────────────────────────────────────────────
// Returns API keys to the browser securely (server reads from config.js)
app.get('/api/config/search', (req, res) => {
  res.json({ serperKey: config.SERPER_API_KEY, googleCx: config.GOOGLE_CX });
});

// ── SEARCH PROXY (multi-mode) ─────────────────────────────────────────
// Supports: mode=api (Brave/Google) and mode=scrape (Google/Bing/rotate)

const SEARCH_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function searchFetch(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    let req;
    const timer = setTimeout(() => { if (req) req.destroy(); reject(new Error('Search timeout')); }, 10000);
    req = mod.get(url, { headers: { 'User-Agent': SEARCH_UA, 'Accept-Language': 'en-US,en;q=0.9', ...headers } }, r => {
      let data = '';
      r.on('data', c => data += c);
      r.on('end', () => { clearTimeout(timer); resolve({ status: r.statusCode, body: data }); });
    });
    req.on('error', e => { clearTimeout(timer); reject(e); });
  });
}

function searchPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const buf = Buffer.from(body);
    const u = new URL(url);
    let req;
    const timer = setTimeout(() => { if (req) req.destroy(); reject(new Error('Search timeout')); }, 10000);
    req = https.request({
      hostname: u.hostname, path: u.pathname + u.search, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': buf.length, ...headers }
    }, r => {
      let data = '';
      r.on('data', c => data += c);
      r.on('end', () => { clearTimeout(timer); resolve({ status: r.statusCode, body: data }); });
    });
    req.on('error', e => { clearTimeout(timer); reject(e); });
    req.write(buf);
    req.end();
  });
}

function scrapeGoogleHTML(html) {
  const results = [];
  const urlRe = /href="\/url\?q=(https?:\/\/(?!www\.google\.)[^&"]+)/g;
  const h3Re = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
  const urls = [], titles = [];
  let m;
  while ((m = urlRe.exec(html)) !== null) {
    try { urls.push(decodeURIComponent(m[1])); } catch(e) { urls.push(m[1]); }
  }
  while ((m = h3Re.exec(html)) !== null) {
    const t = m[1].replace(/<[^>]+>/g, '').trim();
    if (t && t.length > 3 && t.length < 200) titles.push(t);
  }
  for (let i = 0; i < Math.min(urls.length, titles.length, 5); i++) {
    results.push({ title: titles[i], url: urls[i], snippet: '' });
  }
  return results;
}

function scrapeBingHTML(html) {
  const results = [];
  const blockRe = /<li[^>]*class="b_algo"[^>]*>([\s\S]*?)<\/li>/gi;
  let m;
  while ((m = blockRe.exec(html)) !== null) {
    const block = m[1];
    const tM = /<h2[^>]*>[\s\S]*?<a[^>]*href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
    const sM = /<p[^>]*class="b_lineclamp[^"]*"[^>]*>([\s\S]*?)<\/p>/i.exec(block) || /<p[^>]*>([\s\S]*?)<\/p>/i.exec(block);
    if (tM) {
      results.push({
        title: tM[2].replace(/<[^>]+>/g, '').trim(),
        url: tM[1],
        snippet: sM ? sM[1].replace(/<[^>]+>/g, '').trim().slice(0, 200) : ''
      });
    }
    if (results.length >= 5) break;
  }
  return results;
}

app.get('/api/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ results: [], query: '', total: 0 });

  const mode     = req.query.mode || 'scrape';
  const provider = req.query.provider || 'brave';
  const apiKey   = req.query.key || '';
  const cx       = req.query.cx || '';
  const engine   = req.query.engine || 'rotate';

  try {
    let results = [];

    if (mode === 'api' && provider === 'serper') {
      const lang = req.query.lang || 'en';
      const payload = JSON.stringify({ q: q + ' recipe', num: 5, hl: lang });
      const r = await searchPost('https://google.serper.dev/search', payload, { 'X-API-KEY': apiKey || config.SERPER_API_KEY });
      const d = JSON.parse(r.body);
      results = (d.organic || []).map(x => ({
        title: x.title, url: x.link, snippet: x.snippet || '', image: x.imageUrl || ''
      }));
      console.log(`Serper API: ${results.length} results for "${q}"`);

    } else if (mode === 'api' && provider === 'brave') {
      const r = await searchFetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=5`,
        { 'Accept': 'application/json', 'Accept-Encoding': 'gzip', 'X-Subscription-Token': apiKey }
      );
      const d = JSON.parse(r.body);
      results = (d.web && d.web.results || []).map(x => ({
        title: x.title, url: x.url, snippet: x.description || '', image: x.thumbnail && x.thumbnail.src || ''
      }));

    } else if (mode === 'api' && provider === 'google') {
      const r = await searchFetch(
        `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(q)}&key=${apiKey}&cx=${cx}&num=5`
      );
      const d = JSON.parse(r.body);
      results = (d.items || []).map(x => ({
        title: x.title, url: x.link, snippet: x.snippet || '',
        image: x.pagemap && x.pagemap.cse_image && x.pagemap.cse_image[0] && x.pagemap.cse_image[0].src || ''
      }));

    } else if (mode === 'scrape' && engine === 'google') {
      const r = await searchFetch(`https://www.google.com/search?q=${encodeURIComponent(q + ' recipe')}&num=10&hl=en`);
      results = scrapeGoogleHTML(r.body);

    } else if (mode === 'scrape' && engine === 'bing') {
      const r = await searchFetch(`https://www.bing.com/search?q=${encodeURIComponent(q + ' recipe')}&count=10`);
      results = scrapeBingHTML(r.body);

    } else { // scrape + rotate: try Google, fallback to Bing
      const gRes = await searchFetch(`https://www.google.com/search?q=${encodeURIComponent(q + ' recipe')}&num=10&hl=en`).catch(() => null);
      if (gRes) results = scrapeGoogleHTML(gRes.body);
      if (!results.length) {
        const bRes = await searchFetch(`https://www.bing.com/search?q=${encodeURIComponent(q + ' recipe')}&count=10`).catch(() => null);
        if (bRes) results = scrapeBingHTML(bRes.body);
      }
    }

    console.log(`Search [${mode}/${mode === 'api' ? provider : engine}] "${q}": ${results.length} results`);
    res.json({ results, query: q, total: results.length, mode, ...(mode === 'api' ? { provider } : { engine }) });
  } catch(e) {
    console.log(`Search error [${mode}]: ${e.message}`);
    res.json({ results: [], error: e.message, query: q });
  }
});

// ── TTS (Text to Speech) ──────────────────────────────────────────────
const PIPER_EXE = path.join(__dirname, 'piper.exe');

app.get('/api/tts/voices', (req, res) => {
  const voicesDir = path.join(__dirname, 'voices');
  let voices = [];
  let piperInstalled = false;
  try { execSync(`"${PIPER_EXE}" --version`, { stdio: 'pipe' }); piperInstalled = true; } catch(e) {}
  try {
    const files = fs.readdirSync(voicesDir).filter(f => f.endsWith('.onnx'));
    voices = files.map(f => f.replace('.onnx', ''));
  } catch(e) {}
  if (!voices.length) {
    voices = ['en_US-lessac-medium', 'en_US-ryan-medium', 'he_IL-default', 'ru_RU-default'];
  }
  res.json({ voices, piperInstalled });
});

app.post('/api/tts/speak', (req, res) => {
  const { text = '', voice = 'en_US-lessac-medium', speed = 1.0 } = req.body;
  if (!text.trim()) return res.status(400).json({ error: 'text is required' });

  let piperInstalled = false;
  try { execSync(`"${PIPER_EXE}" --version`, { stdio: 'pipe' }); piperInstalled = true; } catch(e) {}

  if (!piperInstalled) {
    return res.json({ error: 'Piper not installed', fallback: 'browser', installUrl: 'https://github.com/rhasspy/piper/releases' });
  }

  const modelPath = path.join(__dirname, 'voices', voice + '.onnx');
  const outputFile = path.join(os.tmpdir(), 'tts-output.wav');
  const safeText = text.replace(/"/g, '\\"').replace(/`/g, '').replace(/\$/g, '');
  const cmd = `echo "${safeText}" | "${PIPER_EXE}" --model "${modelPath}" --output_file "${outputFile}"`;

  exec(cmd, { timeout: 10000 }, (err) => {
    if (err) {
      return res.json({ error: err.message, fallback: 'browser' });
    }
    try {
      const audioData = fs.readFileSync(outputFile).toString('base64');
      res.json({ audioData, mimeType: 'audio/wav', voice, engine: 'piper' });
    } catch(readErr) {
      res.json({ error: readErr.message, fallback: 'browser' });
    }
  });
});

let localIP = 'localhost';
for (const ifaces of Object.values(os.networkInterfaces())) {
  for (const iface of ifaces) {
    if (iface.family === 'IPv4' && !iface.internal) { localIP = iface.address; break; }
  }
}

// HTTP server (port 8080)
http.createServer(app).listen(8080, '0.0.0.0', () => {
  console.log('\n🍳  Recipe Book running!');
  console.log(`HTTP  → http://localhost:8080`);
  console.log(`HTTP  → http://${localIP}:8080`);
});

// HTTPS server (port 8443)
try {
  const sslOptions = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
  };
  https.createServer(sslOptions, app).listen(8443, '0.0.0.0', () => {
    console.log(`HTTPS → https://localhost:8443`);
    console.log(`HTTPS → https://${localIP}:8443 ← use this for voice search!\n`);
  });
} catch(e) {
  console.log('HTTPS not available — run: node gen-cert.js first\n');
}
