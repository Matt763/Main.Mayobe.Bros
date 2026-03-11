import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Globe,
  Clock,
  Send,
  BarChart3,
  AlertCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface IndexingEvent {
  id: string;
  post_url: string;
  post_slug: string;
  event_type: string;
  ping_results: PingResult[];
  pinged_at: string;
}

interface PingResult {
  engine: string;
  status: 'success' | 'error';
  statusCode?: number;
  message?: string;
}

interface Stats {
  totalPings: number;
  uniqueUrls: number;
  last24h: number;
  successCount: number;
  errorCount: number;
}

export default function IndexingMonitorPage() {
  const [events, setEvents] = useState<IndexingEvent[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [manualUrl, setManualUrl] = useState('');
  const [manualSlug, setManualSlug] = useState('');
  const [pinging, setPinging] = useState(false);
  const [pingMessage, setPingMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [posts, setPosts] = useState<{ id: string; title: string; slug: string; categorySlug: string }[]>([]);

  useEffect(() => {
    loadData();
    loadPosts();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, statsRes] = await Promise.all([
        fetch('/api/indexing', { credentials: 'include' }),
        fetch('/api/indexing/stats', { credentials: 'include' }),
      ]);

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEvents(data);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error loading indexing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('id, title, slug, categories(slug)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50);

    if (data) {
      setPosts(
        data.map((p: any) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          categorySlug: p.categories?.slug || '',
        }))
      );
    }
  };

  const handleManualPing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl || !manualSlug) return;

    setPinging(true);
    setPingMessage(null);

    try {
      const res = await fetch('/api/indexing/ping', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postUrl: manualUrl, postSlug: manualSlug }),
      });

      const data = await res.json();
      if (res.ok) {
        setPingMessage({ type: 'success', text: 'Search engines notified successfully.' });
        setManualUrl('');
        setManualSlug('');
        setTimeout(loadData, 1500);
      } else {
        setPingMessage({ type: 'error', text: data.error || 'Ping failed.' });
      }
    } catch (err) {
      setPingMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setPinging(false);
    }
  };

  const handleQuickPing = async (post: typeof posts[0]) => {
    const postUrl = `https://mayobebros.com/post/${post.categorySlug}/${post.slug}`;
    setPinging(true);
    setPingMessage(null);

    try {
      const res = await fetch('/api/indexing/ping', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postUrl, postSlug: post.slug }),
      });

      const data = await res.json();
      if (res.ok) {
        setPingMessage({ type: 'success', text: `Ping sent for: ${post.title}` });
        setTimeout(loadData, 1500);
      } else {
        setPingMessage({ type: 'error', text: data.error || 'Ping failed.' });
      }
    } catch {
      setPingMessage({ type: 'error', text: 'Network error.' });
    } finally {
      setPinging(false);
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = Date.now();
    const diff = now - d.getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const eventTypeLabel: Record<string, string> = {
    publish_ping: 'Auto Ping',
    google_indexing_api: 'Google API',
    manual_request: 'Manual',
  };

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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Indexing Monitor</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Track search engine indexing notifications and manually request indexing for any article.
            </p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Total Pings', value: stats.totalPings, icon: Send, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Unique URLs', value: stats.uniqueUrls, icon: Globe, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20' },
              { label: 'Last 24h', value: stats.last24h, icon: Clock, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
              { label: 'Successful', value: stats.successCount, icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
              { label: 'Errors', value: stats.errorCount, icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                  <Icon size={18} className={color} />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Send size={18} className="text-blue-600 dark:text-blue-400" />
              Manual Ping
            </h2>

            {pingMessage && (
              <div className={`flex items-start gap-3 p-3 rounded-lg mb-4 text-sm ${
                pingMessage.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}>
                {pingMessage.type === 'success'
                  ? <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
                  : <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />}
                {pingMessage.text}
              </div>
            )}

            <form onSubmit={handleManualPing} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Full URL</label>
                <input
                  type="url"
                  value={manualUrl}
                  onChange={e => setManualUrl(e.target.value)}
                  placeholder="https://mayobebros.com/post/..."
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Post Slug</label>
                <input
                  type="text"
                  value={manualSlug}
                  onChange={e => setManualSlug(e.target.value)}
                  placeholder="my-article-slug"
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={pinging}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {pinging ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {pinging ? 'Sending...' : 'Notify Search Engines'}
              </button>
            </form>

            <div className="mt-5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">Quick Ping Recent Posts</p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {posts.slice(0, 20).map(post => (
                  <div key={post.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">{post.title}</span>
                    <button
                      onClick={() => handleQuickPing(post)}
                      disabled={pinging}
                      className="flex-shrink-0 p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors disabled:opacity-40"
                      title="Ping search engines"
                    >
                      <Send size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Indexing Events</h2>
            </div>

            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                <Search size={40} className="mb-3 opacity-50" />
                <p className="text-sm">No indexing events yet.</p>
                <p className="text-xs mt-1">Events appear automatically when you publish articles.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[520px] overflow-y-auto">
                {events.map(event => (
                  <div key={event.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            event.event_type === 'publish_ping'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                              : event.event_type === 'google_indexing_api'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}>
                            {eventTypeLabel[event.event_type] || event.event_type}
                          </span>
                          <a
                            href={event.post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 truncate max-w-xs"
                          >
                            {event.post_slug}
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 flex items-center gap-1">
                        <Clock size={11} />
                        {formatTime(event.pinged_at)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(event.ping_results || []).map((result, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                            result.status === 'success'
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {result.status === 'success'
                            ? <CheckCircle2 size={10} />
                            : <XCircle size={10} />}
                          {result.engine}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
