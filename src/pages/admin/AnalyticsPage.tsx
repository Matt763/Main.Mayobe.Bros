import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — react-simple-maps v3 ships no declaration file
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import AdminLayout from '../../components/admin/AdminLayout';
import Toast from '../../components/admin/Toast';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import {
  Eye, Users, Activity, Globe, Monitor, Smartphone, Tablet,
  TrendingUp, RefreshCw, MapPin, Clock, Search, BarChart2,
  DollarSign, MousePointer, Download, Trash2, AlertTriangle,
  X, ArrowUpRight, ArrowDownRight, Wifi, ExternalLink, Zap,
  Link2, Grid3X3, RotateCcw, ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Range = 'day' | 'week' | 'month' | 'year';
type TrafficSource = 'organic' | 'social' | 'direct' | 'referral';

interface ViewRow {
  created_at: string;
  session_id: string | null;
  visitor_id: string;
  is_unique: boolean;
  country_code: string | null;
  country_name: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  page_path: string;
  referrer: string | null;
}

interface OnlineRow {
  visitor_id: string;
  page_path: string;
  country_name: string | null;
  city: string | null;
  device_type: string | null;
  last_seen: string;
}

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

interface BarItem { label: string; value: number; }
interface MapTooltip { name: string; count: number; x: number; y: number; }

// ─── Constants ────────────────────────────────────────────────────────────────

const GEO_URL =
  'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson';

const PLATFORM_RATES: Record<string, { cpm: number; cpc: number }> = {
  adsense:   { cpm: 2.50, cpc: 0.25 },
  adcash:    { cpm: 1.80, cpc: 0.15 },
  adsterra:  { cpm: 2.20, cpc: 0.18 },
  media_net: { cpm: 1.90, cpc: 0.20 },
  ezoic:     { cpm: 3.10, cpc: 0.30 },
  custom:    { cpm: 1.50, cpc: 0.10 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRangeStart(range: Range): Date {
  const now = new Date();
  if (range === 'day') { const d = new Date(now); d.setHours(0, 0, 0, 0); return d; }
  const days = { week: 6, month: 29, year: 364 }[range] as number;
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function classifyReferrer(referrer: string | null): TrafficSource {
  if (!referrer) return 'direct';
  const r = referrer.toLowerCase();
  if (/google\.|bing\.|yahoo\.|duckduckgo\.|yandex\.|baidu\.|ecosia\.|search\.yahoo/.test(r)) return 'organic';
  if (/facebook\.|twitter\.|t\.co\/|instagram\.|linkedin\.|youtube\.|tiktok\.|pinterest\.|reddit\.|whatsapp\.|telegram\./.test(r)) return 'social';
  return 'referral';
}

function getSearchEngine(referrer: string): string {
  const r = referrer.toLowerCase();
  if (r.includes('google.'))     return 'Google';
  if (r.includes('bing.'))       return 'Bing';
  if (r.includes('yahoo.'))      return 'Yahoo';
  if (r.includes('duckduckgo.')) return 'DuckDuckGo';
  if (r.includes('yandex.'))     return 'Yandex';
  if (r.includes('baidu.'))      return 'Baidu';
  if (r.includes('ecosia.'))     return 'Ecosia';
  return 'Other';
}

function extractReferrerDomain(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    return url.hostname.replace(/^www\./, '');
  } catch { return null; }
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 1) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function formatRelTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

function buildChartData(rows: ViewRow[], range: Range): { label: string; views: number; visitors: number }[] {
  const now = new Date();
  const bins = new Map<string, { views: number; visitors: Set<string> }>();

  if (range === 'day') {
    for (let h = 0; h < 24; h++) bins.set(`${h}:00`, { views: 0, visitors: new Set() });
  } else if (range === 'week') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      bins.set(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), { views: 0, visitors: new Set() });
    }
  } else if (range === 'month') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      bins.set(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), { views: 0, visitors: new Set() });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now); d.setMonth(d.getMonth() - i); d.setDate(1);
      bins.set(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), { views: 0, visitors: new Set() });
    }
  }

  rows.forEach(row => {
    const d = new Date(row.created_at);
    let key: string;
    if (range === 'day')       key = `${d.getHours()}:00`;
    else if (range === 'year') key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    else                       key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const bin = bins.get(key);
    if (bin) { bin.views++; bin.visitors.add(row.visitor_id); }
  });

  return Array.from(bins.entries()).map(([label, { views, visitors }]) => ({
    label, views, visitors: visitors.size,
  }));
}

function buildHourlyHeatmap(rows: ViewRow[]): number[][] {
  // Returns [day][hour] grid for last 7 days × 24 hours
  const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  const now = Date.now();
  rows.forEach(row => {
    const d = new Date(row.created_at);
    const daysAgo = Math.floor((now - d.getTime()) / 86_400_000);
    if (daysAgo >= 0 && daysAgo < 7) {
      grid[6 - daysAgo][d.getHours()]++;
    }
  });
  return grid;
}

function exportCSV(rows: ViewRow[]): void {
  const headers = ['Date', 'Path', 'Country', 'City', 'Device', 'Browser', 'OS', 'Source', 'Referrer'];
  const csvRows = rows.map(r =>
    [new Date(r.created_at).toISOString(), r.page_path, r.country_name || '', r.city || '',
     r.device_type || '', r.browser || '', r.os || '',
     classifyReferrer(r.referrer), r.referrer || '']
      .map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
  );
  const csv = [headers.join(','), ...csvRows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `mayobe-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// ─── Paginated fetch ──────────────────────────────────────────────────────────
// Supabase PostgREST hard-caps responses at 1000 rows regardless of .limit().
// We page through in batches of 1000 until we receive a partial page (done).
async function fetchAllPageViews(fields: string, rangeStart: Date): Promise<ViewRow[]> {
  const PAGE = 1000;
  const all: ViewRow[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('page_views')
      .select(fields)
      .gte('created_at', rangeStart.toISOString())
      .order('created_at', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as ViewRow[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-[#0d1117]/80 border border-gray-200 dark:border-[#1e2a3a] rounded-2xl overflow-hidden backdrop-blur-sm shadow-sm dark:shadow-none ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, accent = 'emerald', right }: {
  icon: React.ElementType; title: string; subtitle?: string;
  accent?: 'emerald' | 'blue' | 'violet' | 'amber' | 'cyan' | 'rose';
  right?: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-400', blue: 'text-blue-400',
    violet: 'text-violet-400', amber: 'text-amber-400',
    cyan: 'text-cyan-400', rose: 'text-rose-400',
  };
  return (
    <div className="flex items-start justify-between gap-3 mb-6">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl bg-gray-100 dark:bg-white/5 ${colors[accent]}`}>
          <Icon size={15} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white tracking-wide">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

function DualLineChart({ data, isDark }: { data: { label: string; views: number; visitors: number }[]; isDark: boolean }) {
  if (data.length < 2) {
    return <div className="flex items-center justify-center h-48 text-slate-600 text-sm">No data for selected period</div>;
  }
  const VW = 700; const VH = 200;
  const PAD = { t: 16, r: 16, b: 36, l: 50 };
  const CW = VW - PAD.l - PAD.r;
  const CH = VH - PAD.t - PAD.b;
  const maxVal = Math.max(...data.map(d => Math.max(d.views, d.visitors)), 1);

  const xOf = (i: number) => PAD.l + (i / (data.length - 1)) * CW;
  const yOf = (v: number) => PAD.t + (1 - v / maxVal) * CH;

  const linePath = (key: 'views' | 'visitors') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(d[key]).toFixed(1)}`).join(' ');

  const areaPath = (key: 'views' | 'visitors') =>
    `${linePath(key)} L${xOf(data.length - 1).toFixed(1)},${(PAD.t + CH).toFixed(1)} L${PAD.l.toFixed(1)},${(PAD.t + CH).toFixed(1)} Z`;

  const step = Math.max(1, Math.floor(data.length / 8));
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" style={{ height: VH }}>
      <defs>
        <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {gridLines.map(frac => {
        const y = PAD.t + frac * CH;
        const val = Math.round((1 - frac) * maxVal);
        return (
          <g key={frac}>
            <line x1={PAD.l} y1={y} x2={VW - PAD.r} y2={y} stroke={isDark ? "#1e2a3a" : "#e5e7eb"} strokeWidth="1" />
            <text x={PAD.l - 8} y={y + 4} textAnchor="end" fontSize="10" fill={isDark ? "#475569" : "#6b7280"}>{val.toLocaleString()}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        if (i % step !== 0 && i !== data.length - 1) return null;
        return (
          <text key={i} x={xOf(i)} y={VH - 8} textAnchor="middle" fontSize="10" fill={isDark ? "#475569" : "#6b7280"}>{d.label}</text>
        );
      })}
      <path d={areaPath('views')} fill="url(#gV)" />
      <path d={areaPath('visitors')} fill="url(#gU)" />
      <path d={linePath('views')} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <path d={linePath('visitors')} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {[data[data.length - 1]].map((pt) => (
        <>
          <circle key="v" cx={xOf(data.length - 1)} cy={yOf(pt.views)} r="4" fill="#3b82f6" />
          <circle key="u" cx={xOf(data.length - 1)} cy={yOf(pt.visitors)} r="4" fill="#10b981" />
        </>
      ))}
    </svg>
  );
}

function BarList({ items, accent = 'emerald', maxItems = 10 }: {
  items: BarItem[]; accent?: 'emerald' | 'blue' | 'violet' | 'amber' | 'cyan'; maxItems?: number;
}) {
  const max = Math.max(...items.map(i => i.value), 1);
  const cfg = {
    emerald: { bar: 'from-emerald-600 to-emerald-400', text: 'text-emerald-400' },
    blue:    { bar: 'from-blue-600 to-blue-400',       text: 'text-blue-400' },
    violet:  { bar: 'from-violet-600 to-violet-400',   text: 'text-violet-400' },
    amber:   { bar: 'from-amber-600 to-amber-400',     text: 'text-amber-400' },
    cyan:    { bar: 'from-cyan-600 to-cyan-400',       text: 'text-cyan-400' },
  }[accent];

  return (
    <div className="space-y-3">
      {items.slice(0, maxItems).map((item, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-[11px] font-mono text-gray-400 dark:text-slate-600 w-5 text-right flex-shrink-0">{i + 1}</span>
              <span className="text-sm text-gray-700 dark:text-slate-300 truncate">{item.label}</span>
            </div>
            <span className={`text-sm font-bold ${cfg.text} flex-shrink-0 tabular-nums`}>
              {item.value.toLocaleString()}
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-slate-800/80 rounded-full overflow-hidden ml-7">
            <div
              className={`h-full bg-gradient-to-r ${cfg.bar} rounded-full transition-all duration-700`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accentClass, trend }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  accentClass: string; trend?: { value: number; positive: boolean };
}) {
  return (
    <div className="bg-white dark:bg-[#0d1117]/80 border border-gray-200 dark:border-[#1e2a3a] rounded-2xl p-4 hover:border-[#2a3a4a] transition-all duration-200 backdrop-blur-sm shadow-sm dark:shadow-none">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${accentClass}`}>
          <Icon size={15} />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend.positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight tabular-nums">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 font-medium">{label}</div>
      {sub && <div className="text-[11px] text-gray-400 dark:text-slate-600 mt-0.5">{sub}</div>}
    </div>
  );
}

function WorldMapEnhanced({ countryData, topCountries }: { countryData: Map<string, number>; topCountries: BarItem[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<MapTooltip | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<{ name: string; code: string; count: number } | null>(null);
  const maxVisits = Math.max(...Array.from(countryData.values()), 1);

  // Premium gradient: dark navy → teal → bright emerald
  const getColor = (iso2: string): string => {
    const n = countryData.get(iso2) || 0;
    if (n === 0) return '#0a1628';
    const r = n / maxVisits;
    if (r >= 0.8) return '#00e676';
    if (r >= 0.6) return '#00c853';
    if (r >= 0.4) return '#00897b';
    if (r >= 0.2) return '#00695c';
    if (r >= 0.05) return '#004d40';
    return '#1b3a4b';
  };

  // Build tier labels with actual visitor thresholds
  const tiers = useMemo(() => {
    if (maxVisits <= 1) return [];
    return [
      { color: '#1b3a4b', label: `1–${Math.round(maxVisits * 0.05)}` },
      { color: '#004d40', label: `${Math.round(maxVisits * 0.05)}–${Math.round(maxVisits * 0.2)}` },
      { color: '#00695c', label: `${Math.round(maxVisits * 0.2)}–${Math.round(maxVisits * 0.4)}` },
      { color: '#00897b', label: `${Math.round(maxVisits * 0.4)}–${Math.round(maxVisits * 0.6)}` },
      { color: '#00c853', label: `${Math.round(maxVisits * 0.6)}–${Math.round(maxVisits * 0.8)}` },
      { color: '#00e676', label: `${Math.round(maxVisits * 0.8)}+` },
    ];
  }, [maxVisits]);

  const topMax = Math.max(...topCountries.map(c => c.value), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Map */}
      <div className="lg:col-span-3">
        <div ref={mapRef} className="relative bg-[#060d18] rounded-xl overflow-hidden select-none max-h-72"
          onMouseLeave={() => setTooltip(null)}>
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 120, center: [10, 20] }}
            style={{ width: '100%', height: 'auto' }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => {
                  const iso2 = geo.properties.ISO_A2 || '';
                  const count = countryData.get(iso2) || 0;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getColor(iso2)}
                      stroke="#0d1f33"
                      strokeWidth={0.4}
                      style={{
                        default: { outline: 'none' },
                        hover:   { outline: 'none', fill: count > 0 ? '#f59e0b' : '#1e2a3a', cursor: 'pointer' },
                        pressed: { outline: 'none' },
                      }}
                      onMouseEnter={(evt: React.MouseEvent) => {
                        if (!mapRef.current) return;
                        const rect = mapRef.current.getBoundingClientRect();
                        setTooltip({
                          name:  geo.properties.NAME || iso2,
                          count: count,
                          x:     evt.clientX - rect.left,
                          y:     evt.clientY - rect.top,
                        });
                      }}
                      onMouseMove={(evt: React.MouseEvent) => {
                        if (!mapRef.current) return;
                        const rect = mapRef.current.getBoundingClientRect();
                        setTooltip(prev => prev ? { ...prev, x: evt.clientX - rect.left, y: evt.clientY - rect.top } : null);
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      onClick={() => {
                        setSelectedCountry({ name: geo.properties.NAME || iso2, code: iso2, count });
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="absolute pointer-events-none z-20 bg-[#0d1117] border border-[#1e2a3a] rounded-xl px-3 py-2 shadow-2xl text-sm"
              style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
            >
              <p className="font-bold text-white">{tooltip.name}</p>
              <p className="text-emerald-400 font-mono text-xs mt-0.5">
                {tooltip.count > 0 ? `${tooltip.count.toLocaleString()} visitor${tooltip.count !== 1 ? 's' : ''}` : 'No visits recorded'}
              </p>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-3 left-3 bg-[#0d1117]/95 backdrop-blur-sm rounded-xl px-3 py-2.5 border border-[#1e2a3a] shadow-xl">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Visitor Density</p>
            <div className="flex items-start gap-1">
              <div className="flex flex-col items-center gap-0.5 mr-1">
                <div className="w-4 h-3 rounded-sm bg-[#0a1628] border border-[#1e2a3a]" />
                <span className="text-[8px] text-slate-600">None</span>
              </div>
              {tiers.map(({ color }, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <div className="w-5 h-3 rounded-sm" style={{ backgroundColor: color }} />
                  <span className="text-[8px] text-slate-500 leading-none whitespace-nowrap">{i === 0 ? 'Low' : i === tiers.length - 1 ? 'High' : ''}</span>
                </div>
              ))}
            </div>
            {tiers.length > 0 && (
              <p className="text-[9px] text-slate-600 mt-1.5">
                Peak: <span className="text-emerald-400 font-mono">{maxVisits.toLocaleString()}</span> visits
              </p>
            )}
          </div>

          {/* Country count badge */}
          <div className="absolute bottom-3 right-3 bg-[#0d1117]/95 border border-[#1e2a3a] rounded-xl px-2.5 py-1.5">
            <span className="text-xs text-slate-400 font-medium">{countryData.size} <span className="text-slate-600">countries</span></span>
          </div>
        </div>
      </div>

      {/* Country detail panel */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        {selectedCountry ? (
          <div className="bg-[#060d18] dark:bg-[#060d18] bg-opacity-100 rounded-xl p-4 border border-[#1e2a3a] flex-shrink-0">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Selected Country</p>
                <p className="text-base font-bold text-white leading-tight">{selectedCountry.name}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedCountry.code}</p>
              </div>
              <button onClick={() => setSelectedCountry(null)} className="p-1 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-all">
                <X size={14} />
              </button>
            </div>
            <div className="text-3xl font-black text-emerald-400 tabular-nums mb-1">
              {selectedCountry.count.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mb-3">visitor{selectedCountry.count !== 1 ? 's' : ''}</p>
            <div className="h-2 bg-slate-800/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${(selectedCountry.count / maxVisits) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-600 mt-1.5">
              {Math.round((selectedCountry.count / maxVisits) * 100)}% of peak traffic
            </p>
          </div>
        ) : (
          <div className="bg-[#060d18] rounded-xl p-4 border border-dashed border-[#1e2a3a] flex flex-col items-center justify-center gap-2 min-h-[120px] flex-shrink-0">
            <MapPin size={20} className="text-slate-700" />
            <p className="text-xs text-slate-600 text-center">Click a country on the map<br />to see details</p>
          </div>
        )}

        {/* Top 5 countries mini-list */}
        {topCountries.length > 0 && (
          <div className="flex-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Top Countries</p>
            <div className="space-y-2">
              {topCountries.slice(0, 5).map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-600 w-4 text-right flex-shrink-0">{i + 1}</span>
                  <span className="text-xs text-slate-300 truncate flex-1">{c.label}</span>
                  <span className="text-xs font-bold text-emerald-400 tabular-nums flex-shrink-0">{c.value.toLocaleString()}</span>
                  <div className="w-12 h-1 bg-slate-800/80 rounded-full overflow-hidden flex-shrink-0">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(c.value / topMax) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DonutChart({ returning, newVisitors }: { returning: number; newVisitors: number }) {
  const total = returning + newVisitors || 1;
  const newPct = (newVisitors / total) * 100;
  const retPct = (returning / total) * 100;

  // SVG donut: cx=60, cy=60, r=48, strokeWidth=12
  const R = 48; const CX = 60; const CY = 60;
  const CIRC = 2 * Math.PI * R;
  const newDash = (newPct / 100) * CIRC;
  const retDash = (retPct / 100) * CIRC;

  return (
    <div className="flex items-center gap-6">
      <div className="relative flex-shrink-0">
        <svg viewBox="0 0 120 120" className="w-28 h-28">
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1e2a3a" strokeWidth={12} />
          {/* Returning — emerald */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#10b981" strokeWidth={12}
            strokeDasharray={`${retDash} ${CIRC - retDash}`}
            strokeDashoffset={CIRC / 4}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
          {/* New — blue */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#3b82f6" strokeWidth={12}
            strokeDasharray={`${newDash} ${CIRC - newDash}`}
            strokeDashoffset={CIRC / 4 - retDash}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
          <text x={CX} y={CY - 5} textAnchor="middle" fontSize="18" fontWeight="800" fill="white">{Math.round(retPct)}%</text>
          <text x={CX} y={CY + 12} textAnchor="middle" fontSize="9" fill="#64748b">Returning</text>
        </svg>
      </div>
      <div className="space-y-3 flex-1">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-slate-300 font-medium">Returning</span>
            </div>
            <span className="text-sm font-bold text-emerald-400 tabular-nums">{returning.toLocaleString()}</span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-slate-800/80 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full" style={{ width: `${retPct}%`, transition: 'width 0.8s ease' }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-slate-300 font-medium">New Visitors</span>
            </div>
            <span className="text-sm font-bold text-blue-400 tabular-nums">{newVisitors.toLocaleString()}</span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-slate-800/80 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" style={{ width: `${newPct}%`, transition: 'width 0.8s ease' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function HourlyHeatmap({ grid, isDark }: { grid: number[][]; isDark: boolean }) {
  const dayLabels = useMemo(() => {
    const labels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    }
    return labels;
  }, []);

  const maxVal = Math.max(...grid.flat(), 1);

  const getCellColor = (val: number): string => {
    if (val === 0) return isDark ? '#0d1520' : '#f3f4f6';
    const r = val / maxVal;
    if (r >= 0.8) return '#f59e0b';
    if (r >= 0.55) return '#d97706';
    if (r >= 0.35) return '#92400e';
    if (r >= 0.15) return '#451a03';
    return '#292524';
  };

  return (
    <div>
      <div className="flex gap-1 mb-1">
        <div className="w-8 flex-shrink-0" />
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} className="flex-1 text-center" style={{ minWidth: 0 }}>
            {h % 6 === 0 && (
              <span className="text-[9px] text-gray-400 dark:text-slate-600 font-mono">
                {h === 0 ? '12a' : h === 12 ? '12p' : h < 12 ? `${h}a` : `${h - 12}p`}
              </span>
            )}
          </div>
        ))}
      </div>
      {grid.map((row, dayIdx) => (
        <div key={dayIdx} className="flex items-center gap-1 mb-1">
          <div className="w-8 flex-shrink-0 text-[10px] text-gray-400 dark:text-slate-600 text-right pr-1.5 font-medium">
            {dayLabels[dayIdx]}
          </div>
          {row.map((val, hourIdx) => (
            <div
              key={hourIdx}
              className="flex-1 rounded-sm transition-all duration-200 hover:ring-1 hover:ring-amber-400/60 cursor-default"
              style={{ height: 16, minWidth: 0, backgroundColor: getCellColor(val) }}
              title={`${dayLabels[dayIdx]} ${hourIdx}:00 — ${val} view${val !== 1 ? 's' : ''}`}
            />
          ))}
        </div>
      ))}
      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-[10px] text-slate-600">Less</span>
        {['#0d1520', '#292524', '#451a03', '#92400e', '#d97706', '#f59e0b'].map((color, i) => (
          <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
        ))}
        <span className="text-[10px] text-slate-600">More</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [range,      setRange]      = useState<Range>('week');
  const [adRange,    setAdRange]    = useState<Range>('week');
  const [rows,       setRows]       = useState<ViewRow[]>([]);
  const [onlineRows, setOnlineRows] = useState<OnlineRow[]>([]);
  const [adRows,     setAdRows]     = useState<AdEventRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt,  setUpdatedAt]  = useState(new Date());
  const [showClear,  setShowClear]  = useState(false);
  const [clearInput, setClearInput] = useState('');
  const [clearing,   setClearing]   = useState(false);
  const [toast,      setToast]      = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ── Data fetching ────────────────────────────────────────────────────────

  const fetchData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const rangeStart   = getRangeStart(range);
      const adRangeStart = getRangeStart(adRange);
      const twoMinAgo    = new Date(Date.now() - 2 * 60 * 1000);

      const [pvRows, onRes, adRes] = await Promise.all([
        fetchAllPageViews(
          'created_at,session_id,visitor_id,is_unique,country_code,country_name,city,device_type,browser,os,page_path,referrer',
          rangeStart,
        ),
        supabase
          .from('online_visitors')
          .select('visitor_id,page_path,country_name,city,device_type,last_seen')
          .gte('last_seen', twoMinAgo.toISOString())
          .order('last_seen', { ascending: false })
          .limit(50),
        supabase
          .from('ad_events')
          .select('slot,event_type,revenue,platform,created_at')
          .gte('created_at', adRangeStart.toISOString()),
      ]);

      setRows(pvRows);
      setOnlineRows((onRes.data as OnlineRow[]) || []);
      setAdRows((adRes.data as AdEventRow[]) || []);
      setUpdatedAt(new Date());
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range, adRange]);

  useEffect(() => { setLoading(true); fetchData(); }, [fetchData]);
  useEffect(() => {
    const t = setInterval(() => fetchData(), 30_000);
    return () => clearInterval(t);
  }, [fetchData]);

  // ── Clear all data ────────────────────────────────────────────────────────

  const handleClearData = async () => {
    if (clearInput.trim().toUpperCase() !== 'RESET') return;
    setClearing(true);
    try {
      const cutoff = new Date(Date.now() + 5000).toISOString();
      const results = await Promise.all([
        supabase.from('page_views').delete().lt('created_at', cutoff),
        supabase.from('online_visitors').delete().lt('last_seen', cutoff),
        supabase.from('ad_events').delete().lt('created_at', cutoff),
      ]);
      const err = results.find(r => r.error)?.error;
      if (err) throw err;
      setRows([]); setOnlineRows([]); setAdRows([]);
      setShowClear(false); setClearInput('');
      setToast({ message: `Analytics reset — all records cleared. Starting fresh from zero.`, type: 'success' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('42501') || msg.toLowerCase().includes('permission')) {
        setToast({
          message: 'Permission denied. Run the Supabase migration: 20260407000001_add_delete_policy_page_views.sql',
          type: 'error',
        });
      } else {
        setToast({ message: `Reset failed: ${msg}`, type: 'error' });
      }
      setShowClear(false); setClearInput('');
    } finally {
      setClearing(false);
    }
  };

  // ── Derived metrics ───────────────────────────────────────────────────────

  const metrics = useMemo(() => {
    const totalViews     = rows.length;
    const uniqueVisitors = new Set(rows.map(r => r.visitor_id)).size;
    // Count distinct visitor_ids that have at least one is_unique=true row in
    // the range. Using a Set prevents multi-day visitors from being counted
    // multiple times (one is_unique row per day), which previously made
    // returningVisitors go negative.
    const newVisitorIds  = new Set(rows.filter(r => r.is_unique).map(r => r.visitor_id));
    const newVisitors    = newVisitorIds.size;
    const returningVisitors = Math.max(0, uniqueVisitors - newVisitors);

    const sessionPageCounts: Record<string, number> = {};
    const sessionTimes: Record<string, { first: number; last: number }> = {};
    rows.forEach(r => {
      const sid = r.session_id || r.visitor_id;
      sessionPageCounts[sid] = (sessionPageCounts[sid] || 0) + 1;
      const t = new Date(r.created_at).getTime();
      if (!sessionTimes[sid]) sessionTimes[sid] = { first: t, last: t };
      else {
        sessionTimes[sid].first = Math.min(sessionTimes[sid].first, t);
        sessionTimes[sid].last  = Math.max(sessionTimes[sid].last, t);
      }
    });

    const sessions = Object.values(sessionPageCounts);
    const bounceRate = sessions.length > 0
      ? Math.round((sessions.filter(c => c === 1).length / sessions.length) * 100) : 0;
    const durations = Object.values(sessionTimes).map(s => (s.last - s.first) / 1000).filter(d => d > 0);
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const pagesPerSession = sessions.length > 0 ? (sessions.reduce((a, b) => a + b, 0) / sessions.length) : 0;

    return { totalViews, uniqueVisitors, newVisitors, returningVisitors, bounceRate, avgDuration, pagesPerSession };
  }, [rows]);

  const chartData       = useMemo(() => buildChartData(rows, range), [rows, range]);
  const hourlyGrid      = useMemo(() => buildHourlyHeatmap(rows), [rows]);

  const trafficSources  = useMemo(() => {
    const c = { organic: 0, social: 0, direct: 0, referral: 0 };
    rows.forEach(r => c[classifyReferrer(r.referrer)]++);
    return c;
  }, [rows]);

  const topPages        = useMemo((): BarItem[] => {
    const m: Record<string, number> = {};
    rows.forEach(r => { m[r.page_path] = (m[r.page_path] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, value }));
  }, [rows]);

  const topFromSearch   = useMemo((): BarItem[] => {
    const m: Record<string, number> = {};
    rows.filter(r => classifyReferrer(r.referrer) === 'organic')
        .forEach(r => { m[r.page_path] = (m[r.page_path] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, value }));
  }, [rows]);

  const engineBreakdown = useMemo((): BarItem[] => {
    const m: Record<string, number> = {};
    rows.filter(r => r.referrer && classifyReferrer(r.referrer) === 'organic')
        .forEach(r => { const e = getSearchEngine(r.referrer!); m[e] = (m[e] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  }, [rows]);

  const topReferrers    = useMemo((): BarItem[] => {
    const m: Record<string, number> = {};
    rows.filter(r => r.referrer && classifyReferrer(r.referrer) === 'referral')
        .forEach(r => {
          const domain = extractReferrerDomain(r.referrer);
          if (domain) m[domain] = (m[domain] || 0) + 1;
        });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, value }));
  }, [rows]);

  const topCities       = useMemo((): BarItem[] => {
    const m: Record<string, number> = {};
    rows.forEach(r => { if (r.city) m[r.city] = (m[r.city] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, value }));
  }, [rows]);

  const topCountries    = useMemo((): BarItem[] => {
    const m: Record<string, number> = {};
    rows.forEach(r => { if (r.country_name) m[r.country_name] = (m[r.country_name] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, value }));
  }, [rows]);

  const countryMapData  = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach(r => { if (r.country_code) m.set(r.country_code, (m.get(r.country_code) || 0) + 1); });
    return m;
  }, [rows]);

  const deviceData      = useMemo(() => {
    const m: Record<string, number> = {};
    rows.forEach(r => { const d = r.device_type || 'unknown'; m[d] = (m[d] || 0) + 1; });
    return m;
  }, [rows]);

  const browserData     = useMemo((): BarItem[] => {
    const m: Record<string, number> = {};
    rows.forEach(r => { const b = r.browser || 'Unknown'; m[b] = (m[b] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value }));
  }, [rows]);

  const osData          = useMemo((): BarItem[] => {
    const m: Record<string, number> = {};
    rows.forEach(r => { const o = r.os || 'Unknown'; m[o] = (m[o] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  }, [rows]);

  const adSlotStats     = useMemo((): AdSlotStats[] => {
    const sm: Record<string, { platform: string; imp: number; clk: number; rev: number }> = {};
    adRows.forEach(r => {
      if (!sm[r.slot]) sm[r.slot] = { platform: r.platform, imp: 0, clk: 0, rev: 0 };
      const rate = PLATFORM_RATES[r.platform] || PLATFORM_RATES.custom;
      if (r.event_type === 'impression') { sm[r.slot].imp++; sm[r.slot].rev += rate.cpm / 1000; }
      else { sm[r.slot].clk++; sm[r.slot].rev += rate.cpc; }
    });
    return Object.entries(sm).map(([slot, s]) => ({
      slot, platform: s.platform, impressions: s.imp, clicks: s.clk,
      revenue: s.rev, ctr: s.imp > 0 ? (s.clk / s.imp) * 100 : 0,
      ecpm: s.imp > 0 ? (s.rev / s.imp) * 1000 : 0,
    })).sort((a, b) => b.revenue - a.revenue);
  }, [adRows]);

  const adTotals = useMemo(() => {
    const imp = adSlotStats.reduce((s, r) => s + r.impressions, 0);
    const clk = adSlotStats.reduce((s, r) => s + r.clicks, 0);
    return {
      impressions: imp, clicks: clk,
      revenue: adSlotStats.reduce((s, r) => s + r.revenue, 0),
      ctr: imp > 0 ? (clk / imp) * 100 : 0,
    };
  }, [adSlotStats]);

  const totalSourceViews = Object.values(trafficSources).reduce((a, b) => a + b, 0) || 1;
  const srcPct = (k: TrafficSource) => Math.round((trafficSources[k] / totalSourceViews) * 100);

  const RANGE_BTNS: { v: Range; label: string }[] = [
    { v: 'day', label: 'Today' }, { v: 'week', label: '7 Days' },
    { v: 'month', label: '30 Days' }, { v: 'year', label: '12 Mo' },
  ];

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="flex flex-col items-center gap-5">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/15" />
              <div className="absolute inset-0 rounded-full border-4 border-t-emerald-400 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold">Loading Analytics</p>
              <p className="text-slate-500 text-sm mt-1">Fetching visitor intelligence…</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      {/* Background gradient accent */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute top-32 right-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-screen-2xl mx-auto space-y-6 pb-20">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pt-1">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl bg-emerald-500/15">
                <BarChart2 size={18} className="text-emerald-400" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Analytics <span className="text-emerald-400">Intelligence</span>
              </h1>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-500 ml-11">
              Real visitor data · Bots & admin filtered · Updated{' '}
              <span className="text-gray-600 dark:text-slate-400">{updatedAt.toLocaleTimeString()}</span>
              {refreshing && <span className="ml-2 text-emerald-400 animate-pulse">↻ refreshing</span>}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-gray-100 dark:bg-[#0d1117] border border-gray-200 dark:border-[#1e2a3a] rounded-xl p-1">
              {RANGE_BTNS.map(({ v, label }) => (
                <button key={v} onClick={() => setRange(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${range === v ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={() => fetchData(true)} disabled={refreshing} title="Refresh"
              className="p-2.5 bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#1e2a3a] rounded-xl text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:border-[#2a3a4a] transition-all">
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => exportCSV(rows)}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#1e2a3a] rounded-xl text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:border-[#2a3a4a] transition-all text-xs font-semibold">
              <Download size={13} /> Export CSV
            </button>
            <button onClick={() => setShowClear(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-rose-950/30 border border-rose-900/40 rounded-xl text-rose-400 hover:text-rose-300 hover:border-rose-800/60 transition-all text-xs font-semibold">
              <RotateCcw size={13} /> Reset Data
            </button>
          </div>
        </div>

        {/* ── KPI Cards ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <StatCard icon={Eye}       label="Page Views"      value={metrics.totalViews}            accentClass="bg-blue-500/15 text-blue-400" />
          <StatCard icon={Users}     label="Unique Visitors" value={metrics.uniqueVisitors}         accentClass="bg-violet-500/15 text-violet-400" />

          {/* Live Online */}
          <div className="bg-white dark:bg-[#0d1117]/80 border border-emerald-500/20 rounded-2xl p-4 backdrop-blur-sm shadow-sm dark:shadow-lg dark:shadow-emerald-900/10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400"><Wifi size={15} /></div>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-bold tracking-widest">LIVE</span>
              </span>
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{onlineRows.length}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 font-medium">Online Now</div>
          </div>

          <StatCard icon={TrendingUp} label="New Visitors"   value={metrics.newVisitors}            accentClass="bg-amber-500/15 text-amber-400" />
          <StatCard icon={Activity}   label="Bounce Rate"    value={`${metrics.bounceRate}%`}        accentClass="bg-rose-500/15 text-rose-400" sub="Single-page sessions" />
          <StatCard icon={Clock}      label="Avg. Session"   value={formatDuration(metrics.avgDuration)} accentClass="bg-cyan-500/15 text-cyan-400" />
        </div>

        {/* ── Traffic Chart ─────────────────────────────────────────────────── */}
        <SectionCard className="p-6">
          <SectionHeader icon={TrendingUp} title="Traffic Overview" subtitle="Page views & unique visitors over time" accent="blue"
            right={
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 bg-blue-500 rounded-full inline-block" />Views</span>
                <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 bg-emerald-500 rounded-full inline-block" />Visitors</span>
              </div>
            }
          />
          <DualLineChart data={chartData} isDark={isDark} />
        </SectionCard>

        {/* ── World Map ─────────────────────────────────────────────────────── */}
        <SectionCard className="p-6">
          <SectionHeader icon={Globe} title="Visitor World Map" subtitle="Hover or click a country to see visitor details" accent="emerald"
            right={<span className="text-xs text-slate-500">{countryMapData.size} countries tracked</span>}
          />
          <WorldMapEnhanced countryData={countryMapData} topCountries={topCountries} />
        </SectionCard>

        {/* ── Geo Breakdown ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard className="p-6">
            <SectionHeader icon={MapPin} title="Top Countries" accent="emerald"
              right={<span className="text-xs text-slate-500">{topCountries.length} countries</span>}
            />
            {topCountries.length > 0
              ? <BarList items={topCountries} accent="emerald" />
              : <div className="flex items-center justify-center h-40 text-slate-700 text-sm">No location data yet</div>}
          </SectionCard>

          <SectionCard className="p-6">
            <SectionHeader icon={MapPin} title="Top Cities" accent="amber"
              right={<span className="text-xs text-slate-500">{topCities.length} cities</span>}
            />
            {topCities.length > 0
              ? <BarList items={topCities} accent="amber" />
              : <div className="flex items-center justify-center h-40 text-slate-700 text-sm">No city data yet</div>}
          </SectionCard>
        </div>

        {/* ── Content Performance ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard className="p-6">
            <SectionHeader icon={BarChart2} title="Top Pages" subtitle="All traffic sources" accent="blue"
              right={<span className="text-xs text-slate-500 tabular-nums">{rows.length.toLocaleString()} total hits</span>}
            />
            {topPages.length > 0
              ? <BarList items={topPages} accent="blue" />
              : <div className="flex items-center justify-center h-40 text-slate-700 text-sm">No page data yet</div>}
          </SectionCard>

          <SectionCard className="p-6">
            <SectionHeader icon={Search} title="Top Pages from Search Engines" subtitle="Organic search traffic only" accent="violet"
              right={
                <span className="flex items-center gap-1 text-xs text-violet-400 font-semibold tabular-nums">
                  <Zap size={11} />
                  {topFromSearch.reduce((s, i) => s + i.value, 0).toLocaleString()} organic
                </span>
              }
            />
            {topFromSearch.length > 0 ? (
              <BarList items={topFromSearch} accent="violet" />
            ) : (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <Search size={28} className="text-slate-800" />
                <span className="text-sm text-slate-600">No organic search traffic yet</span>
                <span className="text-xs text-slate-700">Visits from Google, Bing etc. will appear here</span>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── Search Engine Breakdown ───────────────────────────────────────── */}
        <SectionCard className="p-6">
          <SectionHeader icon={Search} title="Search Engine Breakdown" subtitle="Which search engines send you the most traffic" accent="violet"
            right={
              <span className="text-xs text-slate-500 tabular-nums">
                {engineBreakdown.reduce((s, i) => s + i.value, 0).toLocaleString()} organic visits
              </span>
            }
          />
          {engineBreakdown.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {engineBreakdown.map((item, i) => {
                const total = engineBreakdown.reduce((s, x) => s + x.value, 0) || 1;
                const pct = Math.round((item.value / total) * 100);
                const engineColors: Record<string, { bg: string; text: string; bar: string }> = {
                  Google:     { bg: 'bg-blue-500/10',   text: 'text-blue-400',   bar: 'from-blue-600 to-blue-400' },
                  Bing:       { bg: 'bg-teal-500/10',   text: 'text-teal-400',   bar: 'from-teal-600 to-teal-400' },
                  Yahoo:      { bg: 'bg-violet-500/10', text: 'text-violet-400', bar: 'from-violet-600 to-violet-400' },
                  DuckDuckGo: { bg: 'bg-orange-500/10', text: 'text-orange-400', bar: 'from-orange-600 to-orange-400' },
                  Yandex:     { bg: 'bg-red-500/10',    text: 'text-red-400',    bar: 'from-red-600 to-red-400' },
                  Baidu:      { bg: 'bg-rose-500/10',   text: 'text-rose-400',   bar: 'from-rose-600 to-rose-400' },
                  Ecosia:     { bg: 'bg-green-500/10',  text: 'text-green-400',  bar: 'from-green-600 to-green-400' },
                  Other:      { bg: 'bg-slate-500/10',  text: 'text-slate-400',  bar: 'from-slate-600 to-slate-400' },
                };
                const c = engineColors[item.label] || engineColors.Other;
                return (
                  <div key={i} className={`rounded-2xl p-4 border border-gray-200 dark:border-[#1e2a3a] ${c.bg} hover:border-[#2a3a4a] transition-colors`}>
                    <div className={`text-lg font-black ${c.text} tabular-nums`}>{item.value.toLocaleString()}</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{item.label}</div>
                    <div className="mt-3 h-1.5 bg-gray-200 dark:bg-slate-800/80 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${c.bar} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className={`text-xs ${c.text} mt-1.5 font-semibold`}>{pct}% of organic</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <Search size={28} className="text-slate-800" />
              <span className="text-sm text-slate-600">No organic traffic recorded yet</span>
            </div>
          )}
        </SectionCard>

        {/* ── Traffic Sources ───────────────────────────────────────────────── */}
        <SectionCard className="p-6">
          <SectionHeader icon={TrendingUp} title="Traffic Sources" subtitle="Where your visitors are coming from" accent="amber"
            right={<span className="text-xs text-slate-500 tabular-nums">{rows.length.toLocaleString()} total visits</span>}
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {([
              { key: 'organic'  as TrafficSource, label: 'Organic Search', icon: Search,       accent: 'emerald', desc: 'Google · Bing · Yahoo' },
              { key: 'direct'   as TrafficSource, label: 'Direct',         icon: ExternalLink, accent: 'blue',    desc: 'URL · Bookmarks' },
              { key: 'social'   as TrafficSource, label: 'Social Media',   icon: Activity,     accent: 'violet',  desc: 'Facebook · Twitter · IG' },
              { key: 'referral' as TrafficSource, label: 'Referral',       icon: Link2,        accent: 'amber',   desc: 'Other websites' },
            ] as const).map(({ key, label, icon: Icon, accent, desc }) => {
              const pct   = srcPct(key);
              const count = trafficSources[key];
              const cfg: Record<string, { bar: string; text: string; bg: string; border: string }> = {
                emerald: { bar: 'from-emerald-600 to-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                blue:    { bar: 'from-blue-600 to-blue-400',       text: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
                violet:  { bar: 'from-violet-600 to-violet-400',   text: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20' },
                amber:   { bar: 'from-amber-600 to-amber-400',     text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
              };
              const c = cfg[accent];
              return (
                <div key={key} className={`rounded-2xl p-4 border ${c.border} ${c.bg} hover:border-opacity-40 transition-colors`}>
                  <div className={`inline-flex p-2 rounded-xl bg-black/20 ${c.text} mb-3`}><Icon size={14} /></div>
                  <div className={`text-3xl font-black ${c.text} tabular-nums`}>{pct}%</div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-slate-200 mt-0.5">{label}</div>
                  <div className="text-xs text-gray-500 dark:text-slate-600 mb-3 mt-0.5">{desc}</div>
                  <div className="h-1.5 bg-gray-200 dark:bg-slate-800/80 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${c.bar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className={`text-xs ${c.text} mt-1.5 font-semibold tabular-nums`}>{count.toLocaleString()} visits</div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* ── Top Referrer Domains ──────────────────────────────────────────── */}
        <SectionCard className="p-6">
          <SectionHeader icon={Link2} title="Top Referrer Domains" subtitle="External websites sending visitors to you" accent="cyan"
            right={
              <span className="text-xs text-slate-500 tabular-nums">
                {topReferrers.reduce((s, i) => s + i.value, 0).toLocaleString()} referral visits
              </span>
            }
          />
          {topReferrers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
              <BarList items={topReferrers.slice(0, 5)} accent="cyan" />
              {topReferrers.length > 5 && <BarList items={topReferrers.slice(5, 10)} accent="cyan" />}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-28 gap-2">
              <Link2 size={26} className="text-slate-800" />
              <span className="text-sm text-slate-600">No referral traffic recorded yet</span>
            </div>
          )}
        </SectionCard>

        {/* ── Hourly Traffic Heatmap ────────────────────────────────────────── */}
        <SectionCard className="p-6">
          <SectionHeader icon={Grid3X3} title="Traffic Activity Heatmap" subtitle="Hourly page views — last 7 days (hover for details)" accent="amber" />
          <HourlyHeatmap grid={hourlyGrid} isDark={isDark} />
        </SectionCard>

        {/* ── Returning vs New + Pages/Session ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard className="p-6">
            <SectionHeader icon={RotateCcw} title="Returning vs New Visitors" subtitle="Visitor loyalty breakdown" accent="emerald" />
            <DonutChart returning={metrics.returningVisitors} newVisitors={metrics.newVisitors} />
          </SectionCard>

          <SectionCard className="p-6">
            <SectionHeader icon={ChevronRight} title="Engagement Summary" subtitle="Session quality metrics" accent="blue" />
            <div className="space-y-5">
              {[
                { label: 'Pages per Session', value: metrics.pagesPerSession.toFixed(1), icon: Eye,      color: 'text-blue-400',    desc: 'Avg pages viewed per visit' },
                { label: 'Avg Session Duration', value: formatDuration(metrics.avgDuration), icon: Clock, color: 'text-cyan-400',    desc: 'Time spent on site' },
                { label: 'Bounce Rate',       value: `${metrics.bounceRate}%`, icon: Activity, color: 'text-rose-400',    desc: 'Single-page sessions' },
                { label: 'New Visitor Rate',  value: `${metrics.uniqueVisitors > 0 ? Math.round((metrics.newVisitors / metrics.uniqueVisitors) * 100) : 0}%`,
                  icon: Users, color: 'text-amber-400', desc: 'First-time visitors' },
              ].map(({ label, value, icon: Icon, color, desc }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-[#1e2a3a] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 ${color}`}><Icon size={13} /></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{label}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-600">{desc}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${color} tabular-nums`}>{value}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* ── Devices + Browsers/OS ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard className="p-6">
            <SectionHeader icon={Monitor} title="Devices" subtitle="Breakdown by device type" accent="cyan" />
            <div className="space-y-4">
              {([
                { key: 'desktop', label: 'Desktop', icon: Monitor,    bar: 'from-blue-600 to-blue-400' },
                { key: 'mobile',  label: 'Mobile',  icon: Smartphone, bar: 'from-emerald-600 to-emerald-400' },
                { key: 'tablet',  label: 'Tablet',  icon: Tablet,     bar: 'from-violet-600 to-violet-400' },
              ] as const).map(({ key, label, icon: Icon, bar }) => {
                const count = deviceData[key] || 0;
                const pct = Math.round((count / (rows.length || 1)) * 100);
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                      <Icon size={14} className="text-gray-500 dark:text-slate-300" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-gray-800 dark:text-slate-200 font-semibold">{label}</span>
                        <span className="text-gray-500 dark:text-slate-400 tabular-nums">{pct}%
                          <span className="text-gray-400 dark:text-slate-600 text-xs ml-1">({count.toLocaleString()})</span>
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-slate-800/80 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${bar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard className="p-6">
            <SectionHeader icon={Globe} title="Browsers & Operating Systems" accent="amber" />
            <div className="grid grid-cols-2 gap-x-8">
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-600 uppercase tracking-widest mb-3">Browsers</p>
                <BarList items={browserData} accent="blue" maxItems={5} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-600 uppercase tracking-widest mb-3">OS</p>
                <BarList items={osData} accent="emerald" maxItems={5} />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ── Live Visitors ──────────────────────────────────────────────────── */}
        <SectionCard>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-[#1e2a3a] flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Live Visitors</h2>
            <span className="text-xs text-gray-500 dark:text-slate-500">Active in last 2 minutes · {onlineRows.length} online</span>
            <span className="ml-auto text-[10px] text-emerald-400 font-mono">● AUTO-REFRESH 30s</span>
          </div>
          {onlineRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-[#1e2a3a]">
                    {['Page', 'Location', 'Device', 'Last Seen'].map((h, i) => (
                      <th key={h} className={`px-6 py-3 text-[10px] text-gray-400 dark:text-slate-600 font-bold uppercase tracking-wider ${i === 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-[#1e2a3a]">
                  {onlineRows.slice(0, 20).map((v, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                          <span className="text-xs font-mono text-gray-700 dark:text-slate-300 truncate max-w-xs">{v.page_path}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-500 dark:text-slate-400">{[v.city, v.country_name].filter(Boolean).join(', ') || '—'}</td>
                      <td className="px-6 py-3 text-xs text-gray-500 dark:text-slate-400 capitalize">{v.device_type || '—'}</td>
                      <td className="px-6 py-3 text-xs text-gray-400 dark:text-slate-500 text-right">{formatRelTime(v.last_seen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 gap-2 text-slate-700">
              <Wifi size={30} className="opacity-40" />
              <span className="text-sm">No active visitors right now</span>
            </div>
          )}
        </SectionCard>

        {/* ── Ad Performance ─────────────────────────────────────────────────── */}
        <SectionCard>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-[#1e2a3a] flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400"><DollarSign size={15} /></div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Ad Performance</h2>
                <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">Revenue by slot and platform</p>
              </div>
            </div>
            <div className="flex bg-gray-100 dark:bg-[#0d1117] border border-gray-200 dark:border-[#1e2a3a] rounded-xl p-1">
              {RANGE_BTNS.map(({ v, label }) => (
                <button key={v} onClick={() => setAdRange(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${adRange === v ? 'bg-amber-600 text-white' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-200 dark:divide-[#1e2a3a]">
            {[
              { icon: Eye,          label: 'Impressions',  value: adTotals.impressions.toLocaleString(), color: 'text-blue-400' },
              { icon: MousePointer, label: 'Clicks',       value: adTotals.clicks.toLocaleString(),      color: 'text-violet-400' },
              { icon: BarChart2,    label: 'Avg. CTR',     value: `${adTotals.ctr.toFixed(2)}%`,         color: 'text-emerald-400' },
              { icon: DollarSign,   label: 'Est. Revenue', value: `$${adTotals.revenue.toFixed(2)}`,     color: 'text-amber-400' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="px-6 py-5">
                <Icon size={14} className={`${color} mb-2`} />
                <div className={`text-xl font-black text-gray-900 dark:text-white tabular-nums`}>{value}</div>
                <div className="text-xs text-gray-400 dark:text-slate-600 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {adSlotStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-gray-200 dark:border-[#1e2a3a]">
                    {['Ad Slot', 'Platform', 'Impressions', 'Clicks', 'CTR', 'eCPM', 'Est. Revenue'].map((h, i) => (
                      <th key={h} className={`px-6 py-3 text-[10px] text-gray-400 dark:text-slate-600 font-bold uppercase tracking-wider ${i >= 2 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-[#1e2a3a]">
                  {adSlotStats.map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3 text-xs font-mono text-gray-700 dark:text-slate-300">{s.slot}</td>
                      <td className="px-6 py-3"><span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full font-medium capitalize">{s.platform}</span></td>
                      <td className="px-6 py-3 text-xs text-slate-400 text-right tabular-nums">{s.impressions.toLocaleString()}</td>
                      <td className="px-6 py-3 text-xs text-slate-400 text-right tabular-nums">{s.clicks.toLocaleString()}</td>
                      <td className="px-6 py-3 text-xs text-emerald-400 text-right tabular-nums font-semibold">{s.ctr.toFixed(2)}%</td>
                      <td className="px-6 py-3 text-xs text-blue-400 text-right tabular-nums font-semibold">${s.ecpm.toFixed(2)}</td>
                      <td className="px-6 py-3 text-xs text-amber-400 text-right tabular-nums font-bold">${s.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-700">
              <DollarSign size={28} className="opacity-40" />
              <span className="text-sm">No ad data for selected period</span>
            </div>
          )}
        </SectionCard>

      </div>

      {/* ── Reset Confirmation Modal ──────────────────────────────────────────── */}
      {showClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400"><AlertTriangle size={18} /></div>
                <div>
                  <h3 className="text-base font-bold text-white">Reset Analytics Data</h3>
                  <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <button onClick={() => { setShowClear(false); setClearInput(''); }}
                className="p-1.5 text-slate-600 hover:text-slate-300 rounded-lg hover:bg-white/5 transition-all">
                <X size={16} />
              </button>
            </div>

            <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-4 mb-5 text-sm text-rose-300">
              <p className="font-semibold mb-1">You are about to permanently delete:</p>
              <ul className="space-y-1 text-xs text-rose-400/80 mt-2">
                <li>· All <strong className="text-rose-300">{rows.length.toLocaleString()}</strong> page view records</li>
                <li>· All online visitor sessions</li>
                <li>· All ad event records</li>
              </ul>
              <p className="text-xs text-rose-500/70 mt-3">Analytics will restart from zero after reset.</p>
            </div>

            <p className="text-xs text-slate-500 mb-2">
              Type <span className="font-mono text-rose-400 bg-rose-950/40 px-1.5 py-0.5 rounded">RESET</span> to confirm:
            </p>
            <input
              type="text" value={clearInput} onChange={e => setClearInput(e.target.value)}
              placeholder="Type RESET to confirm"
              className="w-full bg-[#060d18] border border-[#1e2a3a] rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-700 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20 transition-all mb-4"
              onKeyDown={e => e.key === 'Enter' && handleClearData()}
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowClear(false); setClearInput(''); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#1e2a3a] text-slate-400 hover:text-white hover:border-[#2a3a4a] transition-all text-sm font-semibold">
                Cancel
              </button>
              <button
                onClick={handleClearData}
                disabled={clearInput.trim().toUpperCase() !== 'RESET' || clearing}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-bold flex items-center justify-center gap-2"
              >
                {clearing ? (
                  <><RefreshCw size={13} className="animate-spin" /> Clearing…</>
                ) : (
                  <><Trash2 size={13} /> Reset Analytics</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </AdminLayout>
  );
}
