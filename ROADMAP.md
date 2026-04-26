# Roadmap — My Recipe Book

## Completed

### v1.0 — Core (Sessions 1–2)
- [x] Recipe CRUD with local JSON persistence
- [x] Multi-language support (Hebrew, Russian, English)
- [x] Dish type + kosher type filters
- [x] Real-time text search

### v1.1 — AI Import (Sessions 2–3)
- [x] Paste text → Mistral parses into recipe
- [x] Fetch from URL → AI extraction
- [x] Language auto-detection

### v2.0 — Quality + Testing (Sessions 4–5)
- [x] Automated test suite (test.html) — Series 1, 2, 3
- [x] PDF import via OCR (PDF.js)
- [x] PDF export (jsPDF)
- [x] 63/63 tests passing at completion

### v2.1 — Media + Debug (Session 6)
- [x] CORS fix via server-side image proxy
- [x] Schema.org / microdata HTML recipe extraction
- [x] Multi-photo support per recipe
- [x] Photo manager (upload, reorder, set main, delete)
- [x] AI image picker from URL
- [x] Debug panel with drag-to-resize

### v2.2 — Voice Search + HTTPS (Session 7)
- [x] Microphone permission popup (#m-mic-permission)
- [x] SpeechRecognition-based mic permission probe (works on HTTP/LAN)
- [x] Voice recording with interim transcription display
- [x] Visual feedback: pulsing search border, status pills, button states
- [x] Mistral voice intent parsing (query + dish + kosher from speech)
- [x] Filter reset before applying new voice search
- [x] HTTPS server on port 8443 (self-signed cert, `node gen-cert.js`)
- [x] Debug panel "📋 Select All" button
- [x] Test 1.1.8: HTTPS server accessible
- [x] Tests 2.6.1–2.6.5: Voice search coverage

### v2.3 — Internet Search (Session 8) ✅ Complete
- [x] SearchEngine.js reusable module (Rule 6 + Rule 7)
- [x] Serper API integration (2500 free Google results/month)
- [x] Auto mode: API first, Google/Bing scrape fallback
- [x] 🌐 button in search bar
- [x] Auto-trigger when 0 local results (debounced 800ms)
- [x] Mistral AI summary of results
- [x] 📥 Import Recipe from internet results
- [x] API key secure storage in config.js (gitignored)
- [x] /api/config/search endpoint for dynamic key delivery
- [x] 95+ tests total (added 1.5.x Config & Security, 2.7.x Internet Search)

---

## Planned

## Phase 1: Features (Sessions 9-12)

### Session 9 — Supabase Database 🗄️
- [ ] Install Supabase locally
- [ ] Design database schema
- [ ] Migrate recipes.json → Supabase
- [ ] Migrate photos → Supabase Storage
- [ ] Update server.js to use Supabase
- [ ] All 100 tests still passing

### Session 10 — Multi-User Support 👥
- [ ] UserManager.js reusable module (Rule 6)
- [ ] User registration + login
- [ ] Personal recipe collections per user
- [ ] Shared family recipe pool

### Session 11 — Authentication 🔐
- [ ] AuthModule.js reusable module (Rule 6)
- [ ] Google OAuth
- [ ] Apple Sign In
- [ ] Session management

### Voice Assistant Enhancement 🎤
- [ ] Install Piper TTS binary
- [ ] Download Hebrew + English voice models (.onnx)
- [ ] VT-Spec v1 voice templates
- [ ] Full Recipe Book voice integration ("add recipe by voice")
- [ ] "Add recipe by voice" feature
- [ ] Voice cloning with Coqui XTTS v2 (Phase 2)

### Session 12 — More Features ✨
- [ ] Meal planner (weekly)
- [ ] Shopping list from recipe
- [ ] Recipe ratings + comments
- [ ] Nutritional information (Mistral)

## Phase 2: Infrastructure (Sessions 13-14)

### Session 13 — Docker 🐳
- [ ] Dockerfile for Node.js server
- [ ] docker-compose.yml:
  - recipe-app container
  - ollama container
  - supabase containers
- [ ] One command: `docker compose up`

### Session 14 — Cloud Deployment ☁️
- [ ] CloudSync.js reusable module (Rule 6)
- [ ] Deploy to Railway/Render
- [ ] Custom domain
- [ ] SSL certificate (automatic)
- [ ] CI/CD via GitHub Actions

## Phase 3: Refactoring (Session 15)

### Session 15 — Full Refactoring 🔧
- [ ] Extract all modules:
  - DebugPanel.js
  - Importer.js
  - Exporter.js
  - RecipeAI.js
  - VoiceSearch.js
  - SearchEngine.js ✅ (done!)
  - UserManager.js
  - AuthModule.js
  - CloudSync.js
- [ ] Full module documentation
- [ ] npm package preparation
