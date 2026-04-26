# PRD — My Recipe Book
**Product Requirements Document | v2.2**

---

## Product Vision

A personal, offline-capable recipe manager for one household. Stores recipes in Hebrew, Russian, and English. AI-powered import, search, and organization. Runs locally on a home LAN — no cloud, no subscriptions.

---

## Users

**Primary:** Zeev — product owner, daily user
**Secondary:** Family members on the home LAN (phones, tablets via HTTPS)

---

## Core Features

### v1.0 — Recipe CRUD
- Add recipes manually via editor (name, ingredients, instructions, tags)
- Edit and delete recipes
- Persist to `recipes.json` via Express server
- Multi-language support: Hebrew, Russian, English

### v1.1 — AI Import
- Paste raw text → Mistral parses into structured recipe
- Fetch from URL → scrape HTML → AI extraction
- Schema.org / microdata fallback parser
- OCR via PDF.js for scanned recipes

### v2.0 — Filters + Search
- Filter by dish type: breakfast, lunch, dinner, dessert, snack, soup, salad, side dish
- Filter by kosher type: meat, dairy, pareve, non-kosher
- Real-time text search across name + ingredients

### v2.1 — Photos + PDF Export
- Multiple photos per recipe (base64 stored in JSON)
- Photo manager: upload, reorder, set main, delete
- Image picker from URL with AI-ranked selection
- PDF export with photo, ingredients, instructions

### v2.2 — Voice Search + HTTPS *(Session 7)*
- Voice search via Web SpeechRecognition API
- Mistral parses spoken phrase into structured query + filters
- Mic permission popup with "remember" via localStorage
- Visual feedback: pulsing border, interim transcription, status pills, button states
- HTTPS on port 8443 (self-signed cert) — enables SpeechRecognition on LAN devices
- Debug panel: Select All button for easy log copy

---

## Non-Goals (current)

- Cloud sync or multi-device accounts
- User authentication
- Public hosting
- Mobile app

---

## Quality Bar

- All features covered by automated tests in `test.html`
- Test suite must pass ≥95% before any commit
- No breaking changes to `recipes.json` format
- Server responds under 1000ms for all local requests
