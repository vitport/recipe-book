# 📊 Project State
**My Recipe Book | Live Status Document**
*Zeev & Vitaly | Updated: Session 8*

---

## 🚦 Current Version: 2.3 (In Progress)

| Field | Value |
|-------|-------|
| Last Session | Session 8 |
| Last Commit | Session 8: Internet Search, SearchEngine.js module |
| Server HTTP | http://192.168.1.2:8080 |
| Server HTTPS | https://192.168.1.2:8443 ← use for voice search |
| Test Suite | https://192.168.1.2:8443/test.html |
| GitHub | github.com/vitport/recipe-book |

---

## ✅ What Works Right Now

### Core
- Recipe CRUD (create, read, update, delete) ✅
- Multilingual: Hebrew, English, Russian with RTL ✅
- Filter by dish type + kosher type ✅
- Search by name, ingredient, description ✅
- Sort by 7 criteria ✅
- Auto-save to server on every change ✅

### Import
- URL import via our server proxy ✅
- Schema.org JSON-LD extraction (instant, no AI) ✅
- HTML microdata extraction (fast) ✅
- Mistral AI fallback parsing ✅
- PDF import (text-based) ✅
- Photo import via OCR (Tesseract) ✅
- Text paste import ✅
- JSON import ✅

### Export
- PDF export (beautiful formatted) ✅
- JSON export ✅

### AI Features
- Mistral 7B local AI (Ollama) ✅
- AI recipe parsing (Hebrew/English/Russian) ✅
- AI image food detection ✅
- AI image ranking ✅
- Voice search with AI intent parsing ✅

### Voice Search
- Web Speech API (Chrome) ✅
- Hebrew/English/Russian recognition ✅
- Mic permission popup (ChatGPT-style) ✅
- Mistral intent: query + dishType + kosherType ✅
- Visual feedback (pulsing button, live text) ✅
- HTTPS required for voice (port 8443) ✅

### Photos
- Multi-photo per recipe ✅
- Photo manager (add/delete/reorder) ✅
- Image picker from URL (Mistral-powered) ✅
- Server-side image download proxy ✅

### Network & Infrastructure
- LAN sharing (all devices) ✅
- HTTP server port 8080 ✅
- HTTPS server port 8443 (self-signed SSL) ✅
- All Ollama calls via Express proxy ✅
- Our own /api/fetch-url (no external proxy dependency) ✅

### Developer Tools
- Debug mode (?debug=true) ✅
- Resizable debug panel (drag handle) ✅
- Live log with timestamps + colors ✅
- Select All + copy logs ✅

### Internet Search (NEW - Session 8)
- SearchEngine.js reusable module ✅
- Multi-mode: api / scrape / auto ✅
- Scrape mode: Google + Bing rotation ✅
- API mode: Brave + Google (needs API key) ✅
- 🌐 button in search bar ✅
- Auto-trigger when 0 local results ✅
- Mistral summary of results ✅
- 📥 Import button on each result ✅

---

## 🔧 In Progress (Session 8)

| Item | Status | Notes |
|------|--------|-------|
| Internet search scrape mode | 🔄 Testing | Google/Bing scraping being tested |
| Search button layout fix | 🔄 Testing | Button order + spacing |
| Progress indicator for search | 🔄 Testing | Spinner added |

---

## ❌ Known Issues

| # | Issue | Impact | Fix |
|---|-------|--------|-----|
| 1 | SpeechRecognition available: shows empty in debug | Low | Investigate console override timing |
| 2 | Google scraping may be blocked after 10-20 requests | Medium | Use Brave API as fallback |
| 3 | Self-signed SSL certificate shows browser warning | Low | Expected for LAN, accept once |
| 4 | Voice search HTTPS only (no HTTP) | Low | Always use port 8443 |

---

## 🔑 API Keys & Configuration

| Service | Status | Notes |
|---------|--------|-------|
| Ollama + Mistral 7B | ✅ Running | Port 11434, ~5GB RAM |
| Brave Search API | ❌ Not configured | Free 2000/month, get at api.search.brave.com |
| Google Custom Search | ❌ Not configured | Free 100/day, needs API key + CX |
| SSL Certificate | ✅ Generated | cert.pem + key.pem, valid 1 year |
| Self-signed cert | ✅ Active | Run node gen-cert.js to regenerate |

---

## 🧪 Test Suite Status

| Series | Name | Tests | Status |
|--------|------|-------|--------|
| 1 | Infrastructure | 8 | ✅ 100% |
| 2 | Features | 42 | ✅ 100% |
| 3 | AI Deep Tests | 10 | ✅ 100% |
| **Total** | | **90+** | **✅ 100%** |

**AI Quality Score: 7.1/10** (Mistral self-rating)

---

## 📋 Development Rules

| # | Rule | Description |
|---|------|-------------|
| 1 | ⚠️ Tests First | Add tests before every new feature |
| 2 | 🤖 Ask About LLM | Consider Mistral for every feature |
| 3 | 📁 Specify Files | Name files in every Claude Code prompt |
| 4 | 📋 Full File Paths | Include paths in verification reports |
| 5 | 🔢 Test Numbering | Visible number labels on all tests |
| 6 | 🔄 Reusable Module | Ask if feature should be a module |
| 7 | 🌐 Web Search Config | Ask mode + provider + scrape engine |

---

## 🗺️ Roadmap

| Version | Goal | Status |
|---------|------|--------|
| v2.0 | Core features + AI + tests | ✅ Complete |
| v2.1 | Image CORS + proxy fixes | ✅ Complete |
| v2.2 | Voice search + HTTPS | ✅ Complete |
| v2.3 | Internet search (SearchEngine.js) | 🔄 In Progress |
| v3.0 | Multi-user (UserManager.js module) | ⏳ Planned |
| v4.0 | Firebase Auth (AuthModule.js module) | ⏳ Planned |
| v5.0 | Cloud deployment (CloudSync.js module) | ⏳ Planned |
| v6.0 | Full refactoring into modules | ⏳ Planned |

---

## 🚀 Next Session Plan

1. ✅ Verify internet search scrape results working
2. 🔑 Setup Brave API key if scraping unreliable
3. 🧪 Run full test suite (90+ tests)
4. 📱 Test voice search on mobile devices
5. 💾 Commit + push all Session 8 changes

---

## 🛠️ How To Start

```powershell
cd C:\Users\Vit\Desktop\recipe-book
npm start
```

Then open:
- App: https://192.168.1.2:8443
- Tests: https://192.168.1.2:8443/test.html
- Debug: https://192.168.1.2:8443/?debug=true
