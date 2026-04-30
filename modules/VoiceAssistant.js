// ═══════════════════════════════════════════════════════
// VoiceAssistant.js — Reusable Voice Assistant Module
// Recipe Book Project — Zeev & Vitaly
// Session 8 — Reusable Module (Rule 6)
//
// Usage: <script src="/modules/VoiceAssistant.js"></script>
//
// Configuration:
// VoiceAssistant.configure({
//   ttsEndpoint: '/api/tts/speak',
//   voicesEndpoint: '/api/tts/voices',
//   ollamaEndpoint: '/api/ollama/generate',
//   voice: 'en_US-lessac-medium',
//   language: 'en',     // 'en' | 'he' | 'ru'
//   speed: 1.0,
//   useMistral: true,
//   systemPrompt: '',   // custom AI personality
//   onAction: null,     // callback: function(intent)
//   onSpeaking: null,   // callback: function(text)
//   onDone: null,       // callback when TTS ends
//   onError: null       // callback: function(error)
// })
//
// Public API:
// VoiceAssistant.speak(text, options)
// VoiceAssistant.listen(onResult)
// VoiceAssistant.chat(userText)
// VoiceAssistant.setVoice(voiceName)
// VoiceAssistant.getVoices()
// VoiceAssistant.stop()
// VoiceAssistant.configure(options)
// ═══════════════════════════════════════════════════════

// ═══ SESSION 8: VoiceAssistant Module ═══
// Piper TTS + browser TTS fallback
// Mistral intent understanding
// Reusable for any app (Rule 6)
// END SESSION 8: VoiceAssistant Module

(function() {
  'use strict';

  const CONFIG = {
    ttsEndpoint: '/api/tts/speak',
    voicesEndpoint: '/api/tts/voices',
    ollamaEndpoint: '/api/ollama/generate',
    searchEndpoint: '/api/search',
    searchApiKey: '',
    enableInternetSearch: false,
    voice: 'en_US-lessac-medium',
    language: 'en',
    speed: 1.0,
    useMistral: true,
    mistralTimeout: 30000,
    systemPrompt: 'You are a helpful assistant.',
    onAction: null,
    onLanguageChange: null,
    onSpeaking: null,
    onDone: null,
    onError: null
  };

  let _currentAudio = null;
  let _isListening = false;
  let _isSpeaking = false;

  // ── SPEAK ────────────────────────────────────────────
  async function speak(text, options = {}) {
    const cfg = { ...CONFIG, ...options };
    if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
    _isSpeaking = true;
    cfg.onSpeaking && cfg.onSpeaking(text);
    window.dbg && window.dbg('🔊 Speaking: ' + text.slice(0, 50));

    try {
      const res = await fetch(cfg.ttsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: cfg.voice, speed: cfg.speed })
      });
      const data = await res.json();

      if (data.error || data.fallback === 'browser') {
        window.dbg && window.dbg('⚠️ Piper unavailable, using browser TTS', 'warn');
        await _browserTTS(text, cfg);
        return;
      }

      const audio = new Audio('data:audio/wav;base64,' + data.audioData);
      _currentAudio = audio;
      audio.playbackRate = cfg.speed;
      audio.onended = () => {
        _isSpeaking = false;
        _currentAudio = null;
        cfg.onDone && cfg.onDone();
      };
      await audio.play();
      window.dbg && window.dbg('🔊 Piper TTS playing: ' + cfg.voice);

    } catch(e) {
      window.dbg && window.dbg('🔊 TTS error: ' + e.message + ' — using browser TTS', 'warn');
      await _browserTTS(text, cfg);
    }
  }

  async function _browserTTS(text, cfg) {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = cfg.language === 'he' ? 'he-IL' :
                       cfg.language === 'ru' ? 'ru-RU' : 'en-US';
      utterance.rate = cfg.speed;
      utterance.onend = () => {
        _isSpeaking = false;
        cfg.onDone && cfg.onDone();
        resolve();
      };
      utterance.onerror = () => { _isSpeaking = false; resolve(); };
      window.speechSynthesis.speak(utterance);
    });
  }

  // ── LISTEN ───────────────────────────────────────────
  function listen(onResult) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      window.dbg && window.dbg('❌ SpeechRecognition not available', 'warn');
      CONFIG.onError && CONFIG.onError('SpeechRecognition not available');
      return false;
    }
    const recognition = new SR();
    recognition.lang = CONFIG.language === 'he' ? 'he-IL' :
                       CONFIG.language === 'ru' ? 'ru-RU' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    _isListening = true;
    window.dbg && window.dbg('🎤 Listening...');

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      _isListening = false;
      window.dbg && window.dbg('🎤 Heard: ' + text);
      onResult && onResult(text);
    };
    recognition.onerror = (e) => {
      _isListening = false;
      window.dbg && window.dbg('🎤 Error: ' + e.error, 'warn');
      CONFIG.onError && CONFIG.onError(e.error);
    };
    recognition.onend = () => { _isListening = false; };
    recognition.start();
    return true;
  }

  // ── INTERNET SEARCH ──────────────────────────────────
  async function searchAndAnswer(query, lang) {
    const searchLang = lang || CONFIG.language || 'en';
    window.dbg && window.dbg('🌐 Searching [' + searchLang + ']: ' + query);
    try {
      const res = await fetch(
        CONFIG.searchEndpoint + '?q=' + encodeURIComponent(query) +
        '&mode=api&provider=serper&key=' + CONFIG.searchApiKey
      );
      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        return 'I searched the internet but found no results for: ' + query;
      }
      const snippets = data.results.slice(0, 3)
        .map(r => r.title + ': ' + r.snippet).join('\n');
      const prompt = `Based on these search results, answer the user's question "${query}" in one or two short spoken sentences. Be direct and natural. Results:\n${snippets}\nAnswer:`;
      const mistralRes = await fetch(CONFIG.ollamaEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'mistral:latest', prompt, stream: false }),
        signal: AbortSignal.timeout(CONFIG.mistralTimeout)
      });
      const mistralData = await mistralRes.json();
      return mistralData.response || 'I found some results but could not summarize them.';
    } catch(e) {
      window.dbg && window.dbg('🌐 Search failed: ' + e.message, 'warn');
      return 'Sorry, I could not search the internet right now.';
    }
  }

  // ── CHAT ─────────────────────────────────────────────
  async function chat(userText) {
    window.dbg && window.dbg('💬 Chat input: ' + userText);

    if (!CONFIG.useMistral) {
      await speak(userText);
      return { text: userText, action: null };
    }

    try {
      const prompt = `${CONFIG.systemPrompt}
User said: "${userText}"
Return ONLY valid JSON, no explanation:
{
  "action": "search|filter|add|open|suggest|answer|internet_search|change_language|unknown",
  "query": "search term if applicable or empty string",
  "language": "en|he|ru|null",
  "dishType": "breakfast|lunch|dinner|dessert|snack|soup|salad|side-dish|null",
  "kosherType": "meat|dairy|pareve|non-kosher|null",
  "response": "friendly short response in SAME language as user said"
}
- internet_search: use when user asks about current events, prices, weather, news, sports scores, or any real-time information
- change_language: use when user asks to switch language, e.g. "speak Russian", "talk in Hebrew", "говори по-русски", "דבר עברית", "switch to English" — set "language" to "en", "he", or "ru"
No ellipsis. No truncation. JSON only.`;

      const res = await fetch(CONFIG.ollamaEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'mistral:latest', prompt, stream: false }),
        signal: AbortSignal.timeout(CONFIG.mistralTimeout)
      });
      const data = await res.json();

      const jsonMatch = data.response?.match(/\{[\s\S]*?\}/);
      const intent = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (intent && CONFIG.onAction) CONFIG.onAction(intent);

      if (intent && intent.action === 'change_language' && intent.language) {
        setLanguage(intent.language);
        if (CONFIG.onLanguageChange) CONFIG.onLanguageChange(intent.language);
      }

      if (intent && intent.action === 'internet_search' && CONFIG.enableInternetSearch) {
        window.dbg && window.dbg('🌐 Triggering internet search: ' + intent.query);
        const answer = await searchAndAnswer(intent.query || userText, intent.language || CONFIG.language);
        await speak(answer);
        return { ...intent, internetAnswer: answer };
      }

      const responseText = intent?.response || data.response || 'I understood!';
      await speak(responseText);
      return intent;

    } catch(e) {
      window.dbg && window.dbg('💬 Chat error: ' + e.message, 'warn');
      await speak('Sorry, I had trouble understanding that.');
      return null;
    }
  }

  // ── VOICE MANAGEMENT ─────────────────────────────────
  async function getVoices() {
    try {
      const res = await fetch(CONFIG.voicesEndpoint);
      const data = await res.json();
      return data.voices || ['en_US-lessac-medium'];
    } catch(e) {
      return ['en_US-lessac-medium', 'en_US-ryan-medium'];
    }
  }

  function setVoice(voiceName) {
    CONFIG.voice = voiceName;
    window.dbg && window.dbg('🔊 Voice: ' + voiceName);
  }

  function stop() {
    if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
    window.speechSynthesis?.cancel();
    _isSpeaking = false;
    _isListening = false;
  }

  function configure(options) { Object.assign(CONFIG, options); }

  function setLanguage(lang) {
    CONFIG.language = lang;
    window.dbg && window.dbg('🌐 Language switched to: ' + lang);
  }

  async function detectLanguage(text) {
    try {
      const prompt = `Detect the language of this text. The user may be speaking Hebrew, Russian, or English.
Text: "${text}"
Return ONLY valid JSON, no explanation:
{
  "language": "en|he|ru",
  "confidence": "high|low",
  "isGarbled": true,
  "meaning": "your best guess at what they meant in English"
}
Rules:
- isGarbled: true if text looks like phonetic spelling of another language
- Examples of garbled: "gauri porowski" = garbled Russian, "dvar ivrit" = garbled Hebrew
- confidence: high if you are sure, low if unsure
JSON only. No ellipsis.`;
      const res = await fetch(CONFIG.ollamaEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'mistral:latest', prompt, stream: false }),
        signal: AbortSignal.timeout(15000)
      });
      const data = await res.json();
      const jsonMatch = data.response?.match(/\{[\s\S]*?\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) :
        { language: 'en', confidence: 'low', isGarbled: false, meaning: text };
    } catch(e) {
      window.dbg && window.dbg('🔍 Language detection failed: ' + e.message, 'warn');
      return { language: 'en', confidence: 'low', isGarbled: false, meaning: text };
    }
  }

  function relisten(lang, onResult) {
    window.dbg && window.dbg('🔄 Re-listening in: ' + lang);
    CONFIG.language = lang;
    listen(onResult);
  }

  window.VoiceAssistant = { speak, listen, chat, setVoice, getVoices, stop, configure, searchAndAnswer, setLanguage, detectLanguage, relisten };

})();
