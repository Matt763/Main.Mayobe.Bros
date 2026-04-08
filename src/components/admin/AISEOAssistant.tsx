import { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Search, FileText, Tag, BarChart2, Loader2,
  ChevronDown, ChevronUp, CheckCircle2, AlertCircle, TrendingUp,
  Key, X, RefreshCw, Zap, Bot,
} from 'lucide-react';

interface AISEOAssistantProps {
  title: string;
  content: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  onSetMetaTitle: (v: string) => void;
  onSetMetaDescription: (v: string) => void;
  onSetMetaKeywords: (v: string) => void;
  onSetExcerpt: (v: string) => void;
}

type ApiProvider = 'claude' | 'openai';
type ActiveTab = 'generate' | 'analyze';

interface SeoScore {
  overall: number;
  details: { label: string; pass: boolean; info: string }[];
  suggestions: string[];
  wordCount: number;
}

interface SeoAutoResult {
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
  excerpt: string;
}

function computeSeoScore(
  title: string,
  content: string,
  metaTitle: string,
  metaDescription: string,
  metaKeywords: string,
): SeoScore {
  const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const h2Count = (content.match(/<h2/gi) || []).length;
  const h3Count = (content.match(/<h3/gi) || []).length;
  const imgCount = (content.match(/<img/gi) || []).length;
  const imgAltCount = (content.match(/alt="[^"]+"/gi) || []).length;
  const internalLinkCount = (content.match(/href="\//gi) || []).length;

  const effectiveTitle = metaTitle || title;
  const titleLen = effectiveTitle.length;
  const descLen = metaDescription.length;
  const keywords = metaKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);

  const titleScore =
    titleLen >= 50 && titleLen <= 60 ? 100 :
    titleLen >= 40 && titleLen <= 70 ? 75 :
    titleLen > 0 ? 40 : 0;

  const descScore =
    descLen >= 150 && descLen <= 160 ? 100 :
    descLen >= 120 && descLen <= 170 ? 75 :
    descLen > 0 ? 40 : 0;

  const keywordScore = keywords.length === 0 ? 0 :
    keywords.length >= 5 ? 100 :
    keywords.length >= 3 ? 70 : 40;

  const contentLengthScore =
    wordCount >= 4000 ? 100 :
    wordCount >= 2000 ? 80 :
    wordCount >= 1000 ? 55 :
    wordCount >= 500 ? 30 : 0;

  const headingScore = h2Count >= 3 ? 100 : h2Count >= 2 ? 75 : h2Count >= 1 ? 50 : 0;
  const altScore = imgCount === 0 ? 80 : imgAltCount === imgCount ? 100 : Math.round((imgAltCount / imgCount) * 100);
  const internalLinkScore = internalLinkCount >= 3 ? 100 : internalLinkCount >= 1 ? 60 : 0;

  const overall = Math.round(
    titleScore * 0.2 + descScore * 0.15 + keywordScore * 0.15 +
    contentLengthScore * 0.25 + headingScore * 0.1 + altScore * 0.05 + internalLinkScore * 0.1
  );

  const suggestions: string[] = [];
  if (titleLen < 50 || titleLen > 60) suggestions.push(`Meta title: ${titleLen} chars. Aim for 50–60.`);
  if (descLen < 150 || descLen > 160) suggestions.push(`Meta description: ${descLen} chars. Aim for 150–160.`);
  if (keywords.length < 5) suggestions.push('Add at least 5 keywords.');
  if (wordCount < 4000) suggestions.push(`Content is ${wordCount} words. Aim for 4,000–5,000.`);
  if (h2Count < 2) suggestions.push('Add at least 2 H2 headings.');
  if (imgCount > 0 && imgAltCount < imgCount) suggestions.push(`${imgCount - imgAltCount} image(s) missing alt text.`);
  if (internalLinkCount === 0) suggestions.push('Add internal links.');

  const details = [
    { label: 'Meta title (50–60 chars)', pass: titleLen >= 50 && titleLen <= 60, info: `${titleLen} chars` },
    { label: 'Meta description (150–160)', pass: descLen >= 150 && descLen <= 160, info: `${descLen} chars` },
    { label: 'Keywords (5+)', pass: keywords.length >= 5, info: `${keywords.length} keywords` },
    { label: 'Content length (4,000+ words)', pass: wordCount >= 4000, info: `${wordCount.toLocaleString()} words` },
    { label: 'H2 headings (2+)', pass: h2Count >= 2, info: `${h2Count} H2s` },
    { label: 'H3 subheadings', pass: h3Count >= 1, info: `${h3Count} H3s` },
    { label: 'Images have alt text', pass: imgCount === 0 || imgAltCount === imgCount, info: imgCount === 0 ? 'No images' : `${imgAltCount}/${imgCount}` },
    { label: 'Internal links', pass: internalLinkCount >= 1, info: `${internalLinkCount} links` },
  ];

  return { overall, details, suggestions, wordCount };
}

function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={5} className="dark:stroke-gray-700" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fontSize={size * 0.22} fontWeight="700" fill={color}>{score}</text>
    </svg>
  );
}

export default function AISEOAssistant({
  title, content, excerpt,
  metaTitle, metaDescription, metaKeywords,
  onSetMetaTitle, onSetMetaDescription, onSetMetaKeywords,
  onSetExcerpt,
}: AISEOAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('generate');

  // API provider & key management
  const [provider, setProvider] = useState<ApiProvider>(() =>
    (localStorage.getItem('seo_ai_provider') as ApiProvider) || 'claude'
  );
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem('openai_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);

  // Generate-all state
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SeoAutoResult | null>(null);

  // Analyze tab state
  const [seoScore, setSeoScore] = useState<SeoScore | null>(null);
  const analyzeDebounce = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen || activeTab !== 'analyze') return;
    if (analyzeDebounce.current) clearTimeout(analyzeDebounce.current);
    analyzeDebounce.current = setTimeout(() => {
      setSeoScore(computeSeoScore(title, content, metaTitle, metaDescription, metaKeywords));
    }, 800);
    return () => { if (analyzeDebounce.current) clearTimeout(analyzeDebounce.current); };
  }, [isOpen, activeTab, title, content, metaTitle, metaDescription, metaKeywords]);

  const saveProvider = (p: ApiProvider) => {
    setProvider(p);
    localStorage.setItem('seo_ai_provider', p);
  };

  const saveOpenaiKey = () => {
    localStorage.setItem('openai_api_key', openaiKey);
    setShowKeyInput(false);
  };

  const generateAll = async () => {
    const wordCount = content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 100) {
      setGenError('Write at least 100 words before generating SEO metadata.');
      return;
    }
    if (provider === 'openai' && !openaiKey) {
      setShowKeyInput(true);
      return;
    }

    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch('/api/editor-ai/seo-auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, content,
          apiProvider: provider,
          openaiKey: provider === 'openai' ? openaiKey : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');

      // Auto-populate all fields
      if (data.seoTitle)        onSetMetaTitle(data.seoTitle.slice(0, 70));
      if (data.metaDescription) onSetMetaDescription(data.metaDescription.slice(0, 160));
      if (data.keywords?.length) onSetMetaKeywords(data.keywords.slice(0, 15).join(', '));
      if (data.excerpt)          onSetExcerpt(data.excerpt);

      setLastResult(data);
    } catch (err: any) {
      setGenError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const refreshAnalysis = () => {
    setSeoScore(computeSeoScore(title, content, metaTitle, metaDescription, metaKeywords));
  };

  const scoreColor = (s: number) => s >= 75 ? 'text-green-600 dark:text-green-400' : s >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500';
  const hasKey = provider === 'claude' || !!openaiKey;

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-xl border border-emerald-100 dark:border-teal-900/50 shadow-sm overflow-hidden">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-200 dark:shadow-emerald-900/30">
            <TrendingUp size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">AI SEO Assistant</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Auto-generate titles, descriptions, keywords & excerpt</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowKeyInput(!showKeyInput); }}
            className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-gray-700 transition-colors"
            title="Configure API key"
          >
            <Key size={14} className={hasKey ? 'text-green-500' : 'text-gray-400'} />
          </button>
          {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </button>

      {/* Key / provider settings */}
      {showKeyInput && (
        <div className="px-4 pb-4 border-t border-emerald-100 dark:border-gray-700 pt-3 space-y-3">
          {/* Provider selector */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => saveProvider('claude')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors border ${
                provider === 'claude'
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-violet-400'
              }`}
            >
              <Bot size={12} /> Claude
            </button>
            <button
              type="button"
              onClick={() => saveProvider('openai')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors border ${
                provider === 'openai'
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-green-400'
              }`}
            >
              <Sparkles size={12} /> OpenAI
            </button>
          </div>

          {provider === 'openai' && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">OpenAI API key — stored in your browser only.</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="flex-1 text-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={saveOpenaiKey}
                  className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
                >Save</button>
                <button type="button" onClick={() => setShowKeyInput(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <X size={14} className="text-gray-500" />
                </button>
              </div>
            </div>
          )}

          {provider === 'claude' && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-emerald-700 dark:text-emerald-400">Claude uses the server-side API key. No key required.</p>
              <button type="button" onClick={() => setShowKeyInput(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X size={14} className="text-gray-500" />
              </button>
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div className="border-t border-emerald-100 dark:border-gray-700">
          {/* Tabs */}
          <div className="flex border-b border-emerald-100 dark:border-gray-700">
            {([
              { id: 'generate', label: 'Generate', icon: Zap },
              { id: 'analyze', label: 'Analyze', icon: BarChart2 },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
                  activeTab === id
                    ? 'bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-500'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          {/* GENERATE TAB */}
          {activeTab === 'generate' && (
            <div className="p-4 space-y-4">
              {/* Provider badge */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Generates SEO title, meta description, keywords, and excerpt from your full article.
                </p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  provider === 'claude'
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                }`}>
                  {provider === 'claude' ? 'Claude' : 'OpenAI'}
                </span>
              </div>

              {/* Generate All button */}
              <button
                type="button"
                onClick={generateAll}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-60 shadow-md shadow-emerald-200 dark:shadow-emerald-900/30"
              >
                {generating
                  ? <><Loader2 size={15} className="animate-spin" /> Generating all fields…</>
                  : <><Sparkles size={15} /> Generate All SEO Fields</>
                }
              </button>

              {genError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-400">{genError}</p>
                </div>
              )}

              {/* Live field previews */}
              <div className="space-y-2.5">
                <FieldPreview icon={<FileText size={12} />} label="SEO Title" value={metaTitle} maxChars={60} color="blue" />
                <FieldPreview icon={<Search size={12} />} label="Meta Description" value={metaDescription} maxChars={160} color="teal" />
                <FieldPreview icon={<Tag size={12} />} label="Keywords" value={metaKeywords} color="amber" />
                <FieldPreview icon={<FileText size={12} />} label="Excerpt" value={excerpt} color="emerald" />
              </div>

              {lastResult && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                  <p className="text-xs text-green-700 dark:text-green-400 font-medium">All fields auto-populated successfully.</p>
                </div>
              )}

              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/40">
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold mb-1">AdSense Rules Applied</p>
                <ul className="text-xs text-emerald-600 dark:text-emerald-400 space-y-0.5">
                  <li>• Title: 50–60 chars with primary keyword</li>
                  <li>• Description: 150–160 chars, click-optimized</li>
                  <li>• Keywords: 5–15 primary + long-tail terms</li>
                  <li>• Excerpt: 2–3 sentences, human-written tone</li>
                </ul>
              </div>
            </div>
          )}

          {/* ANALYZE TAB */}
          {activeTab === 'analyze' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Live SEO Analysis</p>
                <button type="button" onClick={refreshAnalysis} className="p-1.5 hover:bg-emerald-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <RefreshCw size={13} className="text-gray-400" />
                </button>
              </div>

              {seoScore ? (
                <>
                  <div className="flex items-center gap-4">
                    <ScoreRing score={seoScore.overall} size={72} />
                    <div>
                      <p className={`text-2xl font-black ${scoreColor(seoScore.overall)}`}>{seoScore.overall}/100</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {seoScore.overall >= 75 ? 'Good SEO' : seoScore.overall >= 50 ? 'Needs work' : 'Poor SEO'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{seoScore.wordCount.toLocaleString()} words</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {seoScore.details.map((d, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {d.pass
                            ? <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                            : <AlertCircle size={13} className="text-red-400 shrink-0" />}
                          <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{d.label}</span>
                        </div>
                        <span className={`text-xs font-medium shrink-0 ${d.pass ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{d.info}</span>
                      </div>
                    ))}
                  </div>

                  {seoScore.suggestions.length > 0 ? (
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800/40">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">Improvements</p>
                      <ul className="space-y-1">
                        {seoScore.suggestions.map((s, i) => (
                          <li key={i} className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                            <span className="shrink-0 mt-0.5">•</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                      <CheckCircle2 size={15} className="text-green-500 shrink-0" />
                      <p className="text-xs text-green-700 dark:text-green-400 font-medium">All SEO checks passed!</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FieldPreview({
  icon, label, value, maxChars, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  maxChars?: number;
  color: string;
}) {
  const dotColor: Record<string, string> = {
    blue: 'bg-blue-500', teal: 'bg-teal-500', amber: 'bg-amber-500', emerald: 'bg-emerald-500',
  };
  return (
    <div className="bg-white dark:bg-gray-800/70 rounded-xl border border-gray-100 dark:border-gray-700 p-2.5">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`w-2 h-2 rounded-full ${dotColor[color] || 'bg-gray-400'}`} />
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
          <span className="text-gray-400">{icon}</span> {label}
        </span>
        {value && maxChars && (
          <span className={`ml-auto text-xs ${value.length > maxChars ? 'text-red-500' : 'text-gray-400'}`}>
            {value.length}/{maxChars}
          </span>
        )}
      </div>
      {value ? (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-1.5">
          {value}
        </p>
      ) : (
        <p className="text-xs text-gray-300 dark:text-gray-600 italic px-2 py-1.5">Not yet generated</p>
      )}
    </div>
  );
}
