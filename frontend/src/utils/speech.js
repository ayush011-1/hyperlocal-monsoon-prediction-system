/**
 * Robust Web Speech API Utility for Agromet Decision Support System
 * Supports Multilingual Voice Input (Speech Recognition) and Audio Playback (Speech Synthesis)
 * Optimized for Marathi (mr-IN), Hindi (hi-IN), and Indian English (en-IN).
 */

// Global reference to prevent Chromium garbage collection of active utterances
let activeUtterance = null;

/**
 * Clean markdown symbols, emojis, and special characters from text before speaking
 */
export function cleanTextForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold asterisks
    .replace(/[*_#`~\[\]\(\)]/g, ' ') // Markdown symbols
    .replace(/[🌱🌾🌧️🌤️☀️⚠️🔊▶•–—]/g, ' ') // Emojis and bullet points
    .replace(/https?:\/\/\S+/g, '') // URLs
    .replace(/[\n\r]+/g, '. ') // Replace newlines with periods for natural pauses
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find the most suitable voice from available synthesis voices
 */
export function getBestVoice(language = 'en', voices = []) {
  const voiceList = voices.length > 0 ? voices : (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : []);
  if (!voiceList || voiceList.length === 0) return null;

  const langCode = (language || 'en').toLowerCase();

  if (langCode === 'mr' || langCode.startsWith('mr')) {
    // 1. Try native Marathi voice
    const mrVoice = voiceList.find(v => v.lang === 'mr-IN' || v.lang.toLowerCase().startsWith('mr'));
    if (mrVoice) return mrVoice;

    // 2. Fall back to Hindi voice: Marathi is written in Devanagari script.
    // Hindi TTS engines (e.g. Lekha on macOS, Google हिन्दी on Chrome) pronounce Marathi Devanagari naturally!
    const hiVoice = voiceList.find(v => v.lang === 'hi-IN' || v.lang.toLowerCase().startsWith('hi'));
    if (hiVoice) return hiVoice;

    // 3. Indian English
    const inVoice = voiceList.find(v => v.lang === 'en-IN' || v.lang.includes('IN'));
    if (inVoice) return inVoice;
  } else if (langCode === 'hi' || langCode.startsWith('hi')) {
    const hiVoice = voiceList.find(v => v.lang === 'hi-IN' || v.lang.toLowerCase().startsWith('hi'));
    if (hiVoice) return hiVoice;
    const inVoice = voiceList.find(v => v.lang === 'en-IN' || v.lang.includes('IN'));
    if (inVoice) return inVoice;
  } else {
    const enInVoice = voiceList.find(v => v.lang === 'en-IN' || v.lang === 'en_IN');
    if (enInVoice) return enInVoice;
    const enVoice = voiceList.find(v => v.lang.toLowerCase().startsWith('en'));
    if (enVoice) return enVoice;
  }

  // Fallback to default system voice
  return voiceList.find(v => v.default) || voiceList[0] || null;
}

/**
 * Speak text with Web Speech API SpeechSynthesis
 */
export function speakText(text, { language = 'en', onStart, onEnd, onError, rate = 0.93, pitch = 1.0 } = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onError) onError(new Error('Speech synthesis not supported in this browser.'));
    return false;
  }

  try {
    // Stop any existing speech
    window.speechSynthesis.cancel();

    const cleaned = cleanTextForSpeech(text);
    if (!cleaned) return false;

    const utterance = new SpeechSynthesisUtterance(cleaned);
    activeUtterance = utterance; // Keep reference to prevent GC bug

    const availableVoices = window.speechSynthesis.getVoices();
    const voice = getBestVoice(language, availableVoices);

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
    }

    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      activeUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      activeUtterance = null;
      if (onError) onError(e);
    };

    // Chrome unpause fix
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error('speakText error:', err);
    activeUtterance = null;
    if (onError) onError(err);
    return false;
  }
}

/**
 * Cancel any ongoing speech synthesis
 */
export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  activeUtterance = null;
}

/**
 * Check if browser supports Speech Recognition
 */
export function isSpeechRecognitionSupported() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Initialize and start Speech Recognition
 */
export function createSpeechRecognition({
  language = 'en',
  onStart,
  onInterimResult,
  onFinalResult,
  onError,
  onEnd
}) {
  const SpeechRecognitionClass =
    typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

  if (!SpeechRecognitionClass) {
    if (onError) {
      onError({
        error: 'not-supported',
        message: 'Speech recognition is not supported in this browser. Please use Chrome or Edge.'
      });
    }
    return null;
  }

  const recognition = new SpeechRecognitionClass();

  // Language mapping
  if (language === 'mr' || language.startsWith('mr')) {
    recognition.lang = 'mr-IN';
  } else if (language === 'hi' || language.startsWith('hi')) {
    recognition.lang = 'hi-IN';
  } else {
    recognition.lang = 'en-IN';
  }

  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  let hasDispatchedFinal = false;

  recognition.onstart = () => {
    hasDispatchedFinal = false;
    if (onStart) onStart();
  };

  recognition.onresult = (event) => {
    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const item = event.results[i];
      if (item.isFinal) {
        final += item[0].transcript;
      } else {
        interim += item[0].transcript;
      }
    }

    if (interim && onInterimResult) {
      onInterimResult(interim);
    }

    if (final && !hasDispatchedFinal) {
      hasDispatchedFinal = true;
      if (onFinalResult) {
        onFinalResult(final.trim());
      }
    }
  };

  recognition.onerror = (event) => {
    console.warn('SpeechRecognition error:', event.error);
    if (onError) onError(event);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch (e) {
        console.warn('Recognition start exception:', e);
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch (e) {}
    },
    abort: () => {
      try {
        recognition.abort();
      } catch (e) {}
    },
    instance: recognition
  };
}
