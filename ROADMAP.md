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

### v2.4 — Polish & Fixes (Session 9)
- [ ] Fix "via rotate" label in search results header
- [ ] Test Import Recipe end-to-end flow
- [ ] Mobile voice search testing
- [ ] Better search bar button layout
- [ ] Add max 100 entries limit to debug log (prevent memory growth)
- [ ] Compress base64 images before storage
- [ ] Verify SpeechRecognition cleanup — add explicit abort() + null on stop
- [ ] Add memory monitoring widget to debug panel

### v3.0 — Multi-User (Sessions 9–11)
- [ ] UserManager.js reusable module (Rule 6)
- [ ] User registration + login
- [ ] Personal recipe collections
- [ ] Shared family pool

### v4.0 — Firebase Auth (Session 10+)
- [ ] AuthModule.js reusable module (Rule 6)
- [ ] Google login
- [ ] Per-user data isolation

### v5.0 — Cloud (Future)
- [ ] CloudSync.js reusable module (Rule 6)
- [ ] Cloud deployment (Railway / Render)
- [ ] Firestore instead of recipes.json
- [ ] PWA / installable app

### v6.0 — Full Modularisation (Future)
- [ ] Refactor all features into independent modules
- [ ] Each module: no app-specific deps, clean public API
