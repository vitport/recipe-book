# Project Context — My Recipe Book

## What This Is

A personal recipe management web app running on a home LAN.
Single HTML file frontend + Node.js/Express backend + flat-file JSON database.
AI-powered via local Ollama/Mistral — no cloud AI costs.

## Current Version: v2.3 (Session 8) ✅ Complete

## Feature List

| # | Feature | Status | Session |
|---|---------|--------|---------|
| 1 | Recipe CRUD (add/edit/delete) | ✅ Done | 1 |
| 2 | Multi-language support (HE/RU/EN) | ✅ Done | 1 |
| 3 | AI recipe parsing from text | ✅ Done | 2 |
| 4 | AI recipe parsing from URL | ✅ Done | 3 |
| 5 | Schema.org / microdata extraction | ✅ Done | 6 |
| 6 | Filter by dish type + kosher type | ✅ Done | 2 |
| 7 | Real-time text search | ✅ Done | 2 |
| 8 | PDF import (OCR via PDF.js) | ✅ Done | 5 |
| 9 | PDF export (jsPDF) | ✅ Done | 5 |
| 10 | Photo manager (multi-photo, reorder) | ✅ Done | 6 |
| 11 | AI image picker from URL | ✅ Done | 6 |
| 12 | Debug mode + drag panel | ✅ Done | 6 |
| 13 | Voice search (SpeechRecognition) | ✅ Done | 7 |
| 14 | Mistral voice intent parsing | ✅ Done | 7 |
| 15 | Mic permission popup | ✅ Done | 7 |
| 16 | Voice visual feedback (interim, pills) | ✅ Done | 7 |
| 17 | HTTPS on port 8443 | ✅ Done | 7 |
| 18 | Debug Select All button | ✅ Done | 7 |
| 19 | SearchEngine.js reusable module | ✅ Done | 8 |
| 20 | Serper API integration (2500 free/month) | ✅ Done | 8 |
| 21 | Auto mode: API first, scrape fallback | ✅ Done | 8 |
| 22 | 🌐 button + auto-trigger on 0 results | ✅ Done | 8 |
| 23 | Mistral summary of internet results | ✅ Done | 8 |
| 24 | 📥 Import Recipe from internet | ✅ Done | 8 |
| 25 | API key secure storage (config.js) | ✅ Done | 8 |
| 26 | /api/config/search key delivery endpoint | ✅ Done | 8 |
| 27 | Multi-user / auth | ⬜ Planned | 9+ |
| 28 | Cloud deployment | ⬜ Planned | Future |

## Test Suite Status

- **Total tests:** 95+
- **Series 1 (Infrastructure):** 1.1.x server, 1.2.x libraries, 1.3.x UI, 1.4.x CRUD, 1.5.x Config & Security
- **Series 2 (Features):** 2.1.x–2.5.x core features, 2.6.x voice search, 2.7.x internet search
- **Series 3 (AI Deep):** 3.1 self-eval, 3.2.x quality, 3.3 cross-language

## Key Files

| File | Lines | Role |
|------|-------|------|
| index.html | ~3200 | Entire frontend + all JS |
| server.js | ~400 | Express: serve, save, proxy, search |
| test.html | ~1800 | Automated test suite |
| modules/SearchEngine.js | ~200 | Reusable internet search module |
| config.js | 5 | API keys (gitignored) |
| config.example.js | 6 | Key template for new devs |
| recipes.json | varies | Recipe database (never edit manually) |
| gen-cert.js | 18 | One-time SSL cert generator |

## Server Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /recipes.json | Get all recipes |
| POST | /save-recipes | Save recipes array |
| GET | /api/ollama/status | Check Ollama health |
| POST | /api/ollama/generate | Proxy to Mistral |
| POST | /api/ollama/release | Free Mistral RAM |
| GET | /api/proxy-image | Download image server-side |
| GET | /api/fetch-url | Fetch external URL server-side |
| GET | /api/config/search | Return API keys to browser securely |
| GET | /api/search | Internet search (Serper API + scrape) |

## Environment

- Node.js v24, Express v4
- Ollama running locally on port 11434 with `mistral:latest`
- Chrome/Edge for voice search (SpeechRecognition)
- LAN access via HTTPS :8443 required for mobile voice search
- Windows 11, Tel Aviv timezone
