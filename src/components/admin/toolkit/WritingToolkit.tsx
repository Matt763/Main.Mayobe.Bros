import { useState, useCallback } from 'react';
import {
  Sparkles, CheckCircle2, TrendingUp, Palette, Film, Clock,
  Loader2, AlertCircle, ChevronDown, ChevronUp, Search,
  Link2, Newspaper, Clapperboard,
} from 'lucide-react';
import AIWritingPanel from './AIWritingPanel';
import ProofingPanel from './ProofingPanel';
import SEOScorePanel from './SEOScorePanel';
import DesignStudio from './DesignStudio';
import MediaPanel from './MediaPanel';
import VersionHistory from './VersionHistory';
import InArticleLinkPanel from './InArticleLinkPanel';
import HeadlineGeneratorPanel from './HeadlineGeneratorPanel';
import AIMediaPanel from './AIMediaPanel';

// ── Plagiarism Panel (standalone) ────────────────────────────────────────────

interface PlagiarismResult {
  originalityScore: number;
  status: string;
  verdict: string;
  genericPhrases: { phrase: string; concern: string }[];
  originalElements: string[];
  improvements: { section: string; suggestion: string }[];
  uniquenessReport: { hasUniqueAngle: boolean; hasPersonalVoice: boolean; hasOriginalExamples: boolean; hasDataOrStats: boolean };
}

function PlagiarismPanel({ content }: { content: string }) {
  const [result, setResult]   = useState<PlagiarismResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const check = async () => {
    const wordCount = content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 100) { setError('Write at least 100 words first.'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/editor-ai/plagiarism', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check failed');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (s: number) =>
    s >= 85 ? 'text-green-500' : s >= 70 ? 'text-lime-500' : s >= 50 ? 'text-yellow-500' : 'text-red-500';

  const strokeColor = (s: number) =>
    s >= 85 ? 'stroke-green-500' : s >= 70 ? 'stroke-lime-500' : s >= 50 ? 'stroke-yellow-500' : 'stroke-red-500';

  return (
    <div className="p-4 space-y-4 text-xs overflow-y-auto h-full">
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
        <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
          AI-powered originality analysis checks for generic phrasing, common clichés, and lack of unique voice. For full plagiarism detection, use Copyscape or Grammarly.
        </p>
      </div>

      {!result && (
        <button
          onClick={check}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? <><Loader2 size={14} className="animate-spin" /> Analyzing…</> : <><Search size={14} /> Check Originality</>}
        </button>
      )}

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 flex items-start gap-2">
          <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Score */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl border border-violet-100 dark:border-violet-900">
            <div className="relative w-16 h-16 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3" className="stroke-gray-200 dark:stroke-gray-700" />
                <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${result.originalityScore} 100`} className={strokeColor(result.originalityScore)} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-sm font-black ${scoreColor(result.originalityScore)}`}>{result.originalityScore}%</span>
              </div>
            </div>
            <div>
              <div className={`text-base font-bold ${scoreColor(result.originalityScore)}`}>
                {result.status === 'highly_original' ? 'Highly Original' :
                 result.status === 'original' ? 'Original' :
                 result.status === 'mixed' ? 'Mixed' : 'Generic'}
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">{result.verdict}</p>
            </div>
          </div>

          {/* Uniqueness flags */}
          {result.uniquenessReport && (
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'hasUniqueAngle', label: 'Unique Angle' },
                { key: 'hasPersonalVoice', label: 'Personal Voice' },
                { key: 'hasOriginalExamples', label: 'Original Examples' },
                { key: 'hasDataOrStats', label: 'Data & Stats' },
              ].map(({ key, label }) => {
                const pass = result.uniquenessReport[key as keyof typeof result.uniquenessReport];
                return (
                  <div key={key} className={`flex items-center gap-2 p-2.5 rounded-xl border ${pass ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900'}`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${pass ? 'bg-green-500' : 'bg-orange-400'}`} />
                    <span className={`font-medium ${pass ? 'text-green-700 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>{label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Generic phrases */}
          {result.genericPhrases?.length > 0 && (
            <div>
              <button
                onClick={() => setExpanded(v => !v)}
                className="flex items-center justify-between w-full text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider mb-2"
              >
                <span>Generic Phrases ({result.genericPhrases.length})</span>
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {expanded && (
                <div className="space-y-2">
                  {result.genericPhrases.map((p, i) => (
                    <div key={i} className="p-2.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-xl">
                      <div className="font-medium text-orange-700 dark:text-orange-400">"{p.phrase}"</div>
                      <div className="text-gray-500 dark:text-gray-400 mt-0.5">{p.concern}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Improvements */}
          {result.improvements?.length > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl space-y-2">
              <div className="font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">How to Improve</div>
              {result.improvements.map((imp, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-blue-400 shrink-0">{i + 1}.</span>
                  <span className="text-blue-700 dark:text-blue-300"><strong className="capitalize">{imp.section}:</strong> {imp.suggestion}</span>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => setResult(null)} className="w-full flex items-center justify-center gap-1.5 text-gray-400 hover:text-violet-600 transition-colors py-1">
            Re-check
          </button>
        </div>
      )}
    </div>
  );
}

// ── Tab definitions ───────────────────────────────────────────────────────────

type TabId = 'ai' | 'headlines' | 'links' | 'proofing' | 'seo' | 'plagiarism' | 'design' | 'media' | 'versions' | 'video';

interface Tab {
  id: TabId;
  label: string;
  shortLabel: string;
  icon: typeof Sparkles;
  color: string;
}

const TABS: Tab[] = [
  { id: 'ai',         label: 'AI Writer',      shortLabel: 'AI',      icon: Sparkles,     color: 'text-violet-500' },
  { id: 'headlines',  label: 'Headlines',      shortLabel: 'Headlines',icon: Newspaper,    color: 'text-emerald-500' },
  { id: 'links',      label: 'Link Generator', shortLabel: 'Links',   icon: Link2,        color: 'text-blue-500' },
  { id: 'proofing',   label: 'Proofing',       shortLabel: 'Proof',   icon: CheckCircle2, color: 'text-green-500' },
  { id: 'seo',        label: 'SEO',            shortLabel: 'SEO',     icon: TrendingUp,   color: 'text-blue-500' },
  { id: 'plagiarism', label: 'Originality',    shortLabel: 'Orig.',   icon: Search,       color: 'text-orange-500' },
  { id: 'design',     label: 'Design Studio',  shortLabel: 'Design',  icon: Palette,      color: 'text-pink-500' },
  { id: 'media',      label: 'Media',          shortLabel: 'Media',   icon: Film,         color: 'text-cyan-500' },
  { id: 'versions',   label: 'Versions',       shortLabel: 'History', icon: Clock,        color: 'text-amber-500' },
  { id: 'video',      label: 'AI Media',       shortLabel: 'Media',   icon: Clapperboard, color: 'text-rose-500'  },
];

// ── Main WritingToolkit ───────────────────────────────────────────────────────

interface WritingToolkitProps {
  title: string;
  content: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  postId?: string;
  onInsertContent: (html: string, replace?: boolean) => void;
  onSetTitle?: (t: string) => void;
  onSetMetaTitle: (v: string) => void;
  onSetMetaDescription: (v: string) => void;
  onSetMetaKeywords: (v: string) => void;
  onExportDesignImage: (dataUrl: string) => void;
  onRestoreVersion: (v: { title: string; content: string; excerpt: string }) => void;
}

export default function WritingToolkit({
  title, content, excerpt,
  metaTitle, metaDescription, metaKeywords,
  postId,
  onInsertContent, onSetTitle,
  onSetMetaTitle, onSetMetaDescription, onSetMetaKeywords,
  onExportDesignImage, onRestoreVersion,
}: WritingToolkitProps) {
  const [activeTab, setActiveTab] = useState<TabId>('ai');

  const handleInsert = useCallback((html: string, replace?: boolean) => {
    onInsertContent(html, replace);
  }, [onInsertContent]);

  const handleSetTitle = useCallback((t: string) => {
    onSetTitle?.(t);
    // Switch to AI writer so user can immediately generate
    setActiveTab('ai');
  }, [onSetTitle]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden" style={{ minHeight: 600 }}>
      {/* Header */}
      <div className="px-4 pt-3.5 pb-0 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Sparkles size={12} className="text-white" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Writing Toolkit</h3>
          <span className="ml-auto text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full">2026</span>
        </div>

        {/* Tab navigation — scrollable row */}
        <div className="flex gap-0 overflow-x-auto scrollbar-hide -mx-1 pb-0">
          {TABS.map(({ id, shortLabel, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1 px-2.5 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all shrink-0 -mb-px ${
                activeTab === id
                  ? `border-violet-600 ${color}`
                  : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Icon size={11} />
              <span className="hidden sm:inline">{shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'ai' && (
          <AIWritingPanel
            title={title}
            content={content}
            onInsertContent={handleInsert}
            onSetTitle={onSetTitle}
          />
        )}

        {activeTab === 'headlines' && (
          <HeadlineGeneratorPanel
            onSetTitle={handleSetTitle}
            onInsertContent={handleInsert}
          />
        )}

        {activeTab === 'links' && (
          <InArticleLinkPanel
            content={content}
            onInsertContent={handleInsert}
          />
        )}

        {activeTab === 'proofing' && (
          <ProofingPanel content={content} title={title} />
        )}

        {activeTab === 'seo' && (
          <SEOScorePanel
            title={title}
            content={content}
            metaTitle={metaTitle}
            metaDescription={metaDescription}
            metaKeywords={metaKeywords}
            onSetMetaTitle={onSetMetaTitle}
            onSetMetaDescription={onSetMetaDescription}
            onSetMetaKeywords={onSetMetaKeywords}
          />
        )}

        {activeTab === 'plagiarism' && (
          <PlagiarismPanel content={content} />
        )}

        {activeTab === 'design' && (
          <DesignStudio onExportImage={onExportDesignImage} />
        )}

        {activeTab === 'media' && (
          <MediaPanel title={title} onInsertContent={handleInsert} />
        )}

        {activeTab === 'versions' && (
          <VersionHistory
            postId={postId}
            title={title}
            content={content}
            excerpt={excerpt}
            onRestore={onRestoreVersion}
          />
        )}

        {activeTab === 'video' && (
          <AIMediaPanel title={title} content={content} />
        )}
      </div>
    </div>
  );
}
