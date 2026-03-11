import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/admin/AdminLayout';
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

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalComments: 0,
    totalViews: 0,
    totalRevenue: 0,
  });
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [
        { data: posts },
        { count: totalComments },
        { count: totalViews },
        { data: adData },
      ] = await Promise.all([
        supabase
          .from('posts')
          .select('id, title, slug, status, views, created_at, published_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('comments')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('page_views')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('ad_events')
          .select('revenue')
          .not('revenue', 'is', null),
      ]);

      const allPosts = posts || [];
      const publishedPosts = allPosts.filter((p) => p.status === 'published').length;
      const draftPosts = allPosts.filter((p) => p.status === 'draft').length;
      const totalRevenue = (adData || []).reduce((sum: number, r: any) => sum + (r.revenue || 0), 0);

      setStats({
        totalPosts: allPosts.length,
        publishedPosts,
        draftPosts,
        totalComments: totalComments ?? 0,
        totalViews: totalViews ?? 0,
        totalRevenue,
      });

      setRecentPosts(
        allPosts.slice(0, 5).map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          status: p.status,
          publishedAt: p.published_at,
          views: p.views || 0,
          createdAt: p.created_at,
        }))
      );

      const { data: recentComments } = await supabase
        .from('comments')
        .select('id, user_name, created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      const activityList: ActivityItem[] = [];
      if (allPosts.length > 0) {
        activityList.push({
          id: '1',
          type: 'post',
          title: `Post: ${allPosts[0].title}`,
          action: 'created',
          timestamp: allPosts[0].created_at,
        });
      }
      if (recentComments && recentComments.length > 0) {
        activityList.push({
          id: '2',
          type: 'comment',
          title: `Comment from ${recentComments[0].user_name}`,
          action: 'added',
          timestamp: recentComments[0].created_at,
        });
      }
      activityList.push({
        id: '3',
        type: 'page',
        title: 'Admin panel updated',
        action: 'updated',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      });
      setActivities(activityList);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  };

  const StatCard = ({ icon: Icon, label, value, sub, color, prefix }: any) => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color.replace('border-', 'bg-').replace('-600', '-100')} dark:${color.replace('border-', 'bg-').replace('-600', '-900/30')}`}>
          <Icon size={24} className={color.replace('border-', 'text-')} />
        </div>
        {sub && (
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-medium">
            <TrendingUp size={16} />
            <span>{sub}</span>
          </div>
        )}
      </div>
      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
        {prefix || ''}{typeof value === 'number' ? value.toLocaleString() : value}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{label}</p>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening with your site.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard icon={FileText} label="Total Posts" value={stats.totalPosts} color="border-blue-600" />
          <StatCard icon={CheckCircle2} label="Published" value={stats.publishedPosts} color="border-green-600" />
          <StatCard icon={Circle} label="Drafts" value={stats.draftPosts} color="border-orange-600" />
          <StatCard icon={Eye} label="Total Views (All Time)" value={stats.totalViews} color="border-sky-600" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard icon={MessageSquare} label="Total Comments" value={stats.totalComments} color="border-pink-600" />
          <StatCard
            icon={DollarSign}
            label="Estimated Ad Revenue"
            value={stats.totalRevenue.toFixed(4)}
            prefix="$"
            color="border-emerald-600"
          />
          <Link
            to="/admin/analytics"
            className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-sm p-6 flex flex-col justify-between hover:from-blue-700 hover:to-blue-800 transition-all cursor-pointer"
          >
            <div className="p-3 bg-white/20 rounded-lg w-fit mb-4">
              <Activity size={24} className="text-white" />
            </div>
            <div>
              <p className="text-white text-2xl font-bold mb-1">Analytics</p>
              <p className="text-blue-100 text-sm">View detailed traffic data</p>
            </div>
          </Link>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link to="/admin/posts/new" className="flex items-center justify-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm text-white font-medium px-4 py-3 rounded-lg transition-all">
              <Plus size={18} /><span>New Post</span>
            </Link>
            <Link to="/admin/pages/new" className="flex items-center justify-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm text-white font-medium px-4 py-3 rounded-lg transition-all">
              <FileEdit size={18} /><span>New Page</span>
            </Link>
            <Link to="/admin/comments" className="flex items-center justify-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm text-white font-medium px-4 py-3 rounded-lg transition-all">
              <MessageSquare size={18} /><span>Comments</span>
            </Link>
            <Link to="/admin/settings" className="flex items-center justify-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm text-white font-medium px-4 py-3 rounded-lg transition-all">
              <Activity size={18} /><span>Settings</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Posts</h2>
              <Link to="/admin/posts" className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">View all</Link>
            </div>
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{post.title}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${post.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                        {post.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1"><Clock size={12} />{formatRelativeTime(post.createdAt)}</span>
                      <span className="flex items-center gap-1"><Eye size={12} />{post.views} views</span>
                    </div>
                  </div>
                  <Link to={`/admin/posts/edit/${post.id}`} className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Edit">
                    <Edit size={16} />
                  </Link>
                </div>
              ))}
              {recentPosts.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No posts yet</p>
                  <Link to="/admin/posts/new" className="inline-block mt-3 text-blue-600 dark:text-blue-400 hover:underline">Create your first post</Link>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activity.type === 'post' ? 'bg-blue-100 dark:bg-blue-900/30' : activity.type === 'comment' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-sky-100 dark:bg-sky-900/30'}`}>
                    {activity.type === 'post' && <FileText size={16} className="text-blue-600 dark:text-blue-400" />}
                    {activity.type === 'comment' && <MessageSquare size={16} className="text-green-600 dark:text-green-400" />}
                    {activity.type === 'page' && <FileEdit size={16} className="text-sky-600 dark:text-sky-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white font-medium">{activity.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatRelativeTime(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
