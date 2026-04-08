import { useState } from 'react';
import {
  Mic, Captions, TrendingUp, Film,
  Loader2, Download, Play, Square, CheckCircle2,
  AlertCircle, RefreshCw, Copy, ChevronDown, ChevronUp,
  Volume2, Zap,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type MediaTab = 'voiceover' | 'subtitles' | 'discover' | 'shorts';

interface DiscoverResult {
  score: number;
  grade: string;
  verdict: string;
  criteria: { name: string; pass: boolean; note: string }[];
  improvements: string[];
  strengths: string[];
}

interface SubtitleCue {
  index: number;
  start: string;
  end: string;
  text: string;
}

interface ShortsResult {
  hook: string;
  script: string;
  hashtags: string[];
  duration: string;
  platforms: string[];
}

// ── Voice options ─────────────────────────────────────────────────────────────

const VOICES = [
  { id: 'alloy',   label: 'Alloy',   style: 'Neutral',       gender: 'neutral' },
  { id: 'echo',    label: 'Echo',    style: 'Calm',          gender: 'male' },
  { id: 'fable',   label: 'Fable',   style: 'Storytelling',  gender: 'male' },
  { id: 'onyx',    label: 'Onyx',    style: 'Documentary',   gender: 'male' },
  { id: 'nova',    label: 'Nova',    style: 'Energetic',     gender: 'female' },
  { id: 'shimmer', label: 'Shimmer', style: 'Soft & Warm',   gender: 'female' },
] as const;

type VoiceId = typeof VOICES[number]['id'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function scoreColor(s: number) {
  if (s >= 80) return '#22c55e';
  if (s >= 60) return '#f59e0b';
  return '#ef4444';
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs">
      <AlertCircle size={13} className="shrink-0 mt-0.5" /> {msg}
    </div>
  );
}

// ── Voiceover Panel ───────────────────────────────────────────────────────────

function VoiceoverPanel({ content, title }: { content: string; title: string }) {
  const [voice, setVoice]       = useState<VoiceId>('nova');
  const [speed, setSpeed]       = useState(1.0);
  const [source, setSource]     = useState<'excerpt' | 'custom'>('excerpt');
  const [customText, setCustomText] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const plainContent = stripHtml(content);
  const excerpt      = plainContent.slice(0, 800).trim();
  const inputText    = source === 'excerpt' ? excerpt : customText.trim();

  const generate = async () => {
    if (!inputText) { setError('Add content first.'); return; }
    setLoading(true); setError(null); setAudioUrl(null);
    try {
      const res = await fetch('/api/editor-ai/voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: inputText, voice, speed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      // Convert base64 → blob URL
      const bytes = Uint8Array.from(atob(data.audioBase64), c => c.charCodeAt(0));
      const blob  = new Blob([bytes], { type: 'audio/mpeg' });
      setAudioUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'voiceover'}.mp3`;
    a.click();
  };

  return (
    <div className="p-4 space-y-4">
      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl text-xs text-purple-700 dark:text-purple-300">
        Generates a natural AI voiceover using OpenAI TTS. Ideal for intros, summaries, or social clips.
      </div>

      {/* Source selector */}
      <div>
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
          Text source
        </label>
        <div className="flex gap-2">
          {(['excerpt', 'custom'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                source === s
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {s === 'excerpt' ? `Auto intro (${excerpt.split(' ').length}w)` : 'Custom script'}
            </button>
          ))}
        </div>
        {source === 'custom' && (
          <textarea
            value={customText}
            onChange={e => setCustomText(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Write the narration script… (max 1 000 chars)"
            className="mt-2 w-full text-xs px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        )}
      </div>

      {/* Voice selector */}
      <div>
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
          Voice
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {VOICES.map(v => (
            <button
              key={v.id}
              onClick={() => setVoice(v.id)}
              className={`flex flex-col items-start px-3 py-2 rounded-xl text-left text-xs transition-colors border ${
                voice === v.id
                  ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-purple-300 hover:bg-purple-50/50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="font-bold">{v.label}</span>
              <span className="text-[10px] opacity-70">{v.style} · {v.gender}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Speed slider */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Speed
          </label>
          <span className="text-xs font-bold text-purple-600">{speed.toFixed(2)}×</span>
        </div>
        <input
          type="range" min={0.75} max={1.25} step={0.05} value={speed}
          onChange={e => setSpeed(parseFloat(e.target.value))}
          className="w-full accent-purple-600"
        />
        <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
          <span>0.75× slower</span><span>1.25× faster</span>
        </div>
      </div>

      <button
        onClick={generate}
        disabled={loading || !inputText}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-md"
      >
        {loading
          ? <><Loader2 size={14} className="animate-spin" /> Generating voiceover…</>
          : <><Volume2 size={14} /> Generate Voiceover</>
        }
      </button>

      {error && <ErrorBox msg={error} />}

      {audioUrl && (
        <div className="space-y-2">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={14} className="text-green-500" />
              <span className="text-xs font-semibold text-green-700 dark:text-green-300">Voiceover ready</span>
            </div>
            <audio src={audioUrl} controls className="w-full h-8" />
          </div>
          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 rounded-xl text-xs font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          >
            <Download size={12} /> Download MP3
          </button>
        </div>
      )}
    </div>
  );
}

// ── Subtitles Panel ───────────────────────────────────────────────────────────

function SubtitlesPanel({ content, title }: { content: string; title: string }) {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [cues, setCues]         = useState<SubtitleCue[]>([]);
  const [vttBlob, setVttBlob]   = useState<string | null>(null);
  const [wpm, setWpm]           = useState(150);
  const [lang, setLang]         = useState('en');

  const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'sw', label: 'Swahili' },
    { code: 'fr', label: 'French' },
    { code: 'ar', label: 'Arabic' },
    { code: 'es', label: 'Spanish' },
    { code: 'pt', label: 'Portuguese' },
  ];

  const generate = async () => {
    const plainText = stripHtml(content);
    if (plainText.length < 100) { setError('Write at least 100 words first.'); return; }
    setLoading(true); setError(null); setCues([]); setVttBlob(null);
    try {
      const res = await fetch('/api/editor-ai/subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content, title, wpm, lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setCues(data.cues);
      // Build VTT text and create blob URL
      const vttText = buildVTT(data.cues);
      const blob = new Blob([vttText], { type: 'text/vtt' });
      setVttBlob(URL.createObjectURL(blob));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  function buildVTT(items: SubtitleCue[]): string {
    const lines = ['WEBVTT', ''];
    for (const c of items) {
      lines.push(`${c.index}`);
      lines.push(`${c.start} --> ${c.end}`);
      lines.push(c.text);
      lines.push('');
    }
    return lines.join('\n');
  }

  const downloadVTT = () => {
    if (!vttBlob) return;
    const a = document.createElement('a');
    a.href = vttBlob;
    a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'subtitles'}.vtt`;
    a.click();
  };

  const copyVTT = () => {
    if (!cues.length) return;
    navigator.clipboard.writeText(buildVTT(cues));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300">
        Auto-generates VTT subtitle file from article text. Add to any video player — Plyr supports VTT captions natively.
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">Language</label>
          <select
            value={lang}
            onChange={e => setLang(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Speech speed</label>
            <span className="text-xs font-bold text-blue-600">{wpm} wpm</span>
          </div>
          <input
            type="range" min={100} max={200} step={10} value={wpm}
            onChange={e => setWpm(parseInt(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>
      </div>

      <button
        onClick={generate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-md"
      >
        {loading
          ? <><Loader2 size={14} className="animate-spin" /> Generating subtitles…</>
          : <><Captions size={14} /> Generate VTT Subtitles</>
        }
      </button>

      {error && <ErrorBox msg={error} />}

      {cues.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {cues.length} cues · {cues[cues.length - 1]?.end}
            </span>
            <div className="flex gap-1.5">
              <button onClick={copyVTT} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Copy VTT">
                <Copy size={13} className="text-gray-500" />
              </button>
              <button onClick={generate} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Regenerate">
                <RefreshCw size={13} className="text-gray-500" />
              </button>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-800/50">
            {cues.slice(0, 12).map(c => (
              <div key={c.index} className="flex gap-2 text-[11px]">
                <span className="text-gray-400 shrink-0 font-mono">{c.start.slice(3, 8)}</span>
                <span className="text-gray-700 dark:text-gray-300">{c.text}</span>
              </div>
            ))}
            {cues.length > 12 && (
              <p className="text-center text-[10px] text-gray-400 pt-1">+{cues.length - 12} more cues</p>
            )}
          </div>
          <button
            onClick={downloadVTT}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 rounded-xl text-xs font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <Download size={12} /> Download .vtt file
          </button>
        </div>
      )}
    </div>
  );
}

// ── Google Discover Panel ─────────────────────────────────────────────────────

function DiscoverPanel({ title, content }: { title: string; content: string }) {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [result, setResult]     = useState<DiscoverResult | null>(null);
  const [expanded, setExpanded] = useState(false);

  const analyze = async () => {
    if (!title || !content) { setError('Add title and content first.'); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/editor-ai/discover-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const gradeLabel = result
    ? { A: 'Excellent', B: 'Good', C: 'Fair', D: 'Needs work', F: 'Poor' }[result.grade] || result.grade
    : '';

  return (
    <div className="p-4 space-y-4">
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-300">
        Analyzes your post against Google Discover ranking signals: image quality, headline appeal, content depth, freshness, and E-E-A-T.
      </div>

      {!result && (
        <button
          onClick={analyze}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-md"
        >
          {loading
            ? <><Loader2 size={14} className="animate-spin" /> Analyzing for Discover…</>
            : <><TrendingUp size={14} /> Analyze Discover Readiness</>
          }
        </button>
      )}

      {error && <ErrorBox msg={error} />}

      {result && (
        <div className="space-y-3">
          {/* Score ring */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl border border-amber-100 dark:border-amber-900">
            <div className="relative w-16 h-16 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3" className="stroke-gray-200 dark:stroke-gray-700" />
                <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${result.score} 100`}
                  style={{ stroke: scoreColor(result.score) }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-black" style={{ color: scoreColor(result.score) }}>
                  {result.score}
                </span>
              </div>
            </div>
            <div>
              <div className="text-base font-bold text-gray-900 dark:text-white">
                Grade {result.grade} — {gradeLabel}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{result.verdict}</p>
            </div>
          </div>

          {/* Criteria checklist */}
          <div className="space-y-1.5">
            {result.criteria.map((c, i) => (
              <div key={i} className={`flex items-start gap-2 p-2.5 rounded-xl text-xs border ${
                c.pass
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900'
              }`}>
                <div className={`w-3 h-3 rounded-full shrink-0 mt-0.5 ${c.pass ? 'bg-green-500' : 'bg-red-400'}`} />
                <div>
                  <span className={`font-semibold ${c.pass ? 'text-green-700 dark:text-green-300' : 'text-red-600 dark:text-red-400'}`}>
                    {c.name}
                  </span>
                  {c.note && <span className="text-gray-500 dark:text-gray-400 ml-1">— {c.note}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Improvements */}
          {result.improvements.length > 0 && (
            <div>
              <button
                onClick={() => setExpanded(v => !v)}
                className="flex items-center justify-between w-full text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider py-1"
              >
                <span>{result.improvements.length} improvements</span>
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {expanded && (
                <div className="space-y-1.5 mt-1">
                  {result.improvements.map((imp, i) => (
                    <div key={i} className="flex gap-2 text-xs p-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl text-blue-700 dark:text-blue-300">
                      <span className="shrink-0 font-bold">{i + 1}.</span>
                      <span>{imp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button onClick={() => setResult(null)} className="w-full text-xs text-gray-400 hover:text-amber-600 transition-colors py-1 flex items-center justify-center gap-1">
            <RefreshCw size={11} /> Re-analyze
          </button>
        </div>
      )}
    </div>
  );
}

// ── Shorts Script Panel ───────────────────────────────────────────────────────

function ShortsPanel({ title, content }: { title: string; content: string }) {
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [result, setResult]       = useState<ShortsResult | null>(null);
  const [format, setFormat]       = useState<'15s' | '30s' | '60s'>('30s');
  const [platform, setPlatform]   = useState<'reels' | 'tiktok' | 'shorts'>('reels');
  const [copied, setCopied]       = useState(false);

  const generate = async () => {
    if (!title || !content) { setError('Add title and content first.'); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch('/api/editor-ai/shorts-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, content, format, platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!result) return;
    const text = `HOOK:\n${result.hook}\n\nSCRIPT:\n${result.script}\n\nHASHTAGS:\n${result.hashtags.join(' ')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="p-3 bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800 rounded-xl text-xs text-pink-700 dark:text-pink-300">
        AI generates a ready-to-record short video script — hook, narration, and hashtags — from your article.
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">Duration</label>
          <div className="flex gap-1">
            {(['15s', '30s', '60s'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  format === f
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">Platform</label>
          <select
            value={platform}
            onChange={e => setPlatform(e.target.value as any)}
            className="w-full text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:outline-none"
          >
            <option value="reels">Instagram Reels</option>
            <option value="tiktok">TikTok</option>
            <option value="shorts">YouTube Shorts</option>
          </select>
        </div>
      </div>

      <button
        onClick={generate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-md"
      >
        {loading
          ? <><Loader2 size={14} className="animate-spin" /> Writing script…</>
          : <><Zap size={14} /> Generate Shorts Script</>
        }
      </button>

      {error && <ErrorBox msg={error} />}

      {result && (
        <div className="space-y-3">
          {/* Hook */}
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
            <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400 mb-1">Opening Hook</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{result.hook}</p>
          </div>

          {/* Script */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Script · {result.duration}
            </p>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{result.script}</p>
          </div>

          {/* Hashtags */}
          <div className="flex flex-wrap gap-1.5">
            {result.hashtags.map((h, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full font-medium">
                {h}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={copy}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {copied ? <CheckCircle2 size={12} className="text-green-500" /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy all'}
            </button>
            <button
              onClick={generate}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-400 rounded-xl text-xs font-semibold hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
            >
              <RefreshCw size={12} /> Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main AIMediaPanel ─────────────────────────────────────────────────────────

const MEDIA_TABS: { id: MediaTab; label: string; icon: typeof Mic; color: string }[] = [
  { id: 'voiceover', label: 'Voiceover',  icon: Mic,        color: 'text-purple-500' },
  { id: 'subtitles', label: 'Subtitles',  icon: Captions,   color: 'text-blue-500'   },
  { id: 'discover',  label: 'Discover',   icon: TrendingUp, color: 'text-amber-500'  },
  { id: 'shorts',    label: 'Shorts',     icon: Film,       color: 'text-pink-500'   },
];

interface AIMediaPanelProps {
  title: string;
  content: string;
}

export default function AIMediaPanel({ title, content }: AIMediaPanelProps) {
  const [activeTab, setActiveTab] = useState<MediaTab>('voiceover');

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 shrink-0">
        {MEDIA_TABS.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-all border-b-2 ${
              activeTab === id
                ? `border-violet-500 ${color} bg-white dark:bg-gray-900`
                : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <Icon size={14} />
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'voiceover' && <VoiceoverPanel content={content} title={title} />}
        {activeTab === 'subtitles' && <SubtitlesPanel content={content} title={title} />}
        {activeTab === 'discover'  && <DiscoverPanel  title={title}   content={content} />}
        {activeTab === 'shorts'    && <ShortsPanel    title={title}   content={content} />}
      </div>
    </div>
  );
}
