import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  Reply,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Comment {
  id: string;
  postId: string;
  author: string;
  email: string;
  content: string;
  status: 'approved' | 'pending' | 'spam';
  createdAt: string;
  postTitle?: string;
}

type FilterType = 'all' | 'approved' | 'pending' | 'spam';

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 10;

  useEffect(() => {
    loadComments();
  }, []);

  useEffect(() => {
    filterComments();
  }, [comments, activeFilter]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await api.comments.list();
      const normalized = (data || []).map((c: any) => ({
        id: c.id,
        postId: c.postId,
        author: c.author || c.user_name || '',
        email: c.email || c.user_email || '',
        content: c.content,
        status: c.status || 'pending',
        createdAt: c.createdAt || c.created_at || '',
        postTitle: c.postTitle || '',
      }));
      setComments(normalized);
    } catch (error) {
      console.error('Error loading comments:', error);
      alert('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const filterComments = () => {
    let filtered = comments;

    if (activeFilter !== 'all') {
      filtered = filtered.filter(c => c.status === activeFilter);
    }

    setFilteredComments(filtered);
    setCurrentPage(1);
  };

  const updateCommentStatus = async (id: string, status: 'approved' | 'pending' | 'spam') => {
    try {
      await api.comments.update(id, { status });
      loadComments();
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await api.comments.delete(id);
      setComments(comments.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

  const handleBulkAction = async (action: 'approve' | 'spam' | 'delete') => {
    if (selectedComments.size === 0) return;
    if (!confirm(`${action === 'delete' ? 'Delete' : 'Update'} ${selectedComments.size} comments?`)) return;

    try {
      const ids = Array.from(selectedComments);
      if (action === 'delete') {
        await Promise.all(ids.map(id => api.comments.delete(id)));
      } else {
        const status = action === 'approve' ? 'approved' : 'spam';
        await Promise.all(ids.map(id => api.comments.update(id, { status })));
      }

      loadComments();
      setSelectedComments(new Set());
    } catch (error) {
      console.error('Error in bulk action:', error);
      alert('Failed to perform bulk action');
    }
  };

  const toggleCommentSelection = (id: string) => {
    const newSelected = new Set(selectedComments);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedComments(newSelected);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPages = Math.ceil(filteredComments.length / commentsPerPage);
  const startIndex = (currentPage - 1) * commentsPerPage;
  const paginatedComments = filteredComments.slice(startIndex, startIndex + commentsPerPage);

  const filters: { key: FilterType; label: string; icon: any; color: string }[] = [
    { key: 'all', label: 'All', icon: MessageSquare, color: 'blue' },
    { key: 'approved', label: 'Approved', icon: CheckCircle2, color: 'green' },
    { key: 'pending', label: 'Pending', icon: Clock, color: 'orange' },
    { key: 'spam', label: 'Spam', icon: AlertTriangle, color: 'red' },
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Comments</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Moderate and manage user comments
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => {
              const Icon = filter.icon;
              const count = filter.key === 'all' ? comments.length : comments.filter(c => c.status === filter.key).length;
              return (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeFilter === filter.key
                      ? `bg-${filter.color}-600 text-white`
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Icon size={18} />
                  <span>{filter.label}</span>
                  <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedComments.size > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-900 dark:text-white font-medium">
                {selectedComments.size} comment{selectedComments.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('approve')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleBulkAction('spam')}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Mark as Spam
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {paginatedComments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border-l-4 border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedComments.has(comment.id)}
                    onChange={() => toggleCommentSelection(comment.id)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User size={16} className="text-gray-400" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {comment.author}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {comment.email}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          comment.status === 'approved'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : comment.status === 'pending'
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {comment.status}
                      </span>
                    </div>
                    {comment.postTitle && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        On: {comment.postTitle}
                      </p>
                    )}
                    <p className="text-gray-700 dark:text-gray-300">
                      {comment.content}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <Calendar size={12} />
                      <span>{formatDate(comment.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {comment.status !== 'approved' && (
                  <button
                    onClick={() => updateCommentStatus(comment.id, 'approved')}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  >
                    <CheckCircle2 size={16} />
                    <span>Approve</span>
                  </button>
                )}
                {comment.status !== 'spam' && (
                  <button
                    onClick={() => updateCommentStatus(comment.id, 'spam')}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                  >
                    <AlertTriangle size={16} />
                    <span>Spam</span>
                  </button>
                )}
                <button
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Reply size={16} />
                  <span>Reply</span>
                </button>
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}

          {filteredComments.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
              <MessageSquare size={48} className="mx-auto mb-3 opacity-50 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No comments found
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {activeFilter !== 'all' ? 'Try changing the filter' : 'Comments will appear here'}
              </p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(startIndex + commentsPerPage, filteredComments.length)} of{' '}
              {filteredComments.length} comments
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
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
    </AdminLayout>
  );
}
