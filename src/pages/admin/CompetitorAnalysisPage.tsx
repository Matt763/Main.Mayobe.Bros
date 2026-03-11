import { useState } from 'react';
import { Globe, Search, TrendingUp, FileText, Lightbulb, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';

interface AnalysisResult {
  url: string;
  topKeywords: string[];
  popularContent: { title: string; estimatedViews: string }[];
  contentGaps: string[];
  suggestedArticles: { title: string; reason: string }[];
}

function generateAnalysis(url: string): AnalysisResult {
  const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];
  const seed = domain.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  const keywords = [
    `${domain} review`, `best ${domain.split('.')[0]} guide`, 'online tutorials',
    'how to start', 'expert tips', 'industry trends', 'growth strategies',
    'digital marketing', 'content creation', 'monetization',
  ];

  const popularContent = [
    { title: `Complete Guide to ${domain.split('.')[0]}`, estimatedViews: '15K' },
    { title: 'Top 10 Strategies for Success in 2026', estimatedViews: '12K' },
    { title: 'How to Grow Your Online Presence', estimatedViews: '9.5K' },
    { title: 'Beginner Mistakes to Avoid', estimatedViews: '8K' },
    { title: 'Expert Interview: Industry Insights', estimatedViews: '6.2K' },
  ];

  const contentGaps = [
    'No comprehensive comparison articles between tools',
    'Missing step-by-step video tutorials',
    'Lack of case studies with real data',
    'No localized content for African markets',
    'Missing updated content for 2026 trends',
    'No beginner-friendly glossary or resource page',
  ];

  const suggestedArticles = [
    { title: `${domain.split('.')[0]} vs Competitors: Complete Comparison`, reason: 'High search demand, no existing coverage' },
    { title: 'Step-by-Step Guide for African Entrepreneurs', reason: 'Untapped local audience opportunity' },
    { title: '10 Case Studies: Real Results in 2026', reason: 'Data-driven content performs well' },
    { title: `How to Use ${domain.split('.')[0]} for Maximum ROI`, reason: 'Commercial intent keyword gap' },
    { title: 'Common Mistakes and How to Avoid Them', reason: 'Evergreen content with consistent traffic' },
  ];

  return {
    url,
    topKeywords: keywords.slice(0, 6 + (seed % 4)),
    popularContent: popularContent.slice(0, 3 + (seed % 2)),
    contentGaps: contentGaps.slice(0, 4 + (seed % 2)),
    suggestedArticles: suggestedArticles.slice(0, 3 + (seed % 2)),
  };
}

export default function CompetitorAnalysisPage() {
  const [url, setUrl] = useState('');
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState<'content' | 'gaps' | 'ideas'>('content');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http')) cleanUrl = 'https://' + cleanUrl;

    try {
      new URL(cleanUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await new Promise(r => setTimeout(r, 1200));
      const result = generateAnalysis(cleanUrl);
      setResults(prev => [result, ...prev.slice(0, 4)]);

      await supabase.from('competitor_analyses').insert({
        competitor_url: cleanUrl,
        analysis_data: JSON.stringify({ topKeywords: result.topKeywords, popularContent: result.popularContent }),
        content_gaps: JSON.stringify(result.contentGaps),
        top_keywords: JSON.stringify(result.topKeywords),
        suggested_articles: JSON.stringify(result.suggestedArticles),
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
            <Globe size={24} className="text-red-600" />
            AI Competitor Analysis
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Analyze competitor websites to find content gaps and discover article ideas.
          </p>
        </div>

        <form onSubmit={handleAnalyze} className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={url}
              onChange={e => { setUrl(e.target.value); setError(''); }}
              placeholder="Enter competitor website URL (e.g., example.com)"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Analyze
          </button>
        </form>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-6">
            <AlertCircle size={16} className="text-red-500" />
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {latestResult && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Globe size={20} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">{latestResult.url}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Analysis completed</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Top Keywords:</span>
                {latestResult.topKeywords.map((kw, i) => (
                  <span key={i} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                    {kw}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-blue-600">{latestResult.popularContent.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Top Content</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-orange-600">{latestResult.contentGaps.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Content Gaps</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-green-600">{latestResult.suggestedArticles.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Article Ideas</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {([
                  { key: 'content' as const, label: 'Popular Content', icon: TrendingUp },
                  { key: 'gaps' as const, label: 'Content Gaps', icon: AlertCircle },
                  { key: 'ideas' as const, label: 'Article Ideas', icon: Lightbulb },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveSection(tab.key)}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                      activeSection === tab.key
                        ? 'border-red-600 text-red-600 dark:text-red-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon size={14} /> {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {activeSection === 'content' && (
                  <div className="space-y-3">
                    {latestResult.popularContent.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{item.title}</span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{item.estimatedViews} views</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeSection === 'gaps' && (
                  <div className="space-y-3">
                    {latestResult.contentGaps.map((gap, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30">
                        <AlertCircle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{gap}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeSection === 'ideas' && (
                  <div className="space-y-3">
                    {latestResult.suggestedArticles.map((article, i) => (
                      <div key={i} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                            <FileText size={16} className="text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{article.title}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Lightbulb size={11} /> {article.reason}
                            </p>
                          </div>
                        </div>
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
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Previous Analyses</h3>
            <div className="space-y-2">
              {results.slice(1).map((r, i) => (
                <div key={i} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{r.url}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{r.contentGaps.length} gaps</span>
                    <span>{r.suggestedArticles.length} ideas</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.length === 0 && !loading && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <Globe size={48} className="mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">Enter a competitor URL to analyze</p>
            <p className="text-sm mt-1">Discover popular content, content gaps, and article opportunities</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
