// ═══════════════════════════════════════════════
// SearchEngine.js — Reusable Internet Search Module
// Recipe Book Project — Zeev & Vitaly
// Session 8 — Reusable Module (Rule 6 + Rule 7)
//
// Usage: <script src="/modules/SearchEngine.js"></script>
//
// Configuration:
// SearchEngine.configure({
//   mode: 'api',           // 'api' | 'scrape' | 'auto'
//   apiProvider: 'brave',  // 'brave' | 'google' | 'bing'
//   apiKey: 'YOUR_KEY',    // required for api mode
//   googleCx: 'YOUR_CX',  // required for google api
//   scrapeEngine: 'google',// 'google' | 'bing' | 'rotate'
//   maxResults: 5,
//   useMistral: true,
//   onImport: null,        // callback: function(url)
//   lang: 'en'
// })
//
// Public API:
// SearchEngine.search(query, options)
// SearchEngine.showResults(results, query, summary)
// SearchEngine.hideResults()
// SearchEngine.importResult(url)
// SearchEngine.configure(options)
// ═══════════════════════════════════════════════

// ═══ SESSION 8: Multi-mode Search (Rule 6 + Rule 7) ═══
// mode: 'api'    → Brave/Google API (legal, reliable, needs key)
// mode: 'scrape' → server proxy + HTML parsing (free, no limits)
// mode: 'auto'   → API first, scrape fallback
// Rollback: revert to single-mode DuckDuckGo version
// END SESSION 8: Multi-mode Search

(function() {
  'use strict';

  const CONFIG = {
    endpoint: '/api/search',
    mode: 'scrape',           // 'api' | 'scrape' | 'auto'
    apiProvider: 'brave',     // 'brave' | 'google'
    apiKey: '',               // set via configure()
    googleCx: '',             // google custom search cx
    scrapeEngine: 'rotate',   // 'google' | 'bing' | 'rotate'
    resultsContainerId: 'internet-results',
    maxResults: 5,
    useMistral: true,
    ollamaEndpoint: '/api/ollama/generate',
    onImport: null,
    lang: 'en',
    debounceMs: 800
  };

  // ── SEARCH ──────────────────────────────────────
  async function search(query, options = {}) {
    const cfg = { ...CONFIG, ...options };
    window.dbg && window.dbg('🌐 Internet search [' + cfg.mode + ']: ' + query);

    showSearching(query, cfg);

    try {
      let results = [];

      if (cfg.mode === 'api') {
        results = await searchViaAPI(query, cfg);
      } else if (cfg.mode === 'scrape') {
        results = await searchViaScrape(query, cfg);
      } else if (cfg.mode === 'auto') {
        results = await searchViaAPI(query, cfg);
        if (results.length === 0) {
          window.dbg && window.dbg('🌐 API returned 0, trying scrape fallback...', 'warn');
          results = await searchViaScrape(query, cfg);
        }
      }

      if (results.length > 0) {
        let summary = '';
        if (cfg.useMistral) summary = await getMistralSummary(query, results, cfg);
        showResults(results, query, summary, cfg);
        window.dbg && window.dbg('🌐 Found ' + results.length + ' internet results');
      } else {
        window.dbg && window.dbg('🌐 No internet results found', 'warn');
        showNoResults(query, cfg);
      }
      return results;
    } catch(e) {
      window.dbg && window.dbg('🌐 Internet search failed: ' + e.message, 'warn');
      showNoResults(query, cfg);
      return [];
    }
  }

  // ── API SEARCH ───────────────────────────────────
  async function searchViaAPI(query, cfg) {
    const url = `${cfg.endpoint}?q=${encodeURIComponent(query)}&mode=api&provider=${cfg.apiProvider}&key=${encodeURIComponent(cfg.apiKey)}&cx=${encodeURIComponent(cfg.googleCx)}&lang=${cfg.lang}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.results || [];
  }

  // ── SCRAPE SEARCH ────────────────────────────────
  async function searchViaScrape(query, cfg) {
    const url = `${cfg.endpoint}?q=${encodeURIComponent(query)}&mode=scrape&engine=${cfg.scrapeEngine}&lang=${cfg.lang}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.results || [];
  }

  // ── MISTRAL SUMMARY ──────────────────────────────
  async function getMistralSummary(query, results, cfg) {
    try {
      const snippets = results.slice(0, 3).map(r => r.title + ' - ' + (r.snippet || '')).join('\n');
      const prompt = `Summarize these recipe search results for "${query}" in one short sentence:\n${snippets}\nReturn only the summary, nothing else. No ellipsis. No truncation.`;
      const res = await fetch(cfg.ollamaEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'mistral:latest', prompt, stream: false }),
        signal: AbortSignal.timeout(30000)
      });
      const data = await res.json();
      return data.response || '';
    } catch(e) {
      return '';
    }
  }

  // ── UI: SEARCHING STATE ──────────────────────────
  function showSearching(query, cfg) {
    const btn = document.getElementById('web-search-btn');
    if (btn) btn.classList.add('searching');
    const container = getOrCreateContainer(cfg);
    container.innerHTML = `
      <div class="internet-results-header">
        <span class="internet-results-title">🌐 Searching internet for "${query}"…</span>
      </div>
      <div class="internet-results-loading">
        <div class="internet-results-spinner"></div>
        <span>Looking for recipes online…</span>
      </div>`;
    container.style.display = 'block';
  }

  // ── UI: RESULTS ──────────────────────────────────
  function showResults(results, query, summary, cfg) {
    cfg = cfg || CONFIG;
    const btn = document.getElementById('web-search-btn');
    if (btn) btn.classList.remove('searching');
    const container = getOrCreateContainer(cfg);
    const limited = results.slice(0, cfg.maxResults);
    const modeLabel = cfg.mode === 'api'
      ? `via ${cfg.apiProvider} API`
      : `via ${cfg.scrapeEngine || 'scrape'}`;
    container.innerHTML = `
      <div class="internet-results-header">
        <span class="internet-results-title">🌐 Internet Results for "${query}" <small>(${modeLabel})</small></span>
        <button class="internet-results-close" onclick="window.SearchEngine.hideResults()">✕</button>
      </div>
      ${summary ? `<div class="internet-results-summary">🤖 ${summary}</div>` : ''}
      <div class="internet-results-list">
        ${limited.map(r => `
          <div class="internet-result-item">
            ${r.image ? `<img class="internet-result-image" src="${r.image}" alt="" onerror="this.style.display='none'">` : ''}
            <div class="internet-result-content">
              <div class="internet-result-title">${r.title}</div>
              <div class="internet-result-snippet">${r.snippet || ''}</div>
              <div class="internet-result-url">${r.url}</div>
              <div class="internet-result-actions">
                <a href="${r.url}" target="_blank" class="internet-result-link">🔗 Open</a>
                ${cfg.onImport ? `<button class="internet-result-import" onclick="window.SearchEngine.importResult('${r.url.replace(/'/g, "\\'")}')">📥 Import Recipe</button>` : ''}
              </div>
            </div>
          </div>`).join('')}
      </div>`;
    container.style.display = 'block';
  }

  // ── UI: NO RESULTS ───────────────────────────────
  function showNoResults(query, cfg) {
    cfg = cfg || CONFIG;
    const btn = document.getElementById('web-search-btn');
    if (btn) btn.classList.remove('searching');
    const container = getOrCreateContainer(cfg);
    container.innerHTML = `
      <div class="internet-results-header">
        <span class="internet-results-title">🌐 No internet results for "${query}"</span>
        <button class="internet-results-close" onclick="window.SearchEngine.hideResults()">✕</button>
      </div>
      <div class="internet-results-loading">
        <span>Try different search terms or check your connection.</span>
      </div>`;
    container.style.display = 'block';
  }

  // ── UI: HIDE ─────────────────────────────────────
  function hideResults() {
    const btn = document.getElementById('web-search-btn');
    if (btn) btn.classList.remove('searching');
    const container = document.getElementById(CONFIG.resultsContainerId);
    if (container) container.style.display = 'none';
  }

  function importResult(url) {
    if (CONFIG.onImport) CONFIG.onImport(url);
  }

  function getOrCreateContainer(cfg) {
    let container = document.getElementById(cfg.resultsContainerId);
    if (!container) {
      container = document.createElement('div');
      container.id = cfg.resultsContainerId;
      container.className = 'internet-results';
      const main = document.querySelector('main') || document.getElementById('grid');
      if (main) main.after(container);
      else document.body.appendChild(container);
    }
    return container;
  }

  function configure(options) {
    Object.assign(CONFIG, options);
  }

  // ── PUBLIC API ───────────────────────────────────
  window.SearchEngine = { search, showResults, hideResults, importResult, configure };

})();
