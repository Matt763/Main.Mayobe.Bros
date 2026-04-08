import { useState, useCallback, useEffect } from 'react';
import {
  Newspaper, Loader2, TrendingUp, Zap, RefreshCw, Copy, Check,
  AlertCircle, ChevronRight, Globe, Tag, Search, Sparkles,
  ArrowRight, Info,
} from 'lucide-react';

interface HeadlineIdea {
  title: string;
  category: string;
  searchIntent: string;
  keywordFocus: string;
  formula: string;
  evergreen: boolean;
  estimatedDifficulty: string;
  whyItWorks: string;
}

interface HeadlineResult {
  headlines: HeadlineIdea[];
  trendingAngles: string[];
  contentGaps: string[];
}

interface HeadlineGeneratorPanelProps {
  onSetTitle: (title: string) => void;
  onInsertContent: (html: string, replace?: boolean) => void;
}

interface Category { id: string; name: string; }
interface Label { id: string; name: string; categoryId?: string; }

const DIFFICULTY_COLOR = {
  low:    'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
  medium: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
  high:   'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
};

const INTENT_COLOR = {
  informational: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  commercial:    'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  navigational:  'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
};

export default function HeadlineGeneratorPanel({ onSetTitle, onInsertContent }: HeadlineGeneratorPanelProps) {
  const [categories, setCategories]   = useState<Category[]>([]);
  const [labels, setLabels]           = useState<Label[]>([]);
  const [trends, setTrends]           = useState<string[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsGeo, setTrendsGeo]     = useState('KE');
  const [result, setResult]           = useState<HeadlineResult | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [copied, setCopied]           = useState<string | null>(null);
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const [count, setCount]             = useState(20);
  const [includeTrends, setIncludeTrends] = useState(true);

  // Load categories & labels
  const loadData = useCallback(async () => {
    try {
      const [catRes, lblRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/labels'),
      ]);
      if (catRes.ok) {
        const cats = await catRes.json();
        setCategories(Array.isArray(cats) ? cats : cats.categories || []);
      }
      if (lblRes.ok) {
        const labs = await lblRes.json();
        setLabels(Array.isArray(labs) ? labs : labs.labels || []);
      }
    } catch {}
  }, []);

  // Fetch Google Trends
  const fetchTrends = useCallback(async (geo: string) => {
    setTrendsLoading(true);
    try {
      const res = await fetch(`/api/editor-ai/trends?geo=${geo}`);
      const data = await res.json();
      setTrends(data.trends || []);
    } catch {
      setTrends([]);
    } finally {
      setTrendsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    fetchTrends(trendsGeo);
  }, [fetchTrends, trendsGeo]);

  const toggleCat = (name: string) => {
    setSelectedCats(prev => {
      const next = new Set(prev);
      if (next.has(name)) { next.delete(name); } else { next.add(name); }
      return next;
    });
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const catNames = selectedCats.size > 0
      ? Array.from(selectedCats)
      : categories.map(c => c.name);

    const labelNames = labels.slice(0, 40).map(l => l.name);

    try {
      const res = await fetch('/api/editor-ai/headlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: catNames,
          labels: labelNames,
          trends: includeTrends ? trends : [],
          count,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Headline generation failed');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const useHeadline = (title: string) => {
    onSetTitle(title);
  };

  const copyHeadline = async (title: string) => {
    await navigator.clipboard.writeText(title);
    setCopied(title);
    setTimeout(() => setCopied(null), 2000);
  };

  const generateWithHeadline = (title: string) => {
    onSetTitle(title);
    onInsertContent('', false);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto text-xs">
      {/* Header */}
      <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-b border-emerald-100 dark:border-emerald-800">
        <div className="flex items-center gap-2 mb-2">
          <Newspaper size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-bold text-emerald-800 dark:text-emerald-300">Evergreen Headline Generator</span>
        </div>
        <p className="text-emerald-700 dark:text-emerald-400 leading-relaxed">
          AI generates evergreen, SEO-optimized headlines based on your site's categories and labels, supplemented by Google Trends for your region.
        </p>
      </div>

      {/* Google Trends status */}
      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <Globe size={12} className="text-gray-400 shrink-0" />
        <span className="text-gray-500">Google Trends</span>
        <select
          value={trendsGeo}
          onChange={e => setTrendsGeo(e.target.value)}
          className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md px-1.5 py-0.5 focus:outline-none text-xs ml-1"
        >
          <option value="KE">Kenya</option>
          <option value="ZA">South Africa</option>
          <option value="NG">Nigeria</option>
          <option value="GH">Ghana</option>
          <option value="TZ">Tanzania</option>
          <option value="UG">Uganda</option>
          <option value="ET">Ethiopia</option>
          <option value="">Global</option>
        </select>
        {trendsLoading && <Loader2 size={11} className="animate-spin text-emerald-500" />}
        {!trendsLoading && trends.length > 0 && (
          <span className="text-emerald-600 dark:text-emerald-400">{trends.length} trends loaded</span>
        )}
        {!trendsLoading && trends.length === 0 && (
          <span className="text-gray-400 italic">Trends unavailable — using AI only</span>
        )}
        <button onClick={() => fetchTrends(trendsGeo)} className="ml-auto text-gray-400 hover:text-emerald-600 transition-colors" title="Refresh trends">
          <RefreshCw size={11} />
        </button>
      </div>

      {/* Trending topics preview */}
      {trends.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingUp size={11} className="text-emerald-500" />
            <span className="font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Trending Now</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {trends.slice(0, 8).map((t, i) => (
              <span key={i} className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-800 font-medium">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Category selector */}
      {categories.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1.5 mb-2">
            <Tag size={11} className="text-gray-400" />
            <span className="font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Focus Categories</span>
            <span className="text-gray-400">(all if none selected)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => toggleCat(cat.name)}
                className={`px-2.5 py-1 rounded-full font-medium transition-all border ${
                  selectedCats.has(cat.name)
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Options */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-gray-500 font-semibold">Headlines:</label>
          <select
            value={count}
            onChange={e => setCount(Number(e.target.value))}
            className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md px-2 py-1 focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={25}>25</option>
            <option value={30}>30</option>
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => setIncludeTrends(v => !v)}
            className={`w-8 h-4 rounded-full transition-colors ${includeTrends ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${includeTrends ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
          <span className="text-gray-500">Include trends</span>
        </label>
      </div>

      {/* Generate button */}
      <div className="p-4">
        <button
          onClick={generate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 size={14} className="animate-spin" /> Generating evergreen headlines…</>
          ) : (
            <><Sparkles size={14} /> Generate {count} Headline Ideas</>
          )}
        </button>
      </div>

      {error && (
        <div className="mx-4 mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2">
          <AlertCircle size={13} className="text-red-600 shrink-0 mt-0.5" />
          <span className="text-red-700 dark:text-red-400">{error}</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="flex flex-col flex-1">
          {/* Content gaps */}
          {result.contentGaps && result.contentGaps.length > 0 && (
            <div className="mx-4 mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Info size={12} className="text-blue-500" />
                <span className="font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Content Gaps Detected</span>
              </div>
              <div className="space-y-0.5">
                {result.contentGaps.map((gap, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-blue-700 dark:text-blue-400">
                    <ChevronRight size={10} className="shrink-0 mt-0.5" />
                    <span>{gap}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending angles */}
          {result.trendingAngles && result.trendingAngles.length > 0 && (
            <div className="mx-4 mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl">
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp size={12} className="text-amber-500" />
                <span className="font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Trending Angles to Cover</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.trendingAngles.map((angle, i) => (
                  <span key={i} className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800">
                    {angle}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Headline cards */}
          <div className="px-4 pb-4 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-gray-700 dark:text-gray-300">{result.headlines.length} Headlines Generated</span>
              <button onClick={generate} className="flex items-center gap-1 text-gray-400 hover:text-emerald-600 transition-colors">
                <RefreshCw size={11} /> Regenerate
              </button>
            </div>

            {result.headlines.map((h, i) => (
              <div key={i} className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group">
                {/* Headline title */}
                <div className="font-semibold text-gray-900 dark:text-white leading-snug mb-2">{h.title}</div>

                {/* Badges row */}
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {h.category && (
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full border border-gray-200 dark:border-gray-700">
                      {h.category}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full border border-transparent ${INTENT_COLOR[h.searchIntent as keyof typeof INTENT_COLOR] || INTENT_COLOR.informational}`}>
                    {h.searchIntent}
                  </span>
                  {h.estimatedDifficulty && (
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${DIFFICULTY_COLOR[h.estimatedDifficulty as keyof typeof DIFFICULTY_COLOR] || DIFFICULTY_COLOR.medium}`}>
                      {h.estimatedDifficulty} competition
                    </span>
                  )}
                  {h.evergreen && (
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-800">
                      Evergreen
                    </span>
                  )}
                </div>

                {/* Keyword focus */}
                {h.keywordFocus && (
                  <div className="flex items-center gap-1 mb-1">
                    <Search size={10} className="text-gray-400 shrink-0" />
                    <span className="text-gray-500">Keyword: <strong className="text-gray-700 dark:text-gray-300">{h.keywordFocus}</strong></span>
                  </div>
                )}

                {/* Why it works */}
                {h.whyItWorks && (
                  <div className="text-gray-400 dark:text-gray-500 italic leading-relaxed mb-2">{h.whyItWorks}</div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100 dark:border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => useHeadline(h.title)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    <ArrowRight size={11} /> Use as Title
                  </button>
                  <button
                    onClick={() => generateWithHeadline(h.title)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    <Zap size={11} /> Use + Generate
                  </button>
                  <button
                    onClick={() => copyHeadline(h.title)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                  >
                    {copied === h.title ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formula legend */}
      {!result && !loading && (
        <div className="mx-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl">
          <div className="flex items-center gap-1.5 mb-2">
            <Info size={11} className="text-gray-400" />
            <span className="font-semibold text-gray-500 uppercase tracking-wider">Headline Formulas Used</span>
          </div>
          {[
            '"X Ways to [Outcome]" — Numbered listicles rank highly',
            '"How to [Goal] Without [Obstacle]" — Problem-solution format',
            '"Why [Surprising Fact]" — Curiosity-driven clicks',
            '"The [Authority] Guide to [Topic]" — Expertise signals',
            '"What Nobody Tells You About…" — Insider insight format',
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-1.5 text-gray-500 dark:text-gray-400 py-0.5">
              <span className="text-emerald-500 shrink-0">›</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
