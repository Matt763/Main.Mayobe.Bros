import { useState, useEffect } from 'react';
import {
  Newspaper, Sparkles, Key, X, ChevronDown, ChevronUp,
  Loader2, TrendingUp, ExternalLink, CheckCircle2, AlertCircle,
  RefreshCw, Zap,
} from 'lucide-react';

interface HeadlineGeneratorProps {
  onSetTitle: (title: string) => void;
  onSetPrompt?: (prompt: string) => void;
}

interface HeadlineIdea {
  headline: string;
  category: string;
  label: string;
  type: string;
  primaryKeyword: string;
  searchVolume: 'High' | 'Very High' | 'Medium';
  whyEvergreen: string;
  trendsQuery: string;
  estimatedWordCount: number;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const VOLUME_COLOR: Record<string, string> = {
  'Very High': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'High': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Medium': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const TYPE_COLOR: Record<string, string> = {
  'How-To': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Listicle': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'Ultimate Guide': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Question': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'Comparison': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Problem-Solution': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function HeadlineGenerator({ onSetTitle, onSetPrompt }: HeadlineGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);

  const [categories, setCategories] = useState<string[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [headlines, setHeadlines] = useState<HeadlineIdea[]>([]);
  const [usedIndex, setUsedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && categories.length === 0) {
      fetchSiteData();
    }
  }, [isOpen]);

  const fetchSiteData = async () => {
    setLoadingData(true);
    try {
      const { supabase } = await import('../../lib/supabase');
      const [{ data: cats }, { data: lbls }] = await Promise.all([
        supabase.from('categories').select('name').order('name'),
        supabase.from('labels').select('name').order('name'),
      ]);
      setCategories((cats || []).map((c: { name: string }) => c.name));
      setLabels((lbls || []).map((l: { name: string }) => l.name));
    } catch {
      // Silently fall back — generator still works with no categories
    } finally {
      setLoadingData(false);
    }
  };

  const generateHeadlines = async () => {
    if (!apiKey) { setShowKeyInput(true); return; }
    setLoading(true);
    setError(null);
    setHeadlines([]);
    setUsedIndex(null);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'X-OpenAI-Key': apiKey,
        },
        body: JSON.stringify({
          action: 'generate_evergreen_headline',
          title: 'Generate evergreen headlines',
          category: selectedCategory || undefined,
          existingPosts: categories,
          keywords: labels,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      let parsed: HeadlineIdea[];
      try {
        parsed = JSON.parse(data.result);
      } catch {
        throw new Error('Could not parse headline suggestions. Please try again.');
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('No headlines returned. Please try again.');
      }

      setHeadlines(parsed);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const useHeadline = (idea: HeadlineIdea, idx: number) => {
    onSetTitle(idea.headline);
    if (onSetPrompt) {
      onSetPrompt(`Write a comprehensive 4,000-5,000 word article about: ${idea.headline}. Target keyword: ${idea.primaryKeyword}. Category: ${idea.category}.`);
    }
    setUsedIndex(idx);
  };

  const openGoogleTrends = (query: string) => {
    const encoded = encodeURIComponent(query);
    window.open(`https://trends.google.com/trends/explore?q=${encoded}`, '_blank', 'noopener');
  };

  return (
    <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-xl border border-violet-100 dark:border-violet-900/50 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-md shadow-violet-200 dark:shadow-violet-900/30">
            <Newspaper size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Headline Generator</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Evergreen topics from your categories + Trends</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowKeyInput(!showKeyInput); }}
            className="p-1.5 rounded-lg hover:bg-violet-100 dark:hover:bg-gray-700 transition-colors"
            title="Configure API key"
          >
            <Key size={14} className={apiKey ? 'text-green-500' : 'text-gray-400'} />
          </button>
          {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </button>

      {/* API Key Input */}
      {showKeyInput && (
        <div className="px-4 pb-3 border-t border-violet-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 mb-2">OpenAI API key — stored in your browser only.</p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="flex-1 text-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => { localStorage.setItem('openai_api_key', apiKey); setShowKeyInput(false); }}
              className="px-3 py-2 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 transition-colors"
            >Save</button>
            <button type="button" onClick={() => setShowKeyInput(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <X size={14} className="text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="border-t border-violet-100 dark:border-gray-700 p-4 space-y-4">
          {/* Category filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Filter by Category <span className="font-normal text-gray-400">(optional)</span>
            </label>
            {loadingData ? (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Loader2 size={12} className="animate-spin" /> Loading site categories…
              </div>
            ) : (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 text-xs"
              >
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>

          {/* Info box */}
          <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3 border border-violet-100 dark:border-violet-800/40">
            <p className="text-xs text-violet-700 dark:text-violet-300 font-semibold mb-1">How it works</p>
            <ul className="text-xs text-violet-600 dark:text-violet-400 space-y-0.5">
              <li>• AI generates 8 evergreen headlines from your site's categories & labels</li>
              <li>• Each headline targets a high-volume, AdSense-friendly topic</li>
              <li>• Click "Check Trends" to verify demand on Google Trends</li>
              <li>• Click "Use" to auto-fill your post title and prompt</li>
            </ul>
          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={generateHeadlines}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-violet-200 dark:shadow-violet-900/30 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Generating evergreen topics…</>
            ) : (
              <><Sparkles size={16} /> {headlines.length > 0 ? 'Regenerate Headlines' : 'Generate Evergreen Headlines'}</>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Headlines list */}
          {headlines.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{headlines.length} evergreen topics found</p>
                <button
                  type="button"
                  onClick={generateHeadlines}
                  disabled={loading}
                  className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 transition-colors"
                >
                  <RefreshCw size={11} /> Refresh
                </button>
              </div>

              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {headlines.map((idea, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border p-3 transition-colors ${
                      usedIndex === i
                        ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700'
                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                    }`}
                  >
                    {/* Headline title */}
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug mb-2">
                      {idea.headline}
                    </p>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {idea.type && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOR[idea.type] || 'bg-gray-100 text-gray-600'}`}>
                          {idea.type}
                        </span>
                      )}
                      {idea.searchVolume && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${VOLUME_COLOR[idea.searchVolume] || 'bg-gray-100 text-gray-600'}`}>
                          {idea.searchVolume} Volume
                        </span>
                      )}
                      {idea.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                          {idea.category}
                        </span>
                      )}
                    </div>

                    {/* Keyword + why evergreen */}
                    {idea.primaryKeyword && (
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                        <span className="font-semibold text-gray-600 dark:text-gray-300">Keyword:</span> {idea.primaryKeyword}
                      </p>
                    )}
                    {idea.whyEvergreen && (
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed mb-2 italic">
                        {idea.whyEvergreen}
                      </p>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => useHeadline(idea, i)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          usedIndex === i
                            ? 'bg-violet-600 text-white'
                            : 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-800/50'
                        }`}
                      >
                        {usedIndex === i ? (
                          <><CheckCircle2 size={12} /> Used</>
                        ) : (
                          <><Zap size={12} /> Use This</>
                        )}
                      </button>
                      {idea.trendsQuery && (
                        <button
                          type="button"
                          onClick={() => openGoogleTrends(idea.trendsQuery)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 text-xs font-medium transition-colors"
                          title="Check this topic on Google Trends"
                        >
                          <TrendingUp size={11} />
                          Trends
                          <ExternalLink size={9} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
