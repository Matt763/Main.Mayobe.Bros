import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Trash2,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Review {
  id: string;
  author: string;
  content: string;
  rating: number;
  status: 'approved' | 'pending' | 'rejected' | 'spam';
  createdAt: string;
}

type FilterType = 'all' | 'approved' | 'pending' | 'rejected' | 'spam';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 10;

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    let filtered = reviews;
    if (activeFilter !== 'all') {
      filtered = filtered.filter(r => r.status === activeFilter);
    }
    setFilteredReviews(filtered);
    setCurrentPage(1);
  }, [reviews, activeFilter]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await api.reviews.list();
      const normalized = (data || []).map((r: any) => ({
        id: r.id,
        author: r.author || r.user_name || '',
        content: r.content || r.comment || '',
        rating: r.rating || 5,
        status: r.status || 'pending',
        createdAt: r.createdAt || r.created_at || '',
      }));
      setReviews(normalized);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: Review['status']) => {
    try {
      await api.reviews.update(id, { status });
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return;
    try {
      await api.reviews.delete(id);
      setReviews(prev => prev.filter(r => r.id !== id));
      setSelectedReviews(prev => { const s = new Set(prev); s.delete(id); return s; });
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (selectedReviews.size === 0) return;
    if (!confirm(`${action === 'delete' ? 'Delete' : 'Update'} ${selectedReviews.size} reviews?`)) return;
    const ids = Array.from(selectedReviews);
    try {
      if (action === 'delete') {
        await Promise.all(ids.map(id => api.reviews.delete(id)));
        setReviews(prev => prev.filter(r => !ids.includes(r.id)));
      } else {
        const status = action === 'approve' ? 'approved' : 'rejected';
        await Promise.all(ids.map(id => api.reviews.update(id, { status })));
        setReviews(prev => prev.map(r => ids.includes(r.id) ? { ...r, status: status as Review['status'] } : r));
      }
      setSelectedReviews(new Set());
    } catch (error) {
      console.error('Bulk action error:', error);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedReviews(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={14}
        className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
      />
    ));

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      pending: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      spam: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    };
    return map[status] || map.pending;
  };

  const filters: { key: FilterType; label: string; icon: any }[] = [
    { key: 'all', label: 'All', icon: Star },
    { key: 'pending', label: 'Pending', icon: Clock },
    { key: 'approved', label: 'Approved', icon: CheckCircle2 },
    { key: 'rejected', label: 'Rejected', icon: XCircle },
    { key: 'spam', label: 'Spam', icon: AlertTriangle },
  ];

  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const paginatedReviews = filteredReviews.slice(startIndex, startIndex + reviewsPerPage);

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reviews</h1>
          <p className="text-gray-600 dark:text-gray-400">Moderate reader reviews before they appear publicly</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Pending', count: reviews.filter(r => r.status === 'pending').length, color: 'orange' },
            { label: 'Approved', count: reviews.filter(r => r.status === 'approved').length, color: 'green' },
            { label: 'Rejected', count: reviews.filter(r => r.status === 'rejected').length, color: 'red' },
            { label: 'Spam', count: reviews.filter(r => r.status === 'spam').length, color: 'gray' },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.count}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {filters.map(f => {
              const Icon = f.icon;
              const count = f.key === 'all' ? reviews.length : reviews.filter(r => r.status === f.key).length;
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeFilter === f.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Icon size={16} />
                  <span>{f.label}</span>
                  <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedReviews.size > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-900 dark:text-white font-medium">
                {selectedReviews.size} review{selectedReviews.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('approve')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {paginatedReviews.map(review => (
            <div
              key={review.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border-l-4 border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
            >
              <div className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={selectedReviews.has(review.id)}
                  onChange={() => toggleSelection(review.id)}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <span className="font-semibold text-gray-900 dark:text-white">{review.author}</span>
                    </div>
                    <div className="flex gap-0.5">{renderStars(review.rating)}</div>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusBadge(review.status)}`}>
                      {review.status}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar size={12} />
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{review.content}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                {review.status !== 'approved' && (
                  <button
                    onClick={() => updateStatus(review.id, 'approved')}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  >
                    <CheckCircle2 size={16} />
                    Approve
                  </button>
                )}
                {review.status !== 'rejected' && (
                  <button
                    onClick={() => updateStatus(review.id, 'rejected')}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                )}
                {review.status !== 'spam' && (
                  <button
                    onClick={() => updateStatus(review.id, 'spam')}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                  >
                    <AlertTriangle size={16} />
                    Mark Spam
                  </button>
                )}
                <button
                  onClick={() => handleDelete(review.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors ml-auto"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}

          {filteredReviews.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
              <Star size={48} className="mx-auto mb-3 opacity-30 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">No reviews found</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {activeFilter !== 'all' ? 'Try changing the filter' : 'Reviews will appear here after submission'}
              </p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1}–{Math.min(startIndex + reviewsPerPage, filteredReviews.length)} of {filteredReviews.length}
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
