import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Volume2, VolumeX, Languages, ChevronDown, Loader2 } from 'lucide-react';

interface VoiceNarrationProps {
  text: string;
  title: string;
  onProgress?: (charIndex: number) => void; // -1 = stopped/finished
  onPlayStateChange?: (isPlaying: boolean, isPaused: boolean) => void;
  controlsRef?: { current: { pause: () => void; resume: () => void } | null };
}

const LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'fr-FR', label: 'French' },
  { code: 'de-DE', label: 'German' },
  { code: 'it-IT', label: 'Italian' },
  { code: 'pt-BR', label: 'Portuguese' },
  { code: 'ja-JP', label: 'Japanese' },
  { code: 'zh-CN', label: 'Chinese' },
  { code: 'ar-SA', label: 'Arabic' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'ru-RU', label: 'Russian' },
  { code: 'ko-KR', label: 'Korean' },
  { code: 'nl-NL', label: 'Dutch' },
  { code: 'pl-PL', label: 'Polish' },
  { code: 'sv-SE', label: 'Swedish' },
  { code: 'tr-TR', label: 'Turkish' },
];

export default function VoiceNarration({ text, title, onProgress, onPlayStateChange, controlsRef }: VoiceNarrationProps) {
  const [isPlaying, setIsPlaying]     = useState(false);
  const [isPaused, setIsPaused]       = useState(false);
  const [progress, setProgress]       = useState(0);
  const [muted, setMuted]             = useState(false);
  const [supported, setSupported]     = useState(false);
  const [selectedLang, setSelectedLang] = useState('en-US');
  const [langOpen, setLangOpen]       = useState(false);
  const [voices, setVoices]           = useState<SpeechSynthesisVoice[]>([]);

  // Refs — survive re-renders without triggering them
  const utteranceRef     = useRef<SpeechSynthesisUtterance | null>(null);
  const totalCharsRef    = useRef(0);
  const langDropRef      = useRef<HTMLDivElement>(null);
  const keepAliveRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPausedRef      = useRef(false);   // source-of-truth for paused state (speechSynthesis.paused unreliable on iOS)
  const mutedRef         = useRef(false);
  const startTimeRef     = useRef(0);
  const estimatedMsRef   = useRef(0);
  const boundaryFiredRef = useRef(false);   // true when onboundary works (not iOS)
  const isIOSRef = useRef(
    typeof navigator !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
  );
  // Android Chrome has the same ~14-second speech cutoff and broken pause/resume as iOS
  const isAndroidRef = useRef(
    typeof navigator !== 'undefined' &&
    /Android/i.test(navigator.userAgent)
  );
  const chunksRef       = useRef<string[]>([]);
  const chunkIndexRef   = useRef(0);
  // Chunk timer: drives onProgress even when onboundary doesn't fire (older Android/iOS)
  const chunkTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunkProgressRef = useRef({ charStart: 0, charLen: 0, startMs: 0, durationMs: 1000 });
  // Exposes the chunk speaker so pauseNarration/resumeNarration can re-speak from a saved index
  const speakChunkRef   = useRef<((index: number) => void) | null>(null);

  // ── Initialise speech synthesis & load voices ────────────────────────────
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    setSupported(true);

    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices(); // synchronous on Chrome desktop
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices); // async on others

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      window.speechSynthesis.cancel();
      clearTimers();
    };
  }, []);

  // ── Close language dropdown on outside click ─────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langDropRef.current && !langDropRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const clearTimers = () => {
    if (keepAliveRef.current)     { clearInterval(keepAliveRef.current);     keepAliveRef.current = null; }
    if (progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null; }
    if (chunkTimerRef.current)    { clearInterval(chunkTimerRef.current);    chunkTimerRef.current = null; }
  };

  const cleanText = (html: string): string => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const splitIntoChunks = (text: string, maxWords = 100): string[] => {
    const parts = text.match(/[^.!?]*[.!?]+\s*/g) || [];
    const remainder = text.slice(parts.reduce((n, p) => n + p.length, 0)).trim();
    if (remainder) parts.push(remainder);
    if (parts.length === 0) return [text];
    const chunks: string[] = [];
    let current = '';
    let count = 0;
    for (const part of parts) {
      const words = part.trim().split(/\s+/).filter(Boolean).length;
      if (count + words > maxWords && current.trim()) {
        chunks.push(current.trim());
        current = part;
        count = words;
      } else {
        current += part;
        count += words;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks.length > 0 ? chunks : [text];
  };

  // ── Playback controls ────────────────────────────────────────────────────
  const startNarration = () => {
    if (!('speechSynthesis' in window)) return;
    clearTimers();
    window.speechSynthesis.cancel();

    const plain = cleanText(text);
    totalCharsRef.current = plain.length;

    // ── Chunk-based narration for ALL platforms ─────────────────────────────
    //   - Avoids Chrome's 14-second silent-cutoff (each chunk ≪ 14s)
    //   - No keepAlive pause/resume → no flicker on Android/desktop
    //   - Pause = cancel current chunk + remember index; Resume = speak that chunk again
    const chunks = splitIntoChunks(plain, 30); // ≤30 words/chunk ≈ ≤11s at rate 0.95
    chunksRef.current = chunks;
    chunkIndexRef.current = 0;

    // Cumulative char offset of each chunk in the full plain text
    const chunkOffsets = chunks.reduce<number[]>((acc, _, i) =>
      [...acc, i === 0 ? 0 : acc[i - 1] + chunks[i - 1].length], []);

    const speakChunk = (index: number) => {
      if (index >= chunks.length) {
        clearTimers();
        isPausedRef.current = false;
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(100);
        onProgress?.(-1);
        return;
      }
      const utt = new SpeechSynthesisUtterance(chunks[index]);
      utt.lang   = selectedLang;
      utt.rate   = 0.95;
      utt.pitch  = 1.0;
      utt.volume = mutedRef.current ? 0 : 1;
      const pref2 =
        voices.find(v => v.lang === selectedLang && (v.name.includes('Google') || v.name.includes('Natural'))) ||
        voices.find(v => v.lang.startsWith(selectedLang.split('-')[0])) ||
        voices.find(v => v.lang === selectedLang);
      if (pref2) utt.voice = pref2;

      utt.onboundary = (e) => {
        if (e.name !== 'word') return;
        onProgress?.(chunkOffsets[index] + e.charIndex);
      };

      const wordCount = Math.max(chunks[index].trim().split(/\s+/).length, 1);
      const durationMs = (wordCount / 2.8) * 1000;
      chunkProgressRef.current = {
        charStart: chunkOffsets[index],
        charLen:   chunks[index].length,
        startMs:   Date.now(),
        durationMs,
      };
      if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
      chunkTimerRef.current = setInterval(() => {
        if (isPausedRef.current) return;
        const { charStart, charLen, startMs, durationMs: dur } = chunkProgressRef.current;
        const pct = Math.min((Date.now() - startMs) / dur, 0.99);
        onProgress?.(charStart + Math.floor(pct * charLen));
      }, 120);

      utt.onend = () => {
        if (chunkTimerRef.current) { clearInterval(chunkTimerRef.current); chunkTimerRef.current = null; }
        if (chunksRef.current.length === 0) return; // stopped
        if (isPausedRef.current)             return; // paused — wait for resume to advance
        chunkIndexRef.current = index + 1;
        setProgress(Math.min(((index + 1) / chunks.length) * 100, 100));
        // Android Chrome drops speak() calls made synchronously inside onend
        if (isAndroidRef.current) setTimeout(() => speakChunk(index + 1), 50);
        else speakChunk(index + 1);
      };
      utt.onerror = (e: any) => {
        if (chunkTimerRef.current) { clearInterval(chunkTimerRef.current); chunkTimerRef.current = null; }
        if (e.error === 'interrupted' || e.error === 'canceled') return;
        clearTimers();
        isPausedRef.current = false;
        setIsPlaying(false);
        setIsPaused(false);
        onProgress?.(-1);
      };
      utteranceRef.current = utt;
      chunkIndexRef.current = index;
      window.speechSynthesis.speak(utt);
    };

    speakChunkRef.current = speakChunk;
    isPausedRef.current = false;
    setIsPlaying(true);
    setIsPaused(false);
    setProgress(0);
    speakChunk(0);
  };

  const pauseNarration = () => {
    // Set the flag BEFORE cancel so chunk's onend handler doesn't auto-advance
    isPausedRef.current = true;
    if (chunkTimerRef.current) { clearInterval(chunkTimerRef.current); chunkTimerRef.current = null; }
    // Use cancel(): pause() is broken on Android Chrome and unreliable elsewhere.
    // Resume re-speaks the saved chunk from its start.
    window.speechSynthesis.cancel();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const resumeNarration = () => {
    if (!speakChunkRef.current) return;
    isPausedRef.current = false;
    setIsPlaying(true);
    setIsPaused(false);
    // Re-speak the chunk we were on; speakChunk re-initialises timer and progress refs
    speakChunkRef.current(chunkIndexRef.current);
  };

  const stopNarration = () => {
    clearTimers();
    window.speechSynthesis.cancel();
    chunksRef.current = [];
    chunkIndexRef.current = 0;
    speakChunkRef.current = null;
    isPausedRef.current = false;
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    onProgress?.(-1);
  };

  const toggleMute = () => {
    const newMuted = !muted;
    mutedRef.current = newMuted;
    setMuted(newMuted);
    if (utteranceRef.current) utteranceRef.current.volume = newMuted ? 0 : 1;
  };

  // ── Server TTS fallback (browsers without Web Speech API) ───────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [ttsLoading, setTtsLoading]     = useState(false);
  const [ttsPlaying, setTtsPlaying]     = useState(false);
  const [ttsError,   setTtsError]       = useState('');
  const [ttsProgress, setTtsProgress]   = useState(0);

  // ── Notify parent of play state (Web Speech API path) ───────────────────
  useEffect(() => {
    if (supported) onPlayStateChange?.(isPlaying, isPaused);
  }, [isPlaying, isPaused, supported]);

  // ── Notify parent of play state (server TTS path) ───────────────────────
  useEffect(() => {
    if (!supported) {
      const paused = !ttsPlaying && ttsProgress > 0 && ttsProgress < 100;
      onPlayStateChange?.(ttsPlaying, paused);
    }
  }, [ttsPlaying, ttsProgress, supported]);

  // ── Keep controlsRef current so parent can call pause/resume ─────────────
  useEffect(() => {
    if (!controlsRef) return;
    if (supported) {
      controlsRef.current = { pause: pauseNarration, resume: resumeNarration };
    } else {
      controlsRef.current = {
        pause:  () => { audioRef.current?.pause();                     setTtsPlaying(false); },
        resume: () => { audioRef.current?.play().catch(() => void 0);  setTtsPlaying(true);  },
      };
    }
  });

  const startServerTts = async () => {
    setTtsError('');
    setTtsLoading(true);
    setTtsProgress(0);
    try {
      const plain = cleanText(text).substring(0, 4096);
      const totalChars = plain.length;
      const res = await fetch('/api/editor-ai/tts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: plain }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as any;
        throw new Error(err.error || `TTS error ${res.status}`);
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const pct = audio.currentTime / audio.duration;
        setTtsProgress(pct * 100);
        onProgress?.(Math.floor(pct * totalChars));
      });
      audio.addEventListener('ended', () => { setTtsPlaying(false); setTtsProgress(100); onProgress?.(-1); });
      audio.addEventListener('error', () => { setTtsPlaying(false); setTtsError('Playback error'); onProgress?.(-1); });

      await audio.play();
      setTtsPlaying(true);
    } catch (e: any) {
      setTtsError(e.message || 'Failed to generate audio');
    } finally {
      setTtsLoading(false);
    }
  };

  const toggleServerTts = () => {
    if (!audioRef.current) { startServerTts(); return; }
    if (ttsPlaying) {
      audioRef.current.pause();
      setTtsPlaying(false);
    } else {
      audioRef.current.play();
      setTtsPlaying(true);
    }
  };

  const stopServerTts = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setTtsPlaying(false);
    setTtsProgress(0);
    onProgress?.(-1);
  };

  if (!supported) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border border-blue-100 dark:border-blue-800/40 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Volume2 size={15} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Listen to this article</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{title}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${ttsProgress}%` }}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={toggleServerTts}
            disabled={ttsLoading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {ttsLoading ? <Loader2 size={14} className="animate-spin" /> : ttsPlaying ? <Pause size={14} /> : <Play size={14} />}
            {ttsLoading ? 'Generating...' : ttsPlaying ? 'Pause' : ttsProgress > 0 ? 'Resume' : 'Play Audio'}
          </button>
          {(ttsPlaying || ttsProgress > 0) && (
            <button
              onClick={stopServerTts}
              className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Square size={14} /> Stop
            </button>
          )}
          {ttsProgress > 0 && ttsProgress < 100 && (
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{Math.round(ttsProgress)}%</span>
          )}
          {ttsProgress >= 100 && <span className="text-xs text-green-500 ml-auto">Finished</span>}
        </div>

        {ttsError && (
          <p className="text-xs text-red-500 mt-2">{ttsError}</p>
        )}
      </div>
    );
  }

  const currentLang = LANGUAGES.find(l => l.code === selectedLang) || LANGUAGES[0];

  return (
    <div className="bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border border-blue-100 dark:border-blue-800/40 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Volume2 size={15} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Listen to this article</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{title}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Language picker */}
          <div className="relative" ref={langDropRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-blue-400 transition-colors shadow-sm"
            >
              <Languages size={13} className="text-blue-500" />
              <span className="hidden sm:inline">{currentLang.label}</span>
              <span className="sm:hidden">{currentLang.code.split('-')[0].toUpperCase()}</span>
              <ChevronDown size={11} className="text-gray-400" />
            </button>
            {langOpen && (
              <div className="absolute top-full mt-1 right-0 z-50 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden max-h-60 overflow-y-auto">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLang(lang.code);
                      setLangOpen(false);
                      if (isPlaying || isPaused) stopNarration();
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                      selectedLang === lang.code
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mute toggle */}
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? (
              <VolumeX size={16} className="text-gray-400" />
            ) : (
              <Volume2 size={16} className="text-blue-500" />
            )}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {!isPlaying && !isPaused && (
          <button
            onClick={startNarration}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Play size={14} />
            Play Audio
          </button>
        )}
        {isPlaying && (
          <button
            onClick={pauseNarration}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Pause size={14} />
            Pause
          </button>
        )}
        {isPaused && (
          <button
            onClick={resumeNarration}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Play size={14} />
            Resume
          </button>
        )}
        {(isPlaying || isPaused || progress > 0) && (
          <button
            onClick={stopNarration}
            className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Square size={14} />
            Stop
          </button>
        )}
        {progress > 0 && progress < 100 && (
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{Math.round(progress)}%</span>
        )}
        {progress >= 100 && (
          <span className="text-xs text-green-500 ml-auto">Finished</span>
        )}
      </div>
    </div>
  );
}
