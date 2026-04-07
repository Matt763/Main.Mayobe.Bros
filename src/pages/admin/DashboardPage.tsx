import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { useRole } from '../../hooks/useRole';
import {
  FileText,
  Eye,
  MessageSquare,
  TrendingUp,
  Clock,
  Edit,
  Plus,
  Activity,
  FileEdit,
  CheckCircle2,
  Circle,
  DollarSign,
  ArrowRight,
  Settings,
  Zap,
} from 'lucide-react';

interface Stats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalComments: number;
  totalViews: number;
  totalRevenue: number;
}

interface RecentPost {
  id: string;
  slug: string;
  title: string;
  status: string;
  publishedAt: string;
  views: number;
  createdAt: string;
}

interface ActivityItem {
  id: string;
  type: 'post' | 'comment' | 'page';
  title: string;
  action: string;
  timestamp: string;
}

/* ---- Per-card accent palettes ---- */
const CARD_PALETTES = {
  blue:    { accent: '#3b82f6', glow: 'rgba(59,130,246,0.18)',  gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)', iconBg: 'rgba(59,130,246,0.12)',  iconBgL: 'rgba(59,130,246,0.09)'  },
  green:   { accent: '#22c55e', glow: 'rgba(34,197,94,0.18)',   gradient: 'linear-gradient(135deg,#22c55e,#16a34a)', iconBg: 'rgba(34,197,94,0.12)',   iconBgL: 'rgba(34,197,94,0.09)'   },
  amber:   { accent: '#f59e0b', glow: 'rgba(245,158,11,0.18)',  gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', iconBg: 'rgba(245,158,11,0.12)',  iconBgL: 'rgba(245,158,11,0.09)'  },
  sky:     { accent: '#0ea5e9', glow: 'rgba(14,165,233,0.18)',  gradient: 'linear-gradient(135deg,#0ea5e9,#0284c7)', iconBg: 'rgba(14,165,233,0.12)',  iconBgL: 'rgba(14,165,233,0.09)'  },
  pink:    { accent: '#ec4899', glow: 'rgba(236,72,153,0.18)',  gradient: 'linear-gradient(135deg,#ec4899,#db2777)', iconBg: 'rgba(236,72,153,0.12)',  iconBgL: 'rgba(236,72,153,0.09)'  },
  emerald: { accent: '#10b981', glow: 'rgba(16,185,129,0.18)',  gradient: 'linear-gradient(135deg,#10b981,#059669)', iconBg: 'rgba(16,185,129,0.12)',  iconBgL: 'rgba(16,185,129,0.09)'  },
};

export default function DashboardPage() {
  const { resolvedTheme } = useTheme();
  const { isCEO, isAdmin } = useRole();
  const dark = resolvedTheme === 'dark';

  const [stats, setStats] = useState<Stats>({
    totalPosts: 0, publishedPosts: 0, draftPosts: 0,
    totalComments: 0, totalViews: 0, totalRevenue: 0,
  });
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [
        { data: posts },
        { count: totalComments },
        { count: totalViews },
        { data: adData },
      ] = await Promise.all([
        supabase.from('posts').select('id, title, slug, status, views, created_at, published_at').order('created_at', { ascending: false }),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('page_views').select('*', { count: 'exact', head: true }),
        supabase.from('ad_events').select('revenue').not('revenue', 'is', null),
      ]);

      const allPosts = posts || [];
      const publishedPosts = allPosts.filter(p => p.status === 'published').length;
      const draftPosts = allPosts.filter(p => p.status === 'draft').length;
      const totalRevenue = (adData || []).reduce((sum: number, r: any) => sum + (r.revenue || 0), 0);

      setStats({ totalPosts: allPosts.length, publishedPosts, draftPosts, totalComments: totalComments ?? 0, totalViews: totalViews ?? 0, totalRevenue });
      setRecentPosts(allPosts.slice(0, 5).map(p => ({ id: p.id, slug: p.slug, title: p.title, status: p.status, publishedAt: p.published_at, views: p.views || 0, createdAt: p.created_at })));

      const { data: recentComments } = await supabase.from('comments').select('id, user_name, created_at').order('created_at', { ascending: false }).limit(1);
      const activityList: ActivityItem[] = [];
      if (allPosts.length > 0) activityList.push({ id: '1', type: 'post', title: `Post: ${allPosts[0].title}`, action: 'created', timestamp: allPosts[0].created_at });
      if (recentComments && recentComments.length > 0) activityList.push({ id: '2', type: 'comment', title: `Comment from ${recentComments[0].user_name}`, action: 'added', timestamp: recentComments[0].created_at });
      activityList.push({ id: '3', type: 'page', title: 'Admin panel updated', action: 'updated', timestamp: new Date(Date.now() - 7200000).toISOString() });
      setActivities(activityList);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return '—';
    const diff = Date.now() - new Date(dateString).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    if (d < 7) return `${d}d ago`;
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(dateString));
  };

  /* ---- Glass helpers ---- */
  const glassCard = {
    background: dark ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.70)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(255,255,255,0.62)',
    boxShadow: dark
      ? '0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.04)'
      : '0 4px 24px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.85)',
  } as React.CSSProperties;

  const textPrimary = dark ? '#f1f5f9' : '#0f172a';
  const textSecondary = dark ? '#64748b' : '#64748b';
  const textMuted = dark ? '#334155' : '#94a3b8';
  const divider = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';

  /* ---- Role accent ---- */
  const roleAccent = isCEO ? '#d4af37' : isAdmin ? '#3b82f6' : '#94a3b8';
  const roleGradient = isCEO
    ? 'linear-gradient(135deg,#d4af37,#f5e070,#c9a000)'
    : isAdmin
    ? 'linear-gradient(135deg,#3b82f6,#60a5fa)'
    : 'linear-gradient(135deg,#94a3b8,#cbd5e1)';
  const roleLabel = isCEO ? 'CEO Dashboard' : isAdmin ? 'Admin Dashboard' : 'Dashboard';

  /* ---- StatCard ---- */
  const StatCard = ({
    icon: Icon, label, value, sub, palette, prefix,
  }: { icon: any; label: string; value: number | string; sub?: string; palette: keyof typeof CARD_PALETTES; prefix?: string }) => {
    const p = CARD_PALETTES[palette];
    return (
      <div
        className="admin-stat-card relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:scale-[1.025] hover:-translate-y-0.5 cursor-default group"
        style={glassCard}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: p.gradient }} />

        {/* Subtle glow blob behind */}
        <div
          className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
          style={{ background: p.glow }}
        />

        <div className="flex items-start justify-between mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: dark ? p.iconBg : p.iconBgL,
              border: `1px solid ${p.accent}28`,
            }}
          >
            <Icon size={18} style={{ color: p.accent }} strokeWidth={2} />
          </div>
          {sub && (
            <div
              className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.20)' }}
            >
              <TrendingUp size={10} />
              {sub}
            </div>
          )}
        </div>

        <p className="text-[22px] font-bold leading-tight mb-0.5 tabular-nums" style={{ color: textPrimary }}>
          {prefix || ''}{typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p className="text-xs font-medium" style={{ color: textSecondary }}>{label}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div
            className="w-12 h-12 rounded-full border-2 animate-spin"
            style={{ borderColor: `${roleAccent}30`, borderTopColor: roleAccent }}
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Welcome Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1.5 h-5 rounded-full" style={{ background: roleGradient }} />
              <span
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: roleAccent }}
              >
                {roleLabel}
              </span>
            </div>
            <h1
              className="text-2xl font-bold leading-tight"
              style={{ color: textPrimary }}
            >
              Welcome back
            </h1>
            <p className="text-sm mt-0.5" style={{ color: textSecondary }}>
              Here's what's happening with your site today.
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: '#22c55e' }}
            />
            <span className="text-xs font-medium" style={{ color: '#22c55e' }}>Live</span>
          </div>
        </div>

        {/* ── Primary Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={FileText}     label="Total Posts"   value={stats.totalPosts}     palette="blue"   />
          <StatCard icon={CheckCircle2} label="Published"     value={stats.publishedPosts} palette="green"  />
          <StatCard icon={Circle}       label="Drafts"        value={stats.draftPosts}     palette="amber"  />
          <StatCard icon={Eye}          label="Total Views"   value={stats.totalViews}     palette="sky"    />
        </div>

        {/* ── Secondary Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard icon={MessageSquare} label="Total Comments"      value={stats.totalComments}            palette="pink"    />
          <StatCard icon={DollarSign}    label="Estimated Ad Revenue" value={stats.totalRevenue.toFixed(4)} palette="emerald" prefix="$" />

          {/* Analytics CTA card */}
          <Link
            to="/admin/analytics"
            className="relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:scale-[1.025] hover:-translate-y-0.5 cursor-pointer group"
            style={{
              background: roleGradient,
              boxShadow: dark
                ? `0 8px 32px ${roleAccent}30`
                : `0 4px 24px ${roleAccent}25`,
            }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'rgba(255,255,255,0.18)' }}
            >
              <Activity size={18} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-white text-[17px] font-bold leading-tight mb-0.5">Analytics</p>
              <p className="text-white/70 text-xs">View detailed traffic data</p>
            </div>
            <ArrowRight size={14} className="absolute bottom-4 right-4 text-white/50 group-hover:text-white/80 transition-colors" />
          </Link>
        </div>

        {/* ── Quick Actions ── */}
        <div className="rounded-2xl overflow-hidden" style={glassCard}>
          <div className="px-5 pt-4 pb-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${divider}` }}>
            <Zap size={14} style={{ color: roleAccent }} strokeWidth={2.5} />
            <h2 className="text-sm font-bold" style={{ color: textPrimary }}>Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4">
            {[
              { to: '/admin/posts/new',  icon: Plus,        label: 'New Post',  accent: CARD_PALETTES.blue.accent },
              { to: '/admin/pages/new',  icon: FileEdit,    label: 'New Page',  accent: CARD_PALETTES.sky.accent },
              { to: '/admin/comments',   icon: MessageSquare, label: 'Comments', accent: CARD_PALETTES.pink.accent },
              { to: '/admin/settings',   icon: Settings,    label: 'Settings',  accent: CARD_PALETTES.amber.accent },
            ].map(({ to, icon: Icon, label, accent }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2.5 px-3 py-3 rounded-xl transition-all duration-200 hover:scale-[1.03] cursor-pointer group"
                style={{
                  background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.65)',
                  border: dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(255,255,255,0.55)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = dark ? `${accent}14` : `${accent}0f`;
                  el.style.border = `1px solid ${accent}28`;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.65)';
                  el.style.border = dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(255,255,255,0.55)';
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${accent}18`, border: `1px solid ${accent}25` }}
                >
                  <Icon size={14} style={{ color: accent }} strokeWidth={2} />
                </div>
                <span className="text-[13px] font-semibold" style={{ color: textPrimary }}>{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Recent Posts + Activity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Recent Posts */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden" style={glassCard}>
            <div
              className="px-5 pt-4 pb-3 flex items-center justify-between"
              style={{ borderBottom: `1px solid ${divider}` }}
            >
              <div className="flex items-center gap-2">
                <FileText size={14} style={{ color: roleAccent }} strokeWidth={2.5} />
                <h2 className="text-sm font-bold" style={{ color: textPrimary }}>Recent Posts</h2>
              </div>
              <Link
                to="/admin/posts"
                className="flex items-center gap-1 text-[12px] font-semibold transition-colors cursor-pointer"
                style={{ color: roleAccent }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.7'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
              >
                View all <ArrowRight size={11} />
              </Link>
            </div>

            <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as any}>
              {recentPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12" style={{ color: textMuted }}>
                  <FileText size={36} className="mb-3 opacity-30" />
                  <p className="text-sm font-medium">No posts yet</p>
                  <Link
                    to="/admin/posts/new"
                    className="mt-3 text-[13px] font-semibold cursor-pointer"
                    style={{ color: roleAccent }}
                  >
                    Create your first post
                  </Link>
                </div>
              ) : (
                recentPosts.map((post, idx) => (
                  <div
                    key={post.id}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 group cursor-default"
                    style={idx === recentPosts.length - 1 ? {} : { borderBottom: `1px solid ${divider}` }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = dark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.015)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    {/* Status dot */}
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: post.status === 'published' ? '#22c55e' : '#f59e0b' }}
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate" style={{ color: textPrimary }}>{post.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                          style={{
                            background: post.status === 'published' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                            color: post.status === 'published' ? '#22c55e' : '#f59e0b',
                          }}
                        >
                          {post.status}
                        </span>
                        <span className="flex items-center gap-1 text-[11px]" style={{ color: textSecondary }}>
                          <Clock size={10} /> {formatRelativeTime(post.createdAt)}
                        </span>
                        <span className="flex items-center gap-1 text-[11px]" style={{ color: textSecondary }}>
                          <Eye size={10} /> {post.views.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/admin/posts/edit/${post.id}`}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                      style={{
                        background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                        color: textSecondary,
                      }}
                      title="Edit"
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = `${roleAccent}18`;
                        el.style.color = roleAccent;
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
                        el.style.color = textSecondary;
                      }}
                    >
                      <Edit size={13} />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl overflow-hidden" style={glassCard}>
            <div
              className="px-5 pt-4 pb-3 flex items-center gap-2"
              style={{ borderBottom: `1px solid ${divider}` }}
            >
              <Activity size={14} style={{ color: roleAccent }} strokeWidth={2.5} />
              <h2 className="text-sm font-bold" style={{ color: textPrimary }}>Recent Activity</h2>
            </div>

            <div className="p-4 space-y-3">
              {activities.map((activity, idx) => {
                const actPalette = activity.type === 'post' ? CARD_PALETTES.blue : activity.type === 'comment' ? CARD_PALETTES.green : CARD_PALETTES.sky;
                const ActIcon = activity.type === 'post' ? FileText : activity.type === 'comment' ? MessageSquare : FileEdit;
                return (
                  <div key={activity.id} className="flex gap-3 items-start group">
                    {/* Timeline line */}
                    <div className="relative flex flex-col items-center flex-shrink-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center z-10"
                        style={{ background: dark ? actPalette.iconBg : actPalette.iconBgL, border: `1px solid ${actPalette.accent}25` }}
                      >
                        <ActIcon size={13} style={{ color: actPalette.accent }} strokeWidth={2} />
                      </div>
                      {idx < activities.length - 1 && (
                        <div className="w-px h-full absolute top-7 left-1/2 -translate-x-1/2" style={{ background: divider }} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 pb-1">
                      <p className="text-[13px] font-medium leading-snug" style={{ color: textPrimary }}>{activity.title}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: textSecondary }}>{formatRelativeTime(activity.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
