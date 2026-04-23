const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 8080;
const RECIPES_FILE = path.join(__dirname, 'recipes.json');

app.use(express.json({ limit: '100mb' }));
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
