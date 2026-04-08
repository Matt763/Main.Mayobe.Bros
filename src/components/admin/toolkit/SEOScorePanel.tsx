import { useState, useMemo, useCallback } from 'react';
import {
  TrendingUp, Search, Tag, List, Link, Image, Loader2,
  CheckCircle2, AlertCircle, AlertTriangle, Info, RefreshCw,
  ChevronDown, ChevronUp, Copy, Check,
} from 'lucide-react';

interface SEOScorePanelProps {
  title: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  onSetMetaTitle: (v: string) => void;
  onSetMetaDescription: (v: string) => void;
  onSetMetaKeywords: (v: string) => void;
}

interface AIResult {
  score: number;
  grade: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  suggestedKeywords: string[];
  keywordDensity: number;
  recommendations: { priority: string; category: string; issue: string; fix: string }[];
  metaSuggestions: { title: string; description: string; keywords: string };
  contentGaps: string[];
  competitorAngle: string;
}

// ── Client-side SEO scoring ───────────────────────────────────────────────────

interface LocalScore {
  overall: number;
  checks: { label: string; pass: boolean; score: number; max: number; detail: string }[];
  wordCount: number;
  h2Count: number;
  h3Count: number;
  imgCount: number;
  imgAltCount: number;
  linkCount: number;
  keywordDensity: number;
  primaryKeyword: string;
}

function computeLocalSEO(title: string, content: string, _metaTitle: string, metaDescription: string, metaKeywords: string): LocalScore {
  const plain = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = plain.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Extract H2/H3
  const h2s = (content.match(/<h2[^>]*>/gi) || []).length;
  const h3s = (content.match(/<h3[^>]*>/gi) || []).length;
  const imgs = (content.match(/<img[^>]*>/gi) || []).length;
  const imgAlts = (content.match(/<img[^>]*alt="[^"]+"/gi) || []).length;
  const links = (content.match(/<a\s/gi) || []).length;

  // Primary keyword detection (most common non-stop word from title)
  const stopWords = new Set(['the','a','an','is','are','was','were','it','in','on','at','to','for','of','and','or','but','with','this','that','these','those','has','have','had','be','been','being','do','does','did']);
  const titleWords = (title || '').toLowerCase().split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
  const primaryKeyword = titleWords[0] || '';

  const keywordInTitle = title.toLowerCase().includes(primaryKeyword);
  const keywordInMeta = metaDescription.toLowerCase().includes(primaryKeyword);
  const keywordInContent = primaryKeyword ? (plain.toLowerCase().match(new RegExp(`\\b${primaryKeyword}\\b`, 'g')) || []).length : 0;
  const keywordDensity = primaryKeyword && wordCount > 0 ? +((keywordInContent / wordCount) * 100).toFixed(2) : 0;

  const checks = [
    {
      label: 'Title Length (30-60 chars)',
      pass: title.length >= 30 && title.length <= 60,
      score: title.length >= 30 && title.length <= 60 ? 10 : title.length > 0 ? 5 : 0,
      max: 10,
      detail: title.length > 0 ? `${title.length} characters` : 'No title',
    },
    {
      label: 'Meta Description (120-155 chars)',
      pass: metaDescription.length >= 120 && metaDescription.length <= 155,
      score: metaDescription.length >= 120 && metaDescription.length <= 155 ? 10 : metaDescription.length > 0 ? 5 : 0,
      max: 10,
      detail: metaDescription.length > 0 ? `${metaDescription.length} characters` : 'Not set',
    },
    {
      label: 'Keyword in Title',
      pass: !!primaryKeyword && keywordInTitle,
      score: !!primaryKeyword && keywordInTitle ? 10 : 0,
      max: 10,
      detail: primaryKeyword ? (keywordInTitle ? `"${primaryKeyword}" found` : `"${primaryKeyword}" missing`) : 'No keyword detected',
    },
    {
      label: 'Keyword in Meta Description',
      pass: !!primaryKeyword && keywordInMeta,
      score: !!primaryKeyword && keywordInMeta ? 8 : 0,
      max: 8,
      detail: primaryKeyword ? (keywordInMeta ? 'Found' : 'Missing') : 'N/A',
    },
    {
      label: 'Content Length (600+ words)',
      pass: wordCount >= 600,
      score: wordCount >= 1500 ? 15 : wordCount >= 900 ? 12 : wordCount >= 600 ? 9 : wordCount >= 300 ? 5 : 0,
      max: 15,
      detail: `${wordCount} words ${wordCount < 600 ? '(aim for 600+)' : wordCount >= 1500 ? '(excellent)' : '(good)'}`,
    },
    {
      label: 'H2 Headings (2+)',
      pass: h2s >= 2,
      score: h2s >= 4 ? 10 : h2s >= 2 ? 8 : h2s >= 1 ? 4 : 0,
      max: 10,
      detail: `${h2s} H2 heading${h2s !== 1 ? 's' : ''}`,
    },
    {
      label: 'Keyword Density (0.5–2.5%)',
      pass: keywordDensity >= 0.5 && keywordDensity <= 2.5,
      score: keywordDensity >= 0.5 && keywordDensity <= 2.5 ? 10 : keywordDensity > 0 ? 4 : 0,
      max: 10,
      detail: primaryKeyword ? `${keywordDensity}% for "${primaryKeyword}"` : 'No keyword detected',
    },
    {
      label: 'Images Present',
      pass: imgs > 0,
      score: imgs >= 3 ? 8 : imgs >= 1 ? 5 : 0,
      max: 8,
      detail: imgs > 0 ? `${imgs} image${imgs !== 1 ? 's' : ''} (${imgAlts} with alt text)` : 'No images',
    },
    {
      label: 'Internal/External Links',
      pass: links >= 2,
      score: links >= 4 ? 10 : links >= 2 ? 7 : links >= 1 ? 3 : 0,
      max: 10,
      detail: `${links} link${links !== 1 ? 's' : ''}`,
    },
    {
      label: 'Meta Keywords Set',
      pass: metaKeywords.length > 0,
      score: metaKeywords.length > 0 ? 5 : 0,
      max: 5,
      detail: metaKeywords || 'Not set',
    },
  ];

  const overall = Math.round(checks.reduce((sum, c) => sum + c.score, 0) / checks.reduce((sum, c) => sum + c.max, 0) * 100);

  return { overall, checks, wordCount, h2Count: h2s, h3Count: h3s, imgCount: imgs, imgAltCount: imgAlts, linkCount: links, keywordDensity, primaryKeyword };
}

// ── Grade helpers ─────────────────────────────────────────────────────────────

function getGradeInfo(score: number) {
  if (score >= 85) return { grade: 'A', label: 'Excellent', color: 'text-green-500', stroke: 'stroke-green-500', ring: 'text-green-500' };
  if (score >= 70) return { grade: 'B', label: 'Good',      color: 'text-lime-500',  stroke: 'stroke-lime-500',  ring: 'text-lime-500' };
  if (score >= 55) return { grade: 'C', label: 'Fair',      color: 'text-yellow-500',stroke: 'stroke-yellow-500',ring: 'text-yellow-500' };
  if (score >= 40) return { grade: 'D', label: 'Poor',      color: 'text-orange-500',stroke: 'stroke-orange-500',ring: 'text-orange-500' };
  return                 { grade: 'F', label: 'Needs Work', color: 'text-red-500',   stroke: 'stroke-red-500',   ring: 'text-red-500' };
}

const PRIORITY_STYLE = {
  high:   { color: 'text-red-600 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-900/20',    icon: AlertCircle },
  medium: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: AlertTriangle },
  low:    { color: 'text-blue-600 dark:text-blue-400',  bg: 'bg-blue-50 dark:bg-blue-900/20',  icon: Info },
};

export default function SEOScorePanel({
  title, content, metaTitle, metaDescription, metaKeywords,
  onSetMetaTitle, onSetMetaDescription, onSetMetaKeywords,
}: SEOScorePanelProps) {
  const [aiResult, setAiResult]       = useState<AIResult | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [showChecks, setShowChecks]   = useState(false);
  const [showAiRecs, setShowAiRecs]   = useState(false);
  const [copied, setCopied]           = useState<string | null>(null);

  const local = useMemo(
    () => computeLocalSEO(title, content, metaTitle, metaDescription, metaKeywords),
    [title, content, metaTitle, metaDescription, metaKeywords],
  );

  const grade = getGradeInfo(local.overall);

  const runAISEO = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/editor-ai/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, metaTitle, metaDescription, metaKeywords }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'SEO analysis failed');
      setAiResult(data);
      setShowAiRecs(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [title, content, metaTitle, metaDescription, metaKeywords]);

  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Score Overview */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4">
          {/* Score Ring */}
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3" className="text-gray-200 dark:text-gray-700 stroke-current" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${local.overall} 100`}
                className={grade.stroke}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-xl font-black leading-none ${grade.color}`}>{local.overall}</span>
              <span className={`text-xs font-bold ${grade.color}`}>{grade.grade}</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className={`text-lg font-bold ${grade.color}`}>{grade.label}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {local.wordCount} words · {local.h2Count} H2s · {local.imgCount} images
            </div>
            {local.primaryKeyword && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <Tag size={11} className="text-gray-400 shrink-0" />
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  Primary: <strong className="text-gray-700 dark:text-gray-300">"{local.primaryKeyword}"</strong>
                  {local.keywordDensity > 0 && <span className="ml-1">{local.keywordDensity}%</span>}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              local.overall >= 85 ? 'bg-green-500' :
              local.overall >= 70 ? 'bg-lime-500' :
              local.overall >= 55 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${local.overall}%` }}
          />
        </div>
      </div>

      {/* Quick stats grid */}
      <div className="grid grid-cols-2 gap-2 p-4 border-b border-gray-100 dark:border-gray-800">
        {[
          { icon: List,  label: 'Words',     value: local.wordCount, good: local.wordCount >= 600 },
          { icon: TrendingUp, label: 'H2 Headings', value: local.h2Count, good: local.h2Count >= 2 },
          { icon: Image, label: 'Images',    value: local.imgCount, good: local.imgCount >= 1 },
          { icon: Link,  label: 'Links',     value: local.linkCount, good: local.linkCount >= 2 },
        ].map(({ icon: Icon, label, value, good }) => (
          <div key={label} className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${good ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900'}`}>
            <Icon size={13} className={good ? 'text-green-500' : 'text-orange-500'} />
            <div>
              <div className={`text-sm font-bold ${good ? 'text-green-700 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>{value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Checks list */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={() => setShowChecks(v => !v)}
          className="w-full flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
        >
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-green-500" /> SEO Checklist
          </span>
          {showChecks ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {showChecks && (
          <div className="mt-3 space-y-1.5">
            {local.checks.map((check) => (
              <div key={check.label} className="flex items-start gap-2.5 py-1">
                {check.pass ? (
                  <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                ) : check.score > 0 ? (
                  <AlertTriangle size={14} className="text-yellow-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{check.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{check.detail}</div>
                </div>
                <div className="text-xs text-gray-400 shrink-0">{check.score}/{check.max}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Deep SEO */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Search size={13} className="text-violet-500" /> AI SEO Analysis
          </h3>
          {aiResult && (
            <button onClick={() => setAiResult(null)} className="text-xs text-gray-400 hover:text-gray-600">Reset</button>
          )}
        </div>

        {!aiResult && (
          <button
            onClick={runAISEO}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? <><Loader2 size={13} className="animate-spin" /> Analyzing…</> : <><TrendingUp size={13} /> Deep AI SEO Analysis</>}
          </button>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {aiResult && (
          <div className="space-y-4">
            {/* AI Score */}
            <div className="flex items-center gap-3 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-800">
              <div className={`text-3xl font-black ${getGradeInfo(aiResult.score).color}`}>{aiResult.score}</div>
              <div>
                <div className={`font-bold ${getGradeInfo(aiResult.score).color}`}>AI Score · Grade {aiResult.grade}</div>
                {aiResult.primaryKeyword && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">Primary: "{aiResult.primaryKeyword}" · {aiResult.keywordDensity}%</div>
                )}
              </div>
            </div>

            {/* Suggested keywords */}
            {aiResult.suggestedKeywords?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Tag size={11} /> Missing Keywords
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {aiResult.suggestedKeywords.map((kw, i) => (
                    <span key={i} className="px-2.5 py-1 bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800 rounded-full text-xs text-violet-700 dark:text-violet-300 font-medium">{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {aiResult.recommendations?.length > 0 && (
              <div>
                <button
                  onClick={() => setShowAiRecs(v => !v)}
                  className="w-full flex items-center justify-between text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2"
                >
                  <span>Recommendations ({aiResult.recommendations.length})</span>
                  {showAiRecs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {showAiRecs && (
                  <div className="space-y-2">
                    {aiResult.recommendations.map((rec, i) => {
                      const style = PRIORITY_STYLE[rec.priority as keyof typeof PRIORITY_STYLE] || PRIORITY_STYLE.low;
                      const RecIcon = style.icon;
                      return (
                        <div key={i} className={`p-3 rounded-xl border ${style.bg}`}>
                          <div className="flex items-start gap-2">
                            <RecIcon size={13} className={`${style.color} shrink-0 mt-0.5`} />
                            <div>
                              <div className={`text-xs font-semibold capitalize ${style.color}`}>{rec.category} · {rec.priority}</div>
                              <div className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{rec.issue}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 italic">Fix: {rec.fix}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Meta Suggestions */}
            {aiResult.metaSuggestions && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">AI Meta Suggestions</h4>

                {[
                  { key: 'title', label: 'Meta Title', text: aiResult.metaSuggestions.title, onApply: onSetMetaTitle },
                  { key: 'desc', label: 'Meta Description', text: aiResult.metaSuggestions.description, onApply: onSetMetaDescription },
                  { key: 'kw', label: 'Keywords', text: aiResult.metaSuggestions.keywords, onApply: onSetMetaKeywords },
                ].filter(({ text }) => !!text).map(({ key, label, text, onApply }) => (
                  <div key={key} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{label}</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => copyText(text, key)}
                          className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                        >
                          {copied === key ? <Check size={10} /> : <Copy size={10} />}
                        </button>
                        <button
                          onClick={() => onApply(text)}
                          className="text-xs bg-violet-600 text-white px-2 py-0.5 rounded-lg hover:bg-violet-700 transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300">{text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Content gaps */}
            {aiResult.contentGaps?.length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl">
                <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={12} /> Content Gaps
                </h4>
                {aiResult.contentGaps.map((gap, i) => (
                  <div key={i} className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5 mt-1">
                    <span className="shrink-0">•</span> {gap}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={runAISEO}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-violet-600 transition-colors py-1"
            >
              <RefreshCw size={11} /> Re-analyze
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
