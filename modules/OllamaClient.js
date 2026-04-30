// ═══════════════════════════════════════════════════════
// OllamaClient.js — Reusable Ollama AI Client Module
// Zeev & Vitaly — April 2026
// Session 9 — Reusable Module (Rule 6 + Rule 12)
//
// Usage: <script src="/modules/OllamaClient.js"></script>
// Or in static HTML: <script src="modules/OllamaClient.js">
//
// Configuration:
// OllamaClient.configure({
//   endpoint: '/api/ollama/generate',
//   directHost: 'http://192.168.1.2:11434', // for static HTML
//   model: 'mistral:latest',
//   timeout: 180000
// })
//
// Public API:
// OllamaClient.generate(prompt, options) → response text
// OllamaClient.generateJSON(prompt, options) → parsed JSON
// OllamaClient.status() → {running, model, models}
// OllamaClient.release() → free RAM
// OllamaClient.configure(options)
// OllamaClient.extractJSON(text) → safe JSON extraction
// OllamaClient.toArr(val) → normalize array/string
// ═══════════════════════════════════════════════════════

(function() {
  'use strict';

  const CONFIG = {
    // Server proxy mode (Recipe Book, Timedox)
    endpoint: '/api/ollama/generate',
    statusEndpoint: '/api/ollama/status',
    releaseEndpoint: '/api/ollama/release',
    // Direct mode (static HTML like HR project)
    directHost: 'http://192.168.1.2:11434',
    useDirectMode: false, // true for static HTML, false for server proxy
    model: 'mistral:latest',
    timeout: 180000,
    retryOnce: true,
    cooldownMs: 5000,
    onStart: null,
    onComplete: null,
    onError: null
  };

  let _lastCallTime = 0;
  let _isGenerating = false;

  // ── GENERATE ─────────────────────────────────────────
  async function generate(prompt, options = {}) {
    const cfg = { ...CONFIG, ...options };

    // Cooldown between calls
    const now = Date.now();
    const elapsed = now - _lastCallTime;
    if (elapsed < cfg.cooldownMs && _lastCallTime > 0) {
      await new Promise(r => setTimeout(r, cfg.cooldownMs - elapsed));
    }

    _isGenerating = true;
    _lastCallTime = Date.now();
    cfg.onStart && cfg.onStart(prompt);
    window.dbg && window.dbg('🤖 Ollama: ' + prompt.slice(0, 60) + '...');

    // Choose endpoint: direct Ollama or server proxy
    const url = cfg.useDirectMode
      ? cfg.directHost + '/api/generate'
      : cfg.endpoint;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), cfg.timeout);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: cfg.model,
          prompt,
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timer);
      const data = await res.json();
      const text = data.response || '';

      _isGenerating = false;
      cfg.onComplete && cfg.onComplete(text);
      window.dbg && window.dbg('🤖 Response: ' + text.slice(0, 80) + '...');
      return text;

    } catch(e) {
      _isGenerating = false;
      cfg.onError && cfg.onError(e);
      window.dbg && window.dbg('🤖 Error: ' + e.message, 'warn');

      // Retry once
      if (cfg.retryOnce && e.name !== 'AbortError') {
        window.dbg && window.dbg('🤖 Retrying...', 'warn');
        const retryOpts = { ...cfg, retryOnce: false };
        return generate(prompt, retryOpts);
      }
      throw e;
    }
  }

  // ── GENERATE JSON ─────────────────────────────────────
  async function generateJSON(prompt, options = {}) {
    const text = await generate(prompt, options);
    return extractJSON(text);
  }

  // ── STATUS ────────────────────────────────────────────
  async function status() {
    try {
      const url = CONFIG.useDirectMode
        ? CONFIG.directHost + '/api/tags'
        : CONFIG.statusEndpoint;
      const res = await fetch(url);
      const data = await res.json();
      const models = data.models || [];
      const mistral = models.find(m => m.name?.includes('mistral'));
      return {
        running: models.length > 0,
        model: mistral?.name || models[0]?.name || 'unknown',
        models: models.map(m => m.name)
      };
    } catch(e) {
      return { running: false, model: 'unknown', models: [] };
    }
  }

  // ── RELEASE ───────────────────────────────────────────
  async function release() {
    try {
      const url = CONFIG.useDirectMode
        ? CONFIG.directHost + '/api/generate'
        : CONFIG.releaseEndpoint;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: CONFIG.model, keep_alive: 0 })
      });
      window.dbg && window.dbg('🤖 Ollama RAM released');
    } catch(e) {
      window.dbg && window.dbg('🤖 Release failed: ' + e.message, 'warn');
    }
  }

  // ── EXTRACT JSON ──────────────────────────────────────
  function extractJSON(text) {
    if (!text) return null;
    try { return JSON.parse(text.trim()); } catch(e) {}
    const mdMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (mdMatch) { try { return JSON.parse(mdMatch[1].trim()); } catch(e) {} }
    const objMatch = text.match(/\{[\s\S]*?\}/);
    if (objMatch) { try { return JSON.parse(objMatch[0]); } catch(e) {} }
    const arrMatch = text.match(/\[[\s\S]*?\]/);
    if (arrMatch) { try { return JSON.parse(arrMatch[0]); } catch(e) {} }
    return null;
  }

  // ── TO ARRAY ──────────────────────────────────────────
  function toArr(val) {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  }

  function configure(options) { Object.assign(CONFIG, options); }

  // ═══ SESSION 9: OllamaClient.js ═══
  // Reusable for Recipe Book, Timedox, HR, any future app
  // Server proxy mode: useDirectMode: false (default)
  // Static HTML mode: useDirectMode: true + directHost URL
  // END SESSION 9: OllamaClient.js

  window.OllamaClient = {
    generate, generateJSON, status, release,
    configure, extractJSON, toArr
  };

})();
