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

---

## Planned

### v2.3 — Polish (Session 8)
- [ ] Recipe sharing (export link / QR code)
- [ ] Bulk import from text file
- [ ] Better mobile layout

### v3.0 — Multi-User (Session 8+)
- [ ] Firebase Authentication (Google login)
- [ ] Per-user recipe collections
- [ ] Family sharing mode

### v4.0 — Cloud (Future)
- [ ] Cloud deployment (Railway / Render)
- [ ] Firestore instead of recipes.json
- [ ] PWA / installable app
