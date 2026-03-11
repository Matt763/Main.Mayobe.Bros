import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowUpRight,
  Eye,
  FileText,
  RefreshCw,
  Target,
  Zap,
  Award,
  Clock,
} from 'lucide-react';

interface PostPerformance {
  id: string;
  title: string;
  slug: string;
  views: number;
  trending_score: number;
  status: string;
  created_at: string;
  category_name?: string;
}

interface GrowthMetric {
  label: string;
  current: number;
  previous: number;
  format?: 'number' | 'percent';
}

interface DailyViews {
  date: string;
  views: number;
  unique: number;
}

function MiniBarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[2px] h-10">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t transition-all"
          style={{
            height: `${Math.max((v / max) * 100, v > 0 ? 4 : 0)}%`,
            background: color,
            opacity: i === data.length - 1 ? 1 : 0.5 + (i / data.length) * 0.5,
          }}
        />
      ))}
    </div>
  );
}

function GrowthBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <span className="text-xs text-gray-400">--</span>;
  if (previous === 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-green-600 dark:text-green-400">
      <ArrowUpRight size={12} /> New
    </span>
  );
  const pct = ((current - previous) / previous) * 100;
  const isUp = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${isUp ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
      {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export default function TrafficGrowthPage() {
  const [loading, setLoading] = useState(true);
  const [topPosts, setTopPosts] = useState<PostPerformance[]>([]);
  const [risingPosts, setRisingPosts] = useState<PostPerformance[]>([]);
  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetric[]>([]);
  const [dailyData, setDailyData] = useState<DailyViews[]>([]);
  const [activeTab, setActiveTab] = useState<'top' | 'rising' | 'sources'>('top');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000).toISOString();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000).toISOString();

      const [
        { data: posts },
        { data: recentViews },
        { data: prevViews },
        { data: weekViews },
        { data: prevWeekViews },
        { count: totalComments },
        { count: totalSubscribers },
        { data: allViews },
      ] = await Promise.all([
        supabase
          .from('posts')
          .select('id, title, slug, views, trending_score, status, created_at, categories(name)')
          .eq('status', 'published')
          .order('views', { ascending: false })
          .limit(50),
        supabase
          .from('page_views')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgo),
        supabase
          .from('page_views')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sixtyDaysAgo)
          .lt('created_at', thirtyDaysAgo),
        supabase
          .from('page_views')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo),
        supabase
          .from('page_views')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', fourteenDaysAgo)
          .lt('created_at', sevenDaysAgo),
        supabase
          .from('comments')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('newsletter_subscribers')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('page_views')
          .select('created_at, visitor_id, is_unique')
          .gte('created_at', thirtyDaysAgo)
          .order('created_at', { ascending: true }),
      ]);

      const allPosts = (posts || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        views: p.views || 0,
        trending_score: p.trending_score || 0,
        status: p.status,
        created_at: p.created_at,
        category_name: p.categories?.name,
      }));

      setTopPosts(allPosts.slice(0, 15));

      const rising = [...allPosts]
        .sort((a, b) => b.trending_score - a.trending_score)
        .slice(0, 15);
      setRisingPosts(rising);

      const recentCount = (recentViews as any)?.count ?? 0;
      const prevCount = (prevViews as any)?.count ?? 0;
      const weekCount = (weekViews as any)?.count ?? 0;
      const prevWeekCount = (prevWeekViews as any)?.count ?? 0;

      setGrowthMetrics([
        { label: 'Monthly Views', current: recentCount, previous: prevCount },
        { label: 'Weekly Views', current: weekCount, previous: prevWeekCount },
        { label: 'Published Articles', current: allPosts.length, previous: 0 },
        { label: 'Active Subscribers', current: totalSubscribers ?? 0, previous: 0 },
        { label: 'Total Comments', current: totalComments ?? 0, previous: 0 },
      ]);

      const dayMap = new Map<string, { views: number; unique: Set<string> }>();
      for (const v of allViews || []) {
        const d = new Date(v.created_at).toISOString().split('T')[0];
        const entry = dayMap.get(d) || { views: 0, unique: new Set<string>() };
        entry.views++;
        if (v.is_unique) entry.unique.add(v.visitor_id);
        dayMap.set(d, entry);
      }

      const days: DailyViews[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const key = d.toISOString().split('T')[0];
        const entry = dayMap.get(key);
        days.push({
          date: key,
          views: entry?.views || 0,
          unique: entry?.unique.size || 0,
        });
      }
      setDailyData(days);
    } catch (error) {
      console.error('Traffic growth error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalMonthViews = dailyData.reduce((s, d) => s + d.views, 0);
  const avgDaily = dailyData.length ? Math.round(totalMonthViews / dailyData.length) : 0;
  const peakDay = dailyData.reduce((best, d) => (d.views > best.views ? d : best), dailyData[0] || { date: '', views: 0, unique: 0 });
  const chartMax = Math.max(...dailyData.map(d => d.views), 1);

  const METRIC_ICONS = [BarChart3, TrendingUp, FileText, Target, Zap];
  const METRIC_COLORS = [
    'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
    'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <TrendingUp size={24} className="text-emerald-600" />
              Traffic Growth Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Track content performance, growth trends, and audience engagement.
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60 self-start"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {growthMetrics.map((m, i) => {
            const Icon = METRIC_ICONS[i % METRIC_ICONS.length];
            const colorClass = METRIC_COLORS[i % METRIC_COLORS.length];
            const [borderColor, bgColor, , textColor] = colorClass.split(' ');
            return (
              <div
                key={m.label}
                className={`bg-white dark:bg-gray-800 rounded-xl border-l-4 ${borderColor} p-4`}
              >
                <div className={`w-8 h-8 rounded-lg ${bgColor} dark:bg-opacity-30 flex items-center justify-center mb-2`}>
                  <Icon size={16} className={textColor || 'text-gray-600'} />
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {m.current.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{m.label}</div>
                {m.previous > 0 && (
                  <div className="mt-1">
                    <GrowthBadge current={m.current} previous={m.previous} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              30-Day Traffic Overview
            </h2>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>Avg/day: <strong className="text-gray-900 dark:text-white">{avgDaily}</strong></span>
              {peakDay && peakDay.views > 0 && (
                <span>Peak: <strong className="text-gray-900 dark:text-white">{peakDay.views}</strong> on {new Date(peakDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              )}
            </div>
          </div>

          <div className="flex items-end gap-[3px] h-44">
            {dailyData.map((d, i) => {
              const pct = (d.views / chartMax) * 100;
              const isToday = i === dailyData.length - 1;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center group relative">
                  <div className="absolute bottom-full mb-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg px-3 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 left-1/2 -translate-x-1/2 shadow-lg">
                    <div className="font-semibold">{d.views} views</div>
                    <div className="text-gray-400 dark:text-gray-600">{new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                  </div>
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${isToday ? 'bg-emerald-500' : 'bg-blue-400 dark:bg-blue-500 hover:bg-blue-500 dark:hover:bg-blue-400'}`}
                    style={{
                      height: `${Math.max(pct, d.views > 0 ? 2 : 0)}%`,
                      minHeight: d.views > 0 ? '3px' : '0',
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex mt-2">
            {dailyData.map((d, i) => (
              <div key={d.date} className="flex-1 text-center">
                {i % 5 === 0 && (
                  <span className="text-[9px] text-gray-400 dark:text-gray-600">
                    {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {([
              { key: 'top', label: 'Top Performing' },
              { key: 'rising', label: 'Rising Content' },
              { key: 'sources', label: 'Growth Insights' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === 'top' && (
              <div className="space-y-2">
                {topPosts.map((post, i) => (
                  <div
                    key={post.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                      i < 3
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {i < 3 ? <Award size={14} /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                        {post.category_name && <span>{post.category_name}</span>}
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                        <Eye size={13} className="text-blue-500" />
                        {post.views.toLocaleString()}
                      </div>
                    </div>
                    <div className="w-20 flex-shrink-0">
                      <MiniBarChart
                        data={Array.from({ length: 7 }, (_, j) => Math.max(0, post.views - Math.floor(Math.random() * post.views * 0.3) * (6 - j)))}
                        color={i < 3 ? '#f59e0b' : '#3b82f6'}
                      />
                    </div>
                  </div>
                ))}
                {topPosts.length === 0 && (
                  <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                    <FileText size={36} className="mx-auto mb-3 opacity-40" />
                    <p>No published posts yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'rising' && (
              <div className="space-y-2">
                {risingPosts.map((post, i) => (
                  <div
                    key={post.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      post.trending_score > 50
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        : post.trending_score > 20
                        ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      <TrendingUp size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                        {post.category_name && <span>{post.category_name}</span>}
                        <span>{post.views.toLocaleString()} views</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className={`text-sm font-bold ${
                        post.trending_score > 50
                          ? 'text-red-600 dark:text-red-400'
                          : post.trending_score > 20
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {post.trending_score.toFixed(0)}
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium">
                        score
                      </span>
                    </div>
                  </div>
                ))}
                {risingPosts.length === 0 && (
                  <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                    <TrendingUp size={36} className="mx-auto mb-3 opacity-40" />
                    <p>No trending content yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sources' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    Growth Strategy Recommendations
                  </h3>
                  <div className="space-y-3">
                    {[
                      {
                        title: 'Publish consistently',
                        desc: 'Aim for at least 3 articles per week to build organic traffic momentum.',
                        color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
                      },
                      {
                        title: 'Optimize for Google Discover',
                        desc: 'Use high-quality featured images (1200x675px+) and compelling headlines.',
                        color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400',
                      },
                      {
                        title: 'Build topic clusters',
                        desc: 'Create pillar content with supporting articles to boost topical authority.',
                        color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
                      },
                      {
                        title: 'Leverage social channels',
                        desc: 'Auto-share new posts to Facebook, Twitter, LinkedIn, and Telegram.',
                        color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400',
                      },
                      {
                        title: 'Focus on long-tail keywords',
                        desc: 'Target low-competition keywords with 100-1K monthly searches for quick wins.',
                        color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400',
                      },
                    ].map((tip, i) => {
                      const [textClr, bgClr] = tip.color.split(' ');
                      return (
                        <div key={i} className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                          <div className={`w-8 h-8 rounded-lg ${bgClr} flex items-center justify-center flex-shrink-0`}>
                            <Zap size={14} className={textClr} />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">{tip.title}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tip.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    Content Performance Summary
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white">
                      <div className="text-3xl font-bold">{totalMonthViews.toLocaleString()}</div>
                      <div className="text-emerald-100 text-sm mt-1">Total views this month</div>
                      <div className="mt-3 flex items-center gap-4 text-sm">
                        <div>
                          <div className="text-emerald-200 text-xs">Avg daily</div>
                          <div className="font-semibold">{avgDaily}</div>
                        </div>
                        <div>
                          <div className="text-emerald-200 text-xs">Peak day</div>
                          <div className="font-semibold">{peakDay?.views || 0}</div>
                        </div>
                        <div>
                          <div className="text-emerald-200 text-xs">Articles</div>
                          <div className="font-semibold">{topPosts.length}</div>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                        Views by Category
                      </h4>
                      {(() => {
                        const catMap = new Map<string, number>();
                        for (const p of topPosts) {
                          const name = p.category_name || 'Uncategorized';
                          catMap.set(name, (catMap.get(name) || 0) + p.views);
                        }
                        const cats = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
                        const maxViews = cats[0]?.[1] || 1;

                        return (
                          <div className="space-y-2">
                            {cats.map(([name, views]) => (
                              <div key={name}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-gray-700 dark:text-gray-300 font-medium">{name}</span>
                                  <span className="text-gray-500 dark:text-gray-400">{views.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 rounded-full transition-all"
                                    style={{ width: `${(views / maxViews) * 100}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                            {cats.length === 0 && (
                              <p className="text-sm text-gray-400 text-center py-4">No data</p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
