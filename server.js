const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');

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
