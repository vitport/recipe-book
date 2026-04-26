# Architecture — My Recipe Book

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Single-page HTML + vanilla JS (index.html) |
| Backend | Node.js + Express (server.js) |
| Database | recipes.json (flat-file JSON) |
| AI | Ollama / Mistral 7B (local, via server proxy) |
| Speech | Web SpeechRecognition API (Chrome/Edge) |
| Certs | self-signed via `selfsigned` npm package |

## Server

`server.js` runs two listeners:
- **HTTP :8080** — all features, LAN access
- **HTTPS :8443** — required for SpeechRecognition on LAN devices

Both serve the same Express app. SSL certs are generated once with `node gen-cert.js` and are gitignored.

## Frontend (index.html)

All application logic lives in a single `index.html` file (~3000 lines).

### Key data structures

```js
let recipes = [];          // loaded from /recipes.json on startup
let flt = { dish: 'all', kosher: 'all' };  // active filter state
let q = '';                // current search query
```

### Module sections (by comment marker)

| Comment | What it contains |
|---------|-----------------|
| `// ─── DEBUG MODE` | Debug panel, dbg(), exitDebugMode() |
| `// ═══ SESSION 7: Voice Search` | initMicBtn, askMicPermission, grantMicPermission |
| `// ═══ SESSION 7: Mic Permission Popup` | askMicPermission, grantMicPermission, voiceSetF |
| `// ═══ SESSION 7: Voice Search Visual Feedback` | _micStatus, _micBtn |
| `// voiceSearchIntent` | Mistral intent parsing, filter application |
| `// startVoiceSearch` | SpeechRecognition session with interim results |
| `// ─── FILTERS & SEARCH` | setF(), search input handler |
| `// ─── CRUD` | saveRecipe, delR, confirmDel |
| `// ─── RENDER` | render(), card HTML |
| `// ─── EXPORT` | exportJSON, importJSON, exportRecipePDF |

## Voice Search Flow

```
User clicks 🎤
    → askMicPermission()
        → if localStorage('mic-permission') === 'granted': startVoiceSearch()
        → else: show #m-mic-permission popup
            → user clicks "Allow Microphone"
            → grantMicPermission()
                → SpeechRecognition probe.start()
                → onstart: save localStorage, startVoiceSearch()
                → onerror 'not-allowed': toast error

startVoiceSearch()
    → show recording state (🔴 button, pulsing border, "🎤 Listening…" pill)
    → SpeechRecognition with interimResults=true
    → interim results → gray italic text in search input
    → final result → voiceSearchIntent(text)

voiceSearchIntent(speechText)
    → voiceSetF('dish','all') + voiceSetF('kosher','all')  // reset
    → POST /api/ollama/generate with structured prompt
    → validate dish/kosher against allowlists
    → apply query + optional filters
    → render()
```

## AI Proxy Pattern

Browser → `GET/POST /api/ollama/*` → server.js → `localhost:11434` (Ollama)

Avoids CORS. Server adds no auth — Ollama is localhost-only.

## Session 7 additions

- `voiceSetF(type, val)` — global helper, looks up pill element and calls `setF()`
- `_micBtn(state)` — 'recording' | 'processing' | default
- `_micStatus(msg, hide, state)` — colored pill: listening/processing/done/error
- `#m-mic-permission` modal — shown on first use, skipped if localStorage cached
- `#search.recording` CSS — pulsing orange border while listening
- `#search.interim` CSS — gray italic for live transcription
- `selectAllLogs()` — selects all debug panel text for copy-paste
