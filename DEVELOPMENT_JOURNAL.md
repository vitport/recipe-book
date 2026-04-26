# Development Journal — My Recipe Book
*Zeev & Vitaly | Running session log*

---

## Session 8 — Internet Search & Security
**Date:** 2026-04-26 | **Version:** v2.3

### What We Built
- Built **SearchEngine.js** reusable internet search module (Rule 6 + Rule 7)
- Explored multiple search providers:
  - DuckDuckGo API → returned empty results (blocked/limited)
  - Google scraping → blocked after a few requests
  - Brave Search API → requires paid plan
  - Google Custom Search → closed to new customers
  - **Serper API** → ✅ Success (2500 free queries/month, Google results)
- Multi-mode architecture: `api` / `scrape` / `auto`
- Scrape fallback: Google HTML parsing → Bing HTML parsing (rotation)
- Added **🌐 button** in search bar (manual trigger)
- **Auto-trigger** when local search returns 0 results (debounced 800ms)
- **Mistral AI summary** of internet search results
- **📥 Import Recipe** button on each search result
- Secured API key in `config.js` (gitignored, loaded via `/api/config/search`)
- Added **Rule 7** (Web Search Configuration — ask mode/provider/engine)
- Added **Rule 8** (End of Session Checklist — docs + tests + commit)
- Created `PROJECT_STATE.md` live status document
- 95+ tests total (added groups 1.5.x Config & Security, 2.7.x Internet Search)

### Technical Decisions
- Used Serper API (wraps Google) instead of raw Google scraping — more reliable
- API key stored server-side in `config.js`, delivered to browser via `/api/config/search`
- `SearchEngine.configure()` called twice: static config at startup, dynamic key after init()
- `searchFetch()` for GET requests, `searchPost()` for Serper API (POST-based)
- `scrapeGoogleHTML()` and `scrapeBingHTML()` regex parsers as fallback

### Known Issues at Session End
- Search results show "via rotate" label instead of "via serper" — label fix needed
- Serper free tier: limited credits — may need new account or paid plan
- Import Recipe from internet — not yet tested end-to-end
- Mobile voice search — not yet tested

---

## Sessions 1–7 (Summary)
- **Sessions 1–4:** Core CRUD, multi-language (HE/RU/EN), AI parsing, filters, search, sort
- **Session 5:** PDF import (OCR via PDF.js), PDF export (jsPDF), test suite (63/63)
- **Session 6:** CORS fix, server-side image proxy, Schema.org parsing, multi-photo, photo manager, debug mode
- **Session 7:** Voice search (SpeechRecognition + Mistral intent), mic permission popup, HTTPS :8443, visual feedback, debug Select All
