# Project Context — My Recipe Book

## What This Is

A personal recipe management web app running on a home LAN.
Single HTML file frontend + Node.js/Express backend + flat-file JSON database.
AI-powered via local Ollama/Mistral — no cloud AI costs.

## Current Version: v2.2 (Session 7)

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
| 19 | Multi-user / auth | ⬜ Planned | 8+ |
| 20 | Cloud deployment | ⬜ Planned | Future |

## Test Suite Status

- **Total tests:** 72
- **Series 1 (Infrastructure):** 1.1.1–1.1.8, 1.2.1–1.2.4
- **Series 2 (Features):** 2.1.x CRUD, 2.2.x AI Parse, 2.3.x PDF, 2.4.x URL Fetch, 2.5.x Photos, 2.6.x Voice Search
- **Series 3 (AI Deep):** 3.1 self-eval, 3.2.x quality, 3.3 cross-language

## Key Files

| File | Lines | Role |
|------|-------|------|
| index.html | ~3100 | Entire frontend + all JS |
| server.js | ~225 | Express: serve, save, proxy |
| test.html | ~1600 | Automated test suite |
| recipes.json | varies | Recipe database (never edit manually) |
| gen-cert.js | 18 | One-time SSL cert generator |
| CLAUDE_PROJECT_INSTRUCTIONS.md | — | Claude operating manual |

## Environment

- Node.js v24, Express v4
- Ollama running locally on port 11434 with `mistral:latest`
- Chrome/Edge for voice search (SpeechRecognition)
- LAN access via HTTPS :8443 required for mobile voice search
- Windows 11, Tel Aviv timezone
