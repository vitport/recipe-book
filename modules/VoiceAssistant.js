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
    voice: 'en_US-lessac-medium',
    language: 'en',
    speed: 1.0,
    useMistral: true,
    mistralTimeout: 30000,
    systemPrompt: 'You are a helpful assistant.',
    onAction: null,
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
  "action": "search|filter|add|open|suggest|answer|unknown",
  "query": "search term if applicable or empty string",
  "dishType": "breakfast|lunch|dinner|dessert|snack|soup|salad|side-dish|null",
  "kosherType": "meat|dairy|pareve|non-kosher|null",
  "response": "friendly short response in SAME language as user said"
}
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
      window.dbg && window.dbg('🤖 Intent: ' + JSON.stringify(intent));

      if (intent && CONFIG.onAction) CONFIG.onAction(intent);

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

  window.VoiceAssistant = { speak, listen, chat, setVoice, getVoices, stop, configure };

})();
