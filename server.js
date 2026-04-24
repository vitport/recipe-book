const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const https = require('https');

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

app.listen(PORT, '0.0.0.0', () => {
  let localIP = 'localhost';
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
  }
  console.log('\n🍳  Recipe Book running!');
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${localIP}:${PORT}\n`);
});
