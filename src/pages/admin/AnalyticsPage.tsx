import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import {
  Users,
  Eye,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  TrendingUp,
  RefreshCw,
  MapPin,
  Clock,
  Activity,
  ChevronDown,
  DollarSign,
  MousePointer,
  BarChart2,
} from 'lucide-react';

interface AdEventRow {
  slot: string;
  event_type: 'impression' | 'click';
  revenue: number;
  platform: string;
  created_at: string;
}

interface AdSlotStats {
  slot: string;
  platform: string;
  impressions: number;
  clicks: number;
  revenue: number;
  ctr: number;
  ecpm: number;
}

const PLATFORM_RATES: Record<string, { cpm: number; cpc: number }> = {
  adsense: { cpm: 2.50, cpc: 0.25 },
  adcash: { cpm: 1.80, cpc: 0.15 },
  adsterra: { cpm: 2.20, cpc: 0.18 },
  media_net: { cpm: 1.90, cpc: 0.20 },
  ezoic: { cpm: 3.10, cpc: 0.30 },
  custom: { cpm: 1.50, cpc: 0.10 },
};

type Range = 'day' | 'week' | 'month' | 'year';

interface ViewRow {
  created_at: string;
  visitor_id: string;
  is_unique: boolean;
  country_name: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  page_path: string;
}

interface OnlineRow {
  visitor_id: string;
  page_path: string;
  country_name: string | null;
  city: string | null;
  device_type: string | null;
  last_seen: string;
}

interface ChartPoint {
  label: string;
  views: number;
  visitors: number;
}

interface GeoRow {
  name: string;
  views: number;
  visitors: number;
}

interface PageRow {
  path: string;
  views: number;
}

const RANGE_LABELS: Record<Range, string> = {
  day: 'Today',
  week: 'Last 7 Days',
  month: 'Last 30 Days',
  year: 'Last 12 Months',
};

function getRangeStart(range: Range): Date {
  const now = new Date();
  switch (range) {
    case 'day': {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'month': {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'year': {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }
}

function buildChartPoints(rows: ViewRow[], range: Range): ChartPoint[] {
  const points: ChartPoint[] = [];
  const now = new Date();

  if (range === 'day') {
    for (let h = 0; h < 24; h++) {
      const label = h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
      points.push({ label, views: 0, visitors: new Set<string>().size });
    }
    const visitorsByHour: Map<number, Set<string>> = new Map();
    for (const row of rows) {
      const d = new Date(row.created_at);
      const h = d.getHours();
      points[h].views++;
      if (!visitorsByHour.has(h)) visitorsByHour.set(h, new Set());
      visitorsByHour.get(h)!.add(row.visitor_id);
    }
    for (const [h, s] of visitorsByHour) {
      points[h].visitors = s.size;
    }
  } else if (range === 'week') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      points.push({ label: `${days[d.getDay()]} ${d.getDate()}`, views: 0, visitors: 0 });
    }
    const visitorsByIdx: Map<number, Set<string>> = new Map();
    const start = getRangeStart(range);
    for (const row of rows) {
      const d = new Date(row.created_at);
      const idx = Math.floor((d.getTime() - start.getTime()) / (86400 * 1000));
      if (idx >= 0 && idx < 7) {
        points[idx].views++;
        if (!visitorsByIdx.has(idx)) visitorsByIdx.set(idx, new Set());
        visitorsByIdx.get(idx)!.add(row.visitor_id);
      }
    }
    for (const [i, s] of visitorsByIdx) {
      if (i < points.length) points[i].visitors = s.size;
    }
  } else if (range === 'month') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      points.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, views: 0, visitors: 0 });
    }
    const visitorsByIdx: Map<number, Set<string>> = new Map();
    const start = getRangeStart(range);
    for (const row of rows) {
      const d = new Date(row.created_at);
      const idx = Math.floor((d.getTime() - start.getTime()) / (86400 * 1000));
      if (idx >= 0 && idx < 30) {
        points[idx].views++;
        if (!visitorsByIdx.has(idx)) visitorsByIdx.set(idx, new Set());
        visitorsByIdx.get(idx)!.add(row.visitor_id);
      }
    }
    for (const [i, s] of visitorsByIdx) {
      if (i < points.length) points[i].visitors = s.size;
    }
  } else {
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      points.push({ label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, views: 0, visitors: 0 });
    }
    const visitorsByIdx: Map<number, Set<string>> = new Map();
    const startMonth = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    for (const row of rows) {
      const d = new Date(row.created_at);
      const monthDiff =
        (d.getFullYear() - startMonth.getFullYear()) * 12 +
        (d.getMonth() - startMonth.getMonth());
      if (monthDiff >= 0 && monthDiff < 12) {
        points[monthDiff].views++;
        if (!visitorsByIdx.has(monthDiff)) visitorsByIdx.set(monthDiff, new Set());
        visitorsByIdx.get(monthDiff)!.add(row.visitor_id);
      }
    }
    for (const [i, s] of visitorsByIdx) {
      if (i < points.length) points[i].visitors = s.size;
    }
  }

  return points;
}

function MiniLineChart({
  points,
  color,
  height = 80,
}: {
  points: number[];
  color: string;
  height?: number;
}) {
  if (!points.length) return null;
  const max = Math.max(...points, 1);
  const w = 100;
  const h = height;
  const step = w / Math.max(points.length - 1, 1);

  const coords = points.map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * h * 0.9 - h * 0.05).toFixed(1)}`);
  const path = `M${coords.join(' L')}`;
  const fill = `M${coords[0]} L${coords.join(' L')} L${(w).toFixed(1)},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#grad-${color.replace('#', '')})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BarChart({
  points,
  metric,
}: {
  points: ChartPoint[];
  metric: 'views' | 'visitors';
}) {
  const values = points.map(p => p[metric]);
  const max = Math.max(...values, 1);
  const showEvery = points.length > 20 ? Math.ceil(points.length / 12) : points.length > 10 ? 2 : 1;

  return (
    <div className="w-full">
      <div className="flex items-end gap-0.5 h-40">
        {points.map((p, i) => {
          const val = p[metric];
          const pct = (val / max) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center group relative">
              <div className="absolute bottom-full mb-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 left-1/2 -translate-x-1/2">
                <span className="font-semibold">{val.toLocaleString()}</span>
                <span className="text-gray-400 dark:text-gray-600 ml-1">{metric}</span>
                <br />
                <span className="text-gray-400 dark:text-gray-600 text-[10px]">{p.label}</span>
              </div>
              <div
                className={`w-full rounded-t transition-all duration-300 ${metric === 'views' ? 'bg-blue-500 hover:bg-blue-400' : 'bg-emerald-500 hover:bg-emerald-400'}`}
                style={{ height: `${Math.max(pct, val > 0 ? 2 : 0)}%`, minHeight: val > 0 ? '3px' : '0' }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex mt-1">
        {points.map((p, i) => (
          <div key={i} className="flex-1 text-center">
            {i % showEvery === 0 && (
              <span className="text-[9px] text-gray-400 dark:text-gray-600 leading-none truncate block">
                {p.label.split(' ')[0]}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>('week');
  const [rangeOpen, setRangeOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ViewRow[]>([]);
  const [online, setOnline] = useState<OnlineRow[]>([]);
  const [metric, setMetric] = useState<'views' | 'visitors'>('views');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [adEvents, setAdEvents] = useState<AdEventRow[]>([]);
  const [adRange, setAdRange] = useState<Range>('week');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const since = getRangeStart(range).toISOString();
      const { data: viewData } = await supabase
        .from('page_views')
        .select('created_at, visitor_id, is_unique, country_name, city, device_type, browser, os, page_path')
        .gte('created_at', since)
        .order('created_at', { ascending: true });

      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data: onlineData } = await supabase
        .from('online_visitors')
        .select('visitor_id, page_path, country_name, city, device_type, last_seen')
        .gte('last_seen', twoMinutesAgo)
        .order('last_seen', { ascending: false });

      setRows((viewData || []) as ViewRow[]);
      setOnline((onlineData || []) as OnlineRow[]);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, [range]);

  const fetchAdData = useCallback(async () => {
    const since = getRangeStart(adRange).toISOString();
    const { data } = await supabase
      .from('ad_events')
      .select('slot, event_type, revenue, platform, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false });
    setAdEvents((data || []) as AdEventRow[]);
  }, [adRange]);

  useEffect(() => { fetchAdData(); }, [fetchAdData]);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 30_000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const totalViews = rows.length;
  const uniqueVisitors = new Set(rows.map(r => r.visitor_id)).size;
  const uniqueToday = rows.filter(r => r.is_unique).length;
  const onlineCount = new Set(online.map(o => o.visitor_id)).size;

  const chartPoints = buildChartPoints(rows, range);

  const byCountry: Map<string, GeoRow> = new Map();
  for (const r of rows) {
    const name = r.country_name || 'Unknown';
    const cur = byCountry.get(name) || { name, views: 0, visitors: 0 };
    cur.views++;
    byCountry.set(name, cur);
  }
  const countryRows = Array.from(byCountry.values())
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  const byCity: Map<string, GeoRow> = new Map();
  for (const r of rows) {
    const name = r.city || 'Unknown';
    const cur = byCity.get(name) || { name, views: 0, visitors: 0 };
    cur.views++;
    byCity.set(name, cur);
  }
  const cityRows = Array.from(byCity.values())
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  const byPage: Map<string, PageRow> = new Map();
  for (const r of rows) {
    const cur = byPage.get(r.page_path) || { path: r.page_path, views: 0 };
    cur.views++;
    byPage.set(r.page_path, cur);
  }
  const pageRows = Array.from(byPage.values())
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  const deviceBreakdown = { desktop: 0, mobile: 0, tablet: 0 };
  for (const r of rows) {
    const d = r.device_type || 'desktop';
    if (d in deviceBreakdown) (deviceBreakdown as any)[d]++;
    else deviceBreakdown.desktop++;
  }
  const totalDev = deviceBreakdown.desktop + deviceBreakdown.mobile + deviceBreakdown.tablet || 1;

  const browserMap: Map<string, number> = new Map();
  for (const r of rows) {
    const b = r.browser || 'Unknown';
    browserMap.set(b, (browserMap.get(b) || 0) + 1);
  }
  const browserRows = Array.from(browserMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxChartVal = Math.max(...chartPoints.map(p => p[metric]), 1);
  const miniTrend = chartPoints.map(p => p[metric]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Visitor insights and traffic data
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Range picker */}
            <div className="relative">
              <button
                onClick={() => setRangeOpen(!rangeOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Clock size={15} />
                {RANGE_LABELS[range]}
                <ChevronDown size={14} />
              </button>
              {rangeOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 overflow-hidden min-w-[160px]">
                  {(Object.keys(RANGE_LABELS) as Range[]).map(r => (
                    <button
                      key={r}
                      onClick={() => { setRange(r); setRangeOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${range === r ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                      {RANGE_LABELS[r]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Online Now banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            <div>
              <span className="text-2xl font-bold">{onlineCount}</span>
              <span className="ml-2 text-emerald-100 font-medium">visitors online right now</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm text-emerald-100">
            {online.slice(0, 3).map((o, i) => (
              <div key={i} className="flex items-center gap-1">
                <Activity size={13} />
                <span className="truncate max-w-[120px]">{o.page_path}</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-emerald-200">
            Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Views', value: totalViews, icon: Eye, color: 'blue', trend: miniTrend },
            { label: 'Unique Visitors', value: uniqueVisitors, icon: Users, color: 'emerald', trend: miniTrend },
            { label: 'New Visitors Today', value: uniqueToday, icon: TrendingUp, color: 'amber', trend: [] },
            { label: 'Online Now', value: onlineCount, icon: Activity, color: 'rose', trend: [] },
          ].map(({ label, value, icon: Icon, color, trend }) => {
            const colorMap: Record<string, { bg: string; text: string; chart: string }> = {
              blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', chart: '#3b82f6' },
              emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', chart: '#10b981' },
              amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', chart: '#f59e0b' },
              rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400', chart: '#f43f5e' },
            };
            const c = colorMap[color];
            return (
              <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 overflow-hidden relative">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${c.bg}`}>
                    <Icon size={18} className={c.text} />
                  </div>
                </div>
                <div className={`text-2xl font-bold ${c.text}`}>{value.toLocaleString()}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
                {trend.length > 1 && (
                  <div className="mt-3 -mx-4 -mb-4">
                    <MiniLineChart points={trend} color={c.chart} height={48} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Main chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Traffic Overview</h2>
            <div className="flex gap-2">
              {(['views', 'visitors'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${metric === m ? (m === 'views' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white') : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                  {m === 'views' ? 'Page Views' : 'Visitors'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <BarChart points={chartPoints} metric={metric} />
          )}

          <div className="mt-4 flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-blue-500" />
              <span>Page Views: <strong className="text-gray-900 dark:text-white">{totalViews.toLocaleString()}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span>Visitors: <strong className="text-gray-900 dark:text-white">{uniqueVisitors.toLocaleString()}</strong></span>
            </div>
          </div>
        </div>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Countries */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe size={16} className="text-blue-600 dark:text-blue-400" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Top Countries</h2>
            </div>
            {countryRows.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-3">
                {countryRows.map((row) => (
                  <div key={row.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{row.name}</span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2 shrink-0">{row.views.toLocaleString()} views</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${(row.views / (countryRows[0]?.views || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cities */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={16} className="text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Top Cities</h2>
            </div>
            {cityRows.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-3">
                {cityRows.map((row) => (
                  <div key={row.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{row.name}</span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2 shrink-0">{row.views.toLocaleString()} views</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${(row.views / (cityRows[0]?.views || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Pages */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-amber-600 dark:text-amber-400" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Top Pages</h2>
            </div>
            {pageRows.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-2">
                {pageRows.map((row, i) => (
                  <div key={row.path} className="flex items-center gap-3 text-sm">
                    <span className="w-5 text-gray-400 dark:text-gray-500 text-right text-xs font-mono shrink-0">{i + 1}</span>
                    <span className="flex-1 font-medium text-gray-800 dark:text-gray-200 truncate">{row.path}</span>
                    <span className="text-gray-500 dark:text-gray-400 shrink-0">{row.views.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Devices & Browsers */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Devices & Browsers</h2>

            <div className="mb-5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Device Type</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { type: 'desktop', icon: Monitor, label: 'Desktop', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                  { type: 'mobile', icon: Smartphone, label: 'Mobile', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { type: 'tablet', icon: Tablet, label: 'Tablet', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                ].map(({ type, icon: Icon, label, color, bg }) => {
                  const count = (deviceBreakdown as any)[type];
                  const pct = Math.round((count / totalDev) * 100);
                  return (
                    <div key={type} className={`rounded-lg p-3 ${bg} text-center`}>
                      <Icon size={20} className={`${color} mx-auto mb-1`} />
                      <div className={`text-lg font-bold ${color}`}>{pct}%</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
                    </div>
                  );
                })}
              </div>

              {totalViews > 0 && (
                <div className="mt-3 h-2 rounded-full overflow-hidden flex gap-0.5">
                  <div className="bg-blue-500 transition-all" style={{ width: `${(deviceBreakdown.desktop / totalDev) * 100}%` }} />
                  <div className="bg-emerald-500 transition-all" style={{ width: `${(deviceBreakdown.mobile / totalDev) * 100}%` }} />
                  <div className="bg-amber-500 transition-all" style={{ width: `${(deviceBreakdown.tablet / totalDev) * 100}%` }} />
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Browser</p>
              <div className="space-y-2">
                {browserRows.map(([name, count]) => (
                  <div key={name} className="flex items-center gap-2 text-sm">
                    <span className="w-20 text-gray-700 dark:text-gray-300 font-medium">{name}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full"
                        style={{ width: `${(count / (browserRows[0]?.[1] || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-gray-500 dark:text-gray-400 w-8 text-right">{count}</span>
                  </div>
                ))}
                {browserRows.length === 0 && (
                  <p className="text-sm text-gray-400 dark:text-gray-500">No data yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Online visitors table */}
        {online.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Live Visitors</h2>
              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">Updates every 30s</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left pb-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Page</th>
                    <th className="text-left pb-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Location</th>
                    <th className="text-left pb-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Device</th>
                    <th className="text-left pb-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Last Seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {online.slice(0, 20).map((o, i) => {
                    const ago = Math.round((Date.now() - new Date(o.last_seen).getTime()) / 1000);
                    const DevIcon = o.device_type === 'mobile' ? Smartphone : o.device_type === 'tablet' ? Tablet : Monitor;
                    return (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="py-2 pr-4 font-medium text-gray-800 dark:text-gray-200 max-w-[200px] truncate">{o.page_path}</td>
                        <td className="py-2 pr-4 text-gray-500 dark:text-gray-400">
                          {[o.city, o.country_name].filter(Boolean).join(', ') || 'Unknown'}
                        </td>
                        <td className="py-2 pr-4">
                          <DevIcon size={14} className="text-gray-400 dark:text-gray-500" />
                        </td>
                        <td className="py-2 text-gray-400 dark:text-gray-500 text-xs">
                          {ago < 60 ? `${ago}s ago` : `${Math.floor(ago / 60)}m ago`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ad Performance Section */}
        {(() => {
          const slotMap = new Map<string, AdSlotStats>();
          for (const ev of adEvents) {
            const rates = PLATFORM_RATES[ev.platform] || PLATFORM_RATES.custom;
            const existing = slotMap.get(ev.slot) || {
              slot: ev.slot,
              platform: ev.platform,
              impressions: 0,
              clicks: 0,
              revenue: 0,
              ctr: 0,
              ecpm: 0,
            };
            if (ev.event_type === 'impression') {
              existing.impressions++;
              existing.revenue += ev.revenue > 0 ? ev.revenue : rates.cpm / 1000;
            } else {
              existing.clicks++;
              existing.revenue += ev.revenue > 0 ? ev.revenue : rates.cpc;
            }
            slotMap.set(ev.slot, existing);
          }

          const slotStats: AdSlotStats[] = Array.from(slotMap.values()).map((s) => ({
            ...s,
            ctr: s.impressions > 0 ? (s.clicks / s.impressions) * 100 : 0,
            ecpm: s.impressions > 0 ? (s.revenue / s.impressions) * 1000 : 0,
          }));

          const totalImpressions = slotStats.reduce((a, s) => a + s.impressions, 0);
          const totalClicks = slotStats.reduce((a, s) => a + s.clicks, 0);
          const totalRevenue = slotStats.reduce((a, s) => a + s.revenue, 0);
          const overallCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <DollarSign size={20} className="text-emerald-600" />
                  Ad Performance
                </h2>
                <div className="flex items-center gap-2">
                  {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setAdRange(r)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        adRange === r
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {RANGE_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Impressions', value: totalImpressions.toLocaleString(), icon: Eye, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-900/20' },
                  { label: 'Total Clicks', value: totalClicks.toLocaleString(), icon: MousePointer, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                  { label: 'Avg. CTR', value: `${overallCtr.toFixed(2)}%`, icon: BarChart2, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                  { label: 'Est. Revenue', value: `$${totalRevenue.toFixed(4)}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                      <Icon size={18} className={color} />
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {slotStats.length > 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Performance by Ad Slot</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Slot</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Platform</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Impressions</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Clicks</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">CTR</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">eCPM</th>
                          <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Est. Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {slotStats.sort((a, b) => b.revenue - a.revenue).map((s) => (
                          <tr key={s.slot} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-200">{s.slot.replace(/_/g, ' ')}</td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 capitalize">{s.platform}</td>
                            <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{s.impressions.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{s.clicks.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{s.ctr.toFixed(2)}%</td>
                            <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">${s.ecpm.toFixed(2)}</td>
                            <td className="px-5 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">${s.revenue.toFixed(4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Revenue estimates use platform-specific CPM/CPC rates (AdSense ~$2.50 CPM, Adcash ~$1.80 CPM, Adsterra ~$2.20 CPM). Actual earnings may vary based on geography, niche, and ad quality score. Check your platform dashboard for verified figures.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-10 text-center">
                  <DollarSign size={36} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No ad events recorded yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Configure ads in Settings → Monetization and enable at least one slot to start tracking.</p>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </AdminLayout>
  );
}
