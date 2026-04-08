import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useRole } from '../../hooks/useRole';
import AdminLayout from '../../components/admin/AdminLayout';
import Toast from '../../components/admin/Toast';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Calendar,
  CheckCircle2,
  Circle,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Shield,
} from 'lucide-react';

interface Post {
  id: string;
  title: string;
  slug: string;
  status: string;
  approval_status?: string;
  author_role?: string;
  author_name?: string;
  isFeatured: boolean;
  views: number;
  publishedAt: string;
  createdAt: string;
  categoryId: string;
  categoryName?: string;
}

type FilterType = 'all' | 'published' | 'draft' | 'featured' | 'pending_approval';

export default function PostsListPage() {
  const { user } = useAuth();
  const { isCEO, isAdmin, isStaff } = useRole();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const postsPerPage = 10;

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, searchQuery, activeFilter]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const [postsData, categoriesData] = await Promise.all([
        api.posts.list({ status: 'all' }),
        api.categories.list(),
      ]);
      const catMap: Record<string, string> = {};
      categoriesData.forEach((c: any) => { catMap[c.id] = c.name; });
      const enriched = postsData.map((p: any) => ({
        ...p,
        categoryName: catMap[p.categoryId] || 'Uncategorized',
      }));
      setPosts(enriched);
    } catch (error) {
      console.error('Error loading posts:', error);
      setToast({ message: 'Failed to load posts', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filterPosts = () => {
    let filtered = posts;

    if (isStaff) {
      filtered = filtered.filter(p => p.author_name === (user?.displayName || user?.email?.split('@')[0]) || !p.author_role || p.author_role === 'publisher' || p.author_role === 'staff');
    }

    if (activeFilter === 'published') {
      filtered = filtered.filter(p => p.status === 'published');
    } else if (activeFilter === 'draft') {
      filtered = filtered.filter(p => p.status === 'draft' && p.approval_status !== 'pending');
    } else if (activeFilter === 'featured') {
      filtered = filtered.filter(p => p.isFeatured);
    } else if (activeFilter === 'pending_approval') {
      filtered = filtered.filter(p => p.approval_status === 'pending');
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPosts(filtered);
    setCurrentPage(1);
  };

  const handleApprovePost = async (post: Post) => {
    await supabase
      .from('posts')
      .update({
        approval_status: 'approved',
        status: 'published',
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
      })
      .eq('id', post.id);
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, approval_status: 'approved', status: 'published' } : p));
    setToast({ message: `"${post.title}" approved and published`, type: 'success' });
  };

  const handleRejectPost = async (post: Post) => {
    await supabase
      .from('posts')
      .update({ approval_status: 'rejected', status: 'draft' })
      .eq('id', post.id);
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, approval_status: 'rejected', status: 'draft' } : p));
    setToast({ message: `"${post.title}" rejected`, type: 'success' });
  };

  const handleDelete = async (post: Post) => {
    setDeleteConfirmId(null);
    try {
      await api.posts.delete(post.slug);
      setPosts(posts.filter(p => p.id !== post.id));
      setToast({ message: 'Post deleted successfully', type: 'success' });
    } catch (error) {
      console.error('Error deleting post:', error);
      setToast({ message: 'Failed to delete post', type: 'error' });
    }
  };

  const togglePostSelection = (postId: string) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else {
      newSelected.add(postId);
    }
    setSelectedPosts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedPosts.size === paginatedPosts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(paginatedPosts.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleteConfirm(false);
    try {
      const toDelete = posts.filter(p => selectedPosts.has(p.id));
      await Promise.all(toDelete.map(p => api.posts.delete(p.slug)));
      setPosts(posts.filter(p => !selectedPosts.has(p.id)));
      setSelectedPosts(new Set());
      setToast({ message: 'Posts deleted successfully', type: 'success' });
    } catch (error) {
      console.error('Error deleting posts:', error);
      setToast({ message: 'Failed to delete posts', type: 'error' });
    }
  };

  const handleBulkPublish = async (publish: boolean) => {
    if (selectedPosts.size === 0) return;

    try {
      const toUpdate = posts.filter(p => selectedPosts.has(p.id));
      await Promise.all(toUpdate.map(p =>
        api.posts.update(p.slug, { status: publish ? 'published' : 'draft' })
      ));
      await loadPosts();
      setSelectedPosts(new Set());
      setToast({ message: `Posts ${publish ? 'published' : 'unpublished'} successfully`, type: 'success' });
    } catch (error) {
      console.error('Error updating posts:', error);
      setToast({ message: 'Failed to update posts', type: 'error' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage);

  const postToDelete = deleteConfirmId ? posts.find(p => p.id === deleteConfirmId) : null;

  const pendingCount = posts.filter(p => p.approval_status === 'pending').length;

  const filters: { key: FilterType; label: string; icon: any; count?: number }[] = [
    { key: 'all', label: 'All', icon: Filter },
    { key: 'published', label: 'Published', icon: CheckCircle2 },
    { key: 'draft', label: 'Drafts', icon: Circle },
    { key: 'featured', label: 'Featured', icon: Star },
    ...((!isStaff) ? [{ key: 'pending_approval' as FilterType, label: 'Pending Approval', icon: Clock, count: pendingCount }] : []),
  ];

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Posts</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your blog posts and content
            </p>
          </div>
          <Link
            to="/admin/posts/new"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>New Post</span>
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {filters.map((filter) => {
                const Icon = filter.icon;
                return (
                  <button
                    key={filter.key}
                    onClick={() => setActiveFilter(filter.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeFilter === filter.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{filter.label}</span>
                    {filter.count !== undefined && filter.count > 0 && (
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${activeFilter === filter.key ? 'bg-white/20 text-white' : 'bg-amber-500 text-white'}`}>
                        {filter.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {selectedPosts.size > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-900 dark:text-white font-medium">
                {selectedPosts.size} post{selectedPosts.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkPublish(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Publish
                </button>
                <button
                  onClick={() => handleBulkPublish(false)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Unpublish
                </button>
                <button
                  onClick={() => setBulkDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedPosts.size === paginatedPosts.length && paginatedPosts.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedPosts.has(post.id)}
                        onChange={() => togglePostSelection(post.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/posts/edit/${post.id}`}
                          className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {post.title}
                        </Link>
                        {post.isFeatured && (
                          <Star size={16} className="text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {post.categoryName || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${
                            post.status === 'published'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          }`}
                        >
                          {post.status === 'published' ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                          {post.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                        {post.approval_status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 w-fit">
                            <Clock size={10} />
                            Awaiting Approval
                          </span>
                        )}
                        {post.approval_status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 w-fit">
                            <ThumbsDown size={10} />
                            Rejected
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <Eye size={14} />
                        <span>{post.views || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar size={14} />
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {(isCEO || isAdmin) && post.approval_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprovePost(post)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                              title="Approve & Publish"
                            >
                              <ThumbsUp size={16} />
                            </button>
                            <button
                              onClick={() => handleRejectPost(post)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <ThumbsDown size={16} />
                            </button>
                          </>
                        )}
                        <Link
                          to={`/admin/posts/edit/${post.id}`}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </Link>
                        {!isStaff && (
                          <button
                            onClick={() => setDeleteConfirmId(post.id)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Filter size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-2">No posts found</p>
              <p className="text-sm">Try adjusting your filters or search query</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(startIndex + postsPerPage, filteredPosts.length)} of{' '}
              {filteredPosts.length} posts
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {deleteConfirmId && postToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Delete Post?</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">"{postToDelete.title}"</span> will be permanently deleted and removed from the website.
                </p>
              </div>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(postToDelete)}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Delete Post
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Delete {selectedPosts.size} Posts?</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  These {selectedPosts.size} posts will be permanently deleted and cannot be recovered.
                </p>
              </div>
              <button
                onClick={() => setBulkDeleteConfirm(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setBulkDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AdminLayout>
  );
}
