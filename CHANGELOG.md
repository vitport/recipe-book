# 📋 Changelog
**My Recipe Book | Version History**
*Zeev & Vitaly | 2026*

---

## [v2.3] — Session 8 — April 2026
### Added
- 🌐 Internet search via Serper API (2500 free queries)
- 📦 SearchEngine.js reusable module (Rule 6 + Rule 7)
- 🔄 Multi-mode search: api / scrape / auto
- 🌐 Web search button in search bar
- 📥 Import Recipe from internet results
- 🤖 Mistral AI summary of search results
- 🔒 API key security (config.js gitignored)
- 📊 PROJECT_STATE.md created
- 8 development rules established

### Added (continued)
- 🎤 VoiceAssistant.js reusable module (Rule 6)
- 🔊 Piper TTS integration + browser TTS fallback
- 🤖 Mistral intent understanding for voice commands
- 🎨 voice-assistant.html standalone dark-theme app
- 🧪 voice-test.html dedicated module test page
- 🧪 tests.html test hub (all module tests in one place)
- 📋 Rule 9: Module test pages standard
- 🧪 110+ tests total (100 recipe book + 8 voice + 5 memory)
- 🧠 Memory leak test suite added (group 1.6 Memory & Performance)
- 📊 AI Score improved: 7.1 → 7.6

### Fixed
- DuckDuckGo API replaced with Serper API
- Google scraping blocked → API fallback

---

## [v2.2] — Session 7 — April 2026
### Added
- 🎤 Voice search with Web Speech API
- 🤖 Mistral intent parsing (Hebrew/English/Russian)
- 🔐 HTTPS server on port 8443 (self-signed SSL)
- 💬 Microphone permission popup (ChatGPT-style)
- 🎨 Visual recording feedback (pulsing button, live text)
- 📋 Select All in debug log
- 🔢 Rule 5: Test numbering
- 🔄 Rule 6: Reusable modules
- 🌐 Rule 7: Web search configuration

---

## [v2.1] — Session 6 — April 2026
### Added
- 🐛 Debug mode (?debug=true)
- 📏 Resizable debug panel (drag handle)
- 📋 Live log with timestamps + colors
- 🔗 Our own /api/fetch-url (no external proxy)
- ⚡ Schema.org JSON-LD extraction (instant import)
- 📋 HTML microdata extraction
- 🔧 All Ollama calls fixed via Express proxy

### Fixed
- Image CORS fixed via server proxy
- Ollama memory release fixed
- All direct localhost:11434 calls replaced

---

## [v2.0] — Sessions 1-5 — April 2026
### Added
- 🍳 Recipe CRUD (Create, Read, Update, Delete)
- 🌍 Multilingual: Hebrew, English, Russian + RTL
- 🤖 Mistral 7B local AI via Ollama
- 📥 URL / PDF / Photo / Text import
- 📤 PDF + JSON export
- 🖼️ Image picker with Mistral food detection
- 📸 Photo manager (multi-photo per recipe)
- 🔍 Search, filter, sort
- 🧪 75+ AI-powered tests
- 🌐 LAN network sharing
- 🖥️ Node.js Express server
