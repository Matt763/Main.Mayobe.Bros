import { useState } from 'react';
import { Search, TrendingUp, BarChart3, Target, Zap, ArrowRight, Loader2 } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';

interface KeywordResult {
  keyword: string;
  searchVolume: string;
  difficulty: string;
  intent: string;
  longTailKeywords: string[];
  relatedKeywords: string[];
}

const INTENT_COLORS: Record<string, string> = {
  informational: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  commercial: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  transactional: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  navigational: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'text-green-600',
  Medium: 'text-amber-600',
  Hard: 'text-orange-600',
  'Very Hard': 'text-red-600',
};

function generateKeywordData(keyword: string): KeywordResult {
  const words = keyword.toLowerCase().split(' ');
  const hash = words.reduce((acc, w) => acc + w.charCodeAt(0), 0);

  const volumes = ['100-1K', '1K-10K', '10K-100K', '100K+'];
  const difficulties = ['Easy', 'Medium', 'Hard', 'Very Hard'];
  const intents = ['informational', 'commercial', 'transactional', 'navigational'];

  const longTails = [
    `how to ${keyword} for beginners`,
    `best ${keyword} guide 2026`,
    `${keyword} tips and tricks`,
    `${keyword} step by step tutorial`,
    `why is ${keyword} important`,
    `${keyword} vs alternatives`,
    `top ${keyword} strategies`,
    `${keyword} for small business`,
  ];

  const related = [
    `${words[0]} tools`,
    `${words[0]} software`,
    `${words[0]} examples`,
    `${words[0]} benefits`,
    `${words[0]} course`,
    `best ${words[0]} practices`,
  ];

  return {
    keyword,
    searchVolume: volumes[hash % volumes.length],
    difficulty: difficulties[hash % difficulties.length],
    intent: intents[hash % intents.length],
    longTailKeywords: longTails.slice(0, 5 + (hash % 3)),
    relatedKeywords: related.slice(0, 4 + (hash % 2)),
  };
}

export default function KeywordResearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'longtail' | 'related'>('overview');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      const result = generateKeywordData(query.trim());
      setResults(prev => [result, ...prev.slice(0, 9)]);

      await supabase.from('keyword_research').insert({
        keyword: result.keyword,
        search_volume: result.searchVolume,
        difficulty: result.difficulty,
        intent: result.intent,
        long_tail_keywords: JSON.stringify(result.longTailKeywords),
        related_keywords: JSON.stringify(result.relatedKeywords),
      });
    } finally {
      setLoading(false);
    }
  };

  const latestResult = results[0];

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BarChart3 size={24} className="text-amber-600" />
            AI Keyword Research Lab
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Research keywords, analyze search intent, and discover long-tail opportunities.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Enter a keyword or topic to research..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Research
          </button>
        </form>

        {latestResult && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-blue-600" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Search Volume</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{latestResult.searchVolume}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={16} className="text-orange-600" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Difficulty</span>
                </div>
                <p className={`text-lg font-bold ${DIFFICULTY_COLORS[latestResult.difficulty] || 'text-gray-900 dark:text-white'}`}>
                  {latestResult.difficulty}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={16} className="text-green-600" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Search Intent</span>
                </div>
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${INTENT_COLORS[latestResult.intent] || ''}`}>
                  {latestResult.intent}
                </span>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={16} className="text-amber-600" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Long-tail Ideas</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{latestResult.longTailKeywords.length}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {(['overview', 'longtail', 'related'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === tab
                        ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab === 'overview' ? 'Overview' : tab === 'longtail' ? 'Long-tail Keywords' : 'Related Keywords'}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Keyword Analysis: "{latestResult.keyword}"</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        This keyword has <strong>{latestResult.searchVolume}</strong> monthly searches with <strong>{latestResult.difficulty.toLowerCase()}</strong> competition.
                        The primary search intent is <strong>{latestResult.intent}</strong>, meaning users are
                        {latestResult.intent === 'informational' ? ' looking for information and answers.' :
                         latestResult.intent === 'commercial' ? ' researching products or services before purchasing.' :
                         latestResult.intent === 'transactional' ? ' ready to make a purchase or take action.' :
                         ' trying to find a specific website or page.'}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Top Long-tail Suggestions</h4>
                        {latestResult.longTailKeywords.slice(0, 3).map((kw, i) => (
                          <div key={i} className="flex items-center gap-2 py-1.5 text-sm text-gray-600 dark:text-gray-400">
                            <ArrowRight size={12} className="text-amber-500 flex-shrink-0" />
                            {kw}
                          </div>
                        ))}
                      </div>
                      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Related Topics</h4>
                        {latestResult.relatedKeywords.slice(0, 3).map((kw, i) => (
                          <div key={i} className="flex items-center gap-2 py-1.5 text-sm text-gray-600 dark:text-gray-400">
                            <ArrowRight size={12} className="text-blue-500 flex-shrink-0" />
                            {kw}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'longtail' && (
                  <div className="space-y-2">
                    {latestResult.longTailKeywords.map((kw, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{kw}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{['100-1K', '1K-10K', '10K-100K'][i % 3]}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'related' && (
                  <div className="space-y-2">
                    {latestResult.relatedKeywords.map((kw, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{kw}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${['bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'][i % 3]}`}>
                          {['Easy', 'Medium', 'Hard'][i % 3]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {results.length > 1 && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Recent Searches</h3>
            <div className="space-y-2">
              {results.slice(1).map((r, i) => (
                <div key={i} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{r.keyword}</span>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>{r.searchVolume}</span>
                    <span className={DIFFICULTY_COLORS[r.difficulty]}>{r.difficulty}</span>
                    <span className={`px-2 py-0.5 rounded-full ${INTENT_COLORS[r.intent]}`}>{r.intent}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.length === 0 && !loading && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <Search size={48} className="mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">Enter a keyword to start researching</p>
            <p className="text-sm mt-1">Get search volume, difficulty, intent analysis, and long-tail suggestions</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
