import { useState, useMemo } from 'react';
import {
  CheckCircle2, AlertCircle, Info, Loader2, RefreshCw,
  BookOpen, Eye, Volume2, Zap, AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react';

interface ProofingPanelProps {
  content: string;
  title: string;
}

interface Issue {
  id: string;
  type: 'grammar' | 'spelling' | 'style' | 'readability' | 'passive' | 'filler';
  severity: 'error' | 'warning' | 'info';
  original: string;
  suggestion: string;
  explanation: string;
}

interface ProofResult {
  tone: string;
  toneConfidence: number;
  readabilityScore: number;
  readabilityGrade: string;
  overallScore: number;
  issues: Issue[];
  strengths: string[];
  topSuggestions: string[];
  stats: {
    passiveVoiceCount: number;
    longSentenceCount: number;
    fillerWordCount: number;
    complexWordCount: number;
  };
}

// ── CLIENT-SIDE ANALYSIS ─────────────────────────────────────────────────────

interface LocalIssue {
  type: string;
  text: string;
  color: string;
  count: number;
  examples: string[];
}

function runLocalAnalysis(text: string): LocalIssue[] {
  const issues: LocalIssue[] = [];

  // Passive voice
  const passiveMatches: string[] = [];
  const passiveRegex = /\b(was|were|is|are|been|being|be)\s+[a-z]+ed\b/gi;
  let match;
  while ((match = passiveRegex.exec(text)) !== null) {
    passiveMatches.push(match[0]);
    if (passiveMatches.length >= 5) break;
  }
  if (passiveMatches.length > 0) {
    issues.push({
      type: 'Passive Voice',
      text: `${passiveMatches.length} passive constructions found`,
      color: 'text-blue-600',
      count: passiveMatches.length,
      examples: passiveMatches.slice(0, 3),
    });
  }

  // Long sentences (> 30 words)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const longSentences = sentences.filter(s => s.trim().split(/\s+/).length > 30);
  if (longSentences.length > 0) {
    issues.push({
      type: 'Long Sentences',
      text: `${longSentences.length} sentences over 30 words`,
      color: 'text-yellow-600',
      count: longSentences.length,
      examples: longSentences.slice(0, 2).map(s => s.trim().substring(0, 60) + '…'),
    });
  }

  // Filler words
  const fillerWords = ['very', 'really', 'quite', 'somewhat', 'rather', 'basically', 'actually', 'literally', 'just', 'simply', 'obviously', 'clearly'];
  const fillerCount = fillerWords.reduce((acc, w) => acc + (text.match(new RegExp(`\\b${w}\\b`, 'gi')) || []).length, 0);
  const foundFillers = fillerWords.filter(w => (text.match(new RegExp(`\\b${w}\\b`, 'gi')) || []).length > 0);
  if (fillerCount > 2) {
    issues.push({
      type: 'Filler Words',
      text: `"${foundFillers.slice(0, 4).join('", "')}" found ${fillerCount} times`,
      color: 'text-orange-500',
      count: fillerCount,
      examples: foundFillers.slice(0, 4),
    });
  }

  // Repeated words
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 5);
  const freq: Record<string, number> = {};
  words.forEach(w => { const clean = w.replace(/[^a-z]/g, ''); if (clean) freq[clean] = (freq[clean] || 0) + 1; });
  const repeated = Object.entries(freq).filter(([, n]) => n > 5).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (repeated.length > 0) {
    issues.push({
      type: 'Overused Words',
      text: `${repeated.map(([w, n]) => `"${w}" ×${n}`).join(', ')}`,
      color: 'text-purple-500',
      count: repeated.length,
      examples: repeated.map(([w, n]) => `"${w}" used ${n} times`),
    });
  }

  // Adverb overuse (-ly words)
  const adverbs = (text.match(/\b\w+ly\b/gi) || []).filter(w => w.length > 4);
  if (adverbs.length > 5) {
    issues.push({
      type: 'Adverb Overuse',
      text: `${adverbs.length} adverbs found — consider stronger verbs`,
      color: 'text-pink-500',
      count: adverbs.length,
      examples: [...new Set(adverbs)].slice(0, 4),
    });
  }

  return issues;
}

const SCORE_CONFIG = [
  { min: 85, label: 'Excellent', color: 'text-green-500', bg: 'bg-green-500' },
  { min: 70, label: 'Good',      color: 'text-lime-500',  bg: 'bg-lime-500' },
  { min: 55, label: 'Fair',      color: 'text-yellow-500', bg: 'bg-yellow-500' },
  { min: 0,  label: 'Needs Work', color: 'text-red-500',  bg: 'bg-red-500' },
];

const TYPE_STYLE: Record<string, { color: string; bg: string; icon: typeof CheckCircle2 }> = {
  grammar:     { color: 'text-red-600 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-900/20',    icon: AlertCircle },
  spelling:    { color: 'text-red-600 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-900/20',    icon: AlertCircle },
  style:       { color: 'text-blue-600 dark:text-blue-400',  bg: 'bg-blue-50 dark:bg-blue-900/20',  icon: Eye },
  readability: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: BookOpen },
  passive:     { color: 'text-blue-600 dark:text-blue-400',  bg: 'bg-blue-50 dark:bg-blue-900/20',  icon: Volume2 },
  filler:      { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', icon: AlertTriangle },
};

export default function ProofingPanel({ content, title: _title }: ProofingPanelProps) {
  const [aiResult, setAiResult] = useState<ProofResult | null>(null);
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const plainText = useMemo(
    () => content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    [content],
  );

  const localIssues = useMemo(() => runLocalAnalysis(plainText), [plainText]);

  const scoreConf = (score: number) => SCORE_CONFIG.find(c => score >= c.min) || SCORE_CONFIG[3];

  const runAIProofread = async () => {
    if (!content || content.replace(/<[^>]+>/g, '').trim().length < 50) {
      setError('Please write at least 50 words before running AI proofread.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/editor-ai/proofread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Proofread failed');
      setAiResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const hasContent = wordCount > 20;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Instant Analysis (client-side, always live) */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Zap size={13} className="text-yellow-500" /> Instant Analysis
          </h3>
          <span className="text-xs text-gray-400">{wordCount} words</span>
        </div>

        {!hasContent ? (
          <p className="text-xs text-gray-400 text-center py-4">Start writing to see instant analysis</p>
        ) : localIssues.length === 0 ? (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
            <CheckCircle2 size={16} className="text-green-500 shrink-0" />
            <p className="text-xs text-green-700 dark:text-green-400 font-medium">No common style issues detected!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {localIssues.map((issue, i) => {
              const isExpanded = expanded[`local-${i}`];
              return (
                <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <button
                    onClick={() => setExpanded(p => ({ ...p, [`local-${i}`]: !p[`local-${i}`] }))}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${issue.color.replace('text-', 'bg-')}`} />
                      <span className={`text-xs font-semibold ${issue.color} shrink-0`}>{issue.type}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{issue.text}</span>
                    </div>
                    {isExpanded ? <ChevronUp size={12} className="text-gray-400 shrink-0" /> : <ChevronDown size={12} className="text-gray-400 shrink-0" />}
                  </button>
                  {isExpanded && issue.examples.length > 0 && (
                    <div className="px-3 pb-2.5 bg-gray-50 dark:bg-gray-800/50">
                      {issue.examples.map((ex, j) => (
                        <div key={j} className="flex items-start gap-1.5 mt-1">
                          <span className="text-gray-300 shrink-0">›</span>
                          <span className="text-xs text-gray-600 dark:text-gray-400 italic">"{ex}"</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Deep Analysis */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-violet-500" /> AI Deep Analysis
          </h3>
          {aiResult && (
            <button onClick={() => setAiResult(null)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Reset</button>
          )}
        </div>

        {!aiResult && (
          <>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
              AI scans for grammar errors, tone issues, and style improvements that instant analysis misses.
            </p>
            <button
              onClick={runAIProofread}
              disabled={loading || !hasContent}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> Analyzing…</>
              ) : (
                <><RefreshCw size={14} /> Run AI Proofread</>
              )}
            </button>
          </>
        )}

        {error && (
          <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {aiResult && (
          <div className="space-y-4">
            {/* Score Ring */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-violet-100 dark:border-violet-900/30">
              <div className="relative w-16 h-16 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-200 dark:text-gray-700" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    strokeWidth="3"
                    strokeDasharray={`${aiResult.overallScore} 100`}
                    strokeLinecap="round"
                    className={scoreConf(aiResult.overallScore).color.replace('text-', 'stroke-')}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-sm font-black ${scoreConf(aiResult.overallScore).color}`}>{aiResult.overallScore}</span>
                </div>
              </div>
              <div>
                <div className={`text-base font-bold ${scoreConf(aiResult.overallScore).color}`}>
                  {scoreConf(aiResult.overallScore).label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Tone: <span className="font-medium text-gray-700 dark:text-gray-300">{aiResult.tone}</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Readability: <span className="font-medium text-gray-700 dark:text-gray-300">{aiResult.readabilityGrade}</span>
                </div>
              </div>
            </div>

            {/* Stats row */}
            {aiResult.stats && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Passive Voice', val: aiResult.stats.passiveVoiceCount, warn: aiResult.stats.passiveVoiceCount > 3 },
                  { label: 'Long Sentences', val: aiResult.stats.longSentenceCount, warn: aiResult.stats.longSentenceCount > 2 },
                  { label: 'Filler Words', val: aiResult.stats.fillerWordCount, warn: aiResult.stats.fillerWordCount > 5 },
                  { label: 'Complex Words', val: aiResult.stats.complexWordCount, warn: aiResult.stats.complexWordCount > 10 },
                ].map(({ label, val, warn }) => (
                  <div key={label} className={`p-2.5 rounded-xl text-center border ${warn ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900' : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900'}`}>
                    <div className={`text-lg font-bold ${warn ? 'text-orange-600' : 'text-green-600'}`}>{val}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Issues */}
            {aiResult.issues.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Issues ({aiResult.issues.length})
                </h4>
                <div className="space-y-2">
                  {aiResult.issues.map((issue) => {
                    const style = TYPE_STYLE[issue.type] || TYPE_STYLE.grammar;
                    const IconComp = style.icon;
                    return (
                      <div key={issue.id} className={`p-3 rounded-xl border ${style.bg} border-opacity-50`}>
                        <div className="flex items-start gap-2">
                          <IconComp size={13} className={`${style.color} shrink-0 mt-0.5`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              <span className={`text-xs font-semibold capitalize ${style.color}`}>{issue.type}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                issue.severity === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
                                issue.severity === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
                                'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                              }`}>{issue.severity}</span>
                            </div>
                            {issue.original && (
                              <div className="text-xs mb-1">
                                <span className="text-red-500 line-through">"{issue.original}"</span>
                                {issue.suggestion && (
                                  <> → <span className="text-green-600 dark:text-green-400 font-medium">"{issue.suggestion}"</span></>
                                )}
                              </div>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-400">{issue.explanation}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Strengths */}
            {aiResult.strengths?.length > 0 && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl">
                <h4 className="text-xs font-bold text-green-700 dark:text-green-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={12} /> Strengths
                </h4>
                {aiResult.strengths.map((s, i) => (
                  <div key={i} className="text-xs text-green-700 dark:text-green-400 flex items-start gap-1.5 mt-1">
                    <span className="shrink-0">✓</span> {s}
                  </div>
                ))}
              </div>
            )}

            {/* Top suggestions */}
            {aiResult.topSuggestions?.length > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
                <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                  <Info size={12} /> Top Improvements
                </h4>
                {aiResult.topSuggestions.map((s, i) => (
                  <div key={i} className="text-xs text-blue-700 dark:text-blue-400 flex items-start gap-1.5 mt-1">
                    <span className="shrink-0">{i + 1}.</span> {s}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={runAIProofread}
              className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-violet-600 transition-colors py-1"
            >
              <RefreshCw size={12} /> Re-analyze
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
