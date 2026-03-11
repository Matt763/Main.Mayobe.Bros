import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Volume2, VolumeX, Languages, ChevronDown } from 'lucide-react';

interface VoiceNarrationProps {
  text: string;
  title: string;
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

export default function VoiceNarration({ text, title }: VoiceNarrationProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(false);
  const [supported, setSupported] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en-US');
  const [langOpen, setLangOpen] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const totalCharsRef = useRef(0);
  const langDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSupported('speechSynthesis' in window);
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langDropRef.current && !langDropRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const cleanText = (html: string): string => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const startNarration = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const plain = cleanText(text);
    totalCharsRef.current = plain.length;

    const utterance = new SpeechSynthesisUtterance(plain);
    utterance.lang = selectedLang;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = muted ? 0 : 1;

    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find(v => v.lang === selectedLang && (v.name.includes('Google') || v.name.includes('Natural'))) ||
      voices.find(v => v.lang.startsWith(selectedLang.split('-')[0])) ||
      voices.find(v => v.lang === selectedLang);
    if (preferred) utterance.voice = preferred;

    utterance.onboundary = (e) => {
      if (e.name === 'word') {
        const pct = totalCharsRef.current > 0 ? (e.charIndex / totalCharsRef.current) * 100 : 0;
        setProgress(Math.min(pct, 100));
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
    setProgress(0);
  };

  const pauseNarration = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const resumeNarration = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
    }
  };

  const stopNarration = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
  };

  const toggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    if (utteranceRef.current) utteranceRef.current.volume = newMuted ? 0 : 1;
  };

  if (!supported) return null;

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

          <button
            onClick={toggleMute}
            className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            {muted ? (
              <VolumeX size={16} className="text-gray-400" />
            ) : (
              <Volume2 size={16} className="text-blue-500" />
            )}
          </button>
        </div>
      </div>

      <div className="h-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

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
