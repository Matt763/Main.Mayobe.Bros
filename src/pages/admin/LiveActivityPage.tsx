import { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Activity, RefreshCw, Search, Filter, FileText, File as FileEdit, MessageSquare, Star, Mail, Users, User, Settings, Trash2, CheckCircle, XCircle, PlusCircle, CreditCard as Edit3, Send, Crown, AlertCircle, ChevronDown, X } from 'lucide-react';

interface ActivityLog {
  id: string;
  user_id: string | null;
  user_name: string;
  user_role: string;
  activity_type: string;
  action: string;
  content_title: string | null;
  content_id: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const ACTIVITY_TYPES = [
  { value: 'all', label: 'All Activities' },
  { value: 'post', label: 'Posts' },
  { value: 'page', label: 'Pages' },
  { value: 'comment', label: 'Comments' },
  { value: 'review', label: 'Reviews' },
  { value: 'subscriber', label: 'Subscribers' },
  { value: 'publisher', label: 'Publishers' },
  { value: 'user', label: 'User Accounts' },
  { value: 'system', label: 'System' },
];

const PAGE_SIZE = 30;

function getActivityIcon(type: string, action: string) {
  if (action === 'deleted') return Trash2;
  if (action === 'approved') return CheckCircle;
  if (action === 'rejected') return XCircle;
  if (action === 'published') return Send;
  if (action === 'subscribed') return Mail;
  if (action === 'unsubscribed') return Mail;
  if (action === 'submitted') return PlusCircle;
  if (action === 'updated' || action === 'profile_updated') return Edit3;
  if (action === 'email_changed') return User;
  if (action === 'password_changed') return Settings;
  if (action === 'registered') return Users;
  if (type === 'post') return FileText;
  if (type === 'page') return FileEdit;
  if (type === 'comment') return MessageSquare;
  if (type === 'review') return Star;
  if (type === 'subscriber') return Mail;
  if (type === 'publisher') return Users;
  if (type === 'user') return User;
  return Activity;
}

function getActivityColor(type: string, action: string): { bg: string; text: string; border: string } {
  if (action === 'deleted') return { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800' };
  if (action === 'approved') return { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' };
  if (action === 'rejected') return { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' };
  if (action === 'published') return { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' };
  if (action === 'subscribed') return { bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800' };
  if (type === 'post') return { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' };
  if (type === 'page') return { bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800' };
  if (type === 'comment') return { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' };
  if (type === 'review') return { bg: 'bg-pink-50 dark:bg-pink-950/30', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800' };
  if (type === 'subscriber') return { bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800' };
  if (type === 'publisher') return { bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800' };
  if (type === 'user') return { bg: 'bg-gray-50 dark:bg-gray-800/50', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700' };
  return { bg: 'bg-gray-50 dark:bg-gray-800/50', text: 'text-gray-500 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700' };
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function roleBadge(role: string) {
  if (role === 'ceo') return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"><Crown size={9} />CEO</span>;
  if (role === 'admin') return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">Admin</span>;
  if (role === 'publisher') return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Publisher</span>;
  if (role === 'user') return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">User</span>;
  return null;
}

export default function LiveActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingNew, setPendingNew] = useState<ActivityLog[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const liveRef = useRef(liveEnabled);
  liveRef.current = liveEnabled;

  const buildQuery = useCallback((from: number, currentFilter: string, currentSearch: string) => {
    let q = supabase
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (currentFilter !== 'all') q = q.eq('activity_type', currentFilter);
    if (currentSearch.trim()) {
      const s = currentSearch.trim();
      q = q.or(`description.ilike.%${s}%,user_name.ilike.%${s}%,content_title.ilike.%${s}%,action.ilike.%${s}%`);
    }
    return q;
  }, []);

  const loadLogs = useCallback(async (reset = true, currentFilter = filter, currentSearch = search) => {
    if (reset) setLoading(true);
    const from = reset ? 0 : offset;
    const { data, error, count } = await buildQuery(from, currentFilter, currentSearch);
    if (!error && data) {
      if (reset) {
        setLogs(data as ActivityLog[]);
        setOffset(PAGE_SIZE);
      } else {
        setLogs(prev => [...prev, ...(data as ActivityLog[])]);
        setOffset(prev => prev + PAGE_SIZE);
      }
      setTotalCount(count ?? 0);
      setHasMore((count ?? 0) > (reset ? PAGE_SIZE : offset + PAGE_SIZE));
      setNewCount(0);
      setPendingNew([]);
    }
    if (reset) setLoading(false);
  }, [buildQuery, filter, search, offset]);

  useEffect(() => {
    loadLogs(true, filter, search);
  }, [filter, search]);

  useEffect(() => {
    channelRef.current = supabase
      .channel('activity_logs_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        (payload) => {
          const newLog = payload.new as ActivityLog;
          if (liveRef.current) {
            setLogs(prev => [newLog, ...prev]);
            setTotalCount(prev => prev + 1);
          } else {
            setPendingNew(prev => [newLog, ...prev]);
            setNewCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    const pollInterval = setInterval(() => {
      if (liveRef.current) {
        loadLogs(true, filter, search);
      }
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [filter, search]);

  const handleShowNew = () => {
    setLogs(prev => [...pendingNew, ...prev]);
    setTotalCount(prev => prev + pendingNew.length);
    setPendingNew([]);
    setNewCount(0);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
    setOffset(0);
    setFilterOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setOffset(0);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
    setOffset(0);
  };

  const stats = {
    posts: logs.filter(l => l.activity_type === 'post').length,
    comments: logs.filter(l => l.activity_type === 'comment').length,
    reviews: logs.filter(l => l.activity_type === 'review').length,
    subscribers: logs.filter(l => l.activity_type === 'subscriber').length,
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Activity size={18} className="text-amber-500" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                Live Platform Activity
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                liveEnabled
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${liveEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                {liveEnabled ? 'Live' : 'Paused'}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 ml-12">
              Real-time monitoring of all platform events &mdash; CEO access only
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setLiveEnabled(v => !v)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                liveEnabled
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${liveEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
              {liveEnabled ? 'Pause Live' : 'Resume Live'}
            </button>
            <button
              onClick={() => loadLogs(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Posts', value: totalCount > 0 ? stats.posts : 0, icon: FileText, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
            { label: 'Comments', value: stats.comments, icon: MessageSquare, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
            { label: 'Reviews', value: stats.reviews, icon: Star, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-950/30' },
            { label: 'Subscribers', value: stats.subscribers, icon: Mail, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/30' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                <s.icon size={16} className={s.color} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search by user, action, or content..."
                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
              />
              {searchInput && (
                <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X size={14} />
                </button>
              )}
            </div>
            <button type="submit" className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors flex-shrink-0">
              Search
            </button>
          </form>

          <div className="relative flex-shrink-0">
            <button
              onClick={() => setFilterOpen(v => !v)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              <Filter size={14} />
              {ACTIVITY_TYPES.find(t => t.value === filter)?.label || 'All Activities'}
              <ChevronDown size={13} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-30 overflow-hidden">
                {ACTIVITY_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => handleFilterChange(t.value)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      filter === t.value
                        ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* New items banner */}
        {newCount > 0 && (
          <button
            onClick={handleShowNew}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all shadow-lg shadow-amber-500/20 animate-pulse"
          >
            <AlertCircle size={15} />
            {newCount} new {newCount === 1 ? 'activity' : 'activities'} &mdash; click to load
          </button>
        )}

        {/* Activity feed */}
        <div className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Activity Log</h2>
              {!loading && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {search || filter !== 'all' ? `${logs.length} of ${totalCount} matching` : `${totalCount} total`}
                </span>
              )}
            </div>
            {(search || filter !== 'all') && (
              <button
                onClick={() => { setSearch(''); setSearchInput(''); setFilter('all'); }}
                className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <X size={11} /> Clear filters
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
              <p className="text-sm text-gray-400 dark:text-gray-500">Loading activity...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Activity size={24} className="text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No activities found</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {search || filter !== 'all' ? 'Try adjusting your search or filter.' : 'Platform events will appear here in real time.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {logs.map((log, idx) => {
                const Icon = getActivityIcon(log.activity_type, log.action);
                const colors = getActivityColor(log.activity_type, log.action);
                const isNew = idx === 0 && newCount === 0;
                return (
                  <div
                    key={log.id}
                    className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-700/30 ${
                      isNew && logs.length > 1 ? '' : ''
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border ${colors.bg} ${colors.border}`}>
                      <Icon size={15} className={colors.text} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2 mb-0.5">
                        <span className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                          {log.description}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {roleBadge(log.user_role)}
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
                          {log.activity_type} &bull; {log.action}
                        </span>
                        {log.content_title && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]" title={log.content_title}>
                            &ldquo;{log.content_title}&rdquo;
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap" title={formatFullDate(log.created_at)}>
                        {formatTimeAgo(log.created_at)}
                      </p>
                      <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5 hidden sm:block">
                        {formatFullDate(log.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {hasMore && !loading && (
            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-center">
              <button
                onClick={() => loadLogs(false)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Load older activities
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
