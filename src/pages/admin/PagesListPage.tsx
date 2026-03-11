import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import AdminLayout from '../../components/admin/AdminLayout';
import Toast from '../../components/admin/Toast';
import { Plus, Search, CreditCard as Edit, Trash2, Calendar, Menu as MenuIcon, ChevronLeft, ChevronRight, Filter, CheckCircle2, Circle, X, AlertTriangle, ExternalLink } from 'lucide-react';

interface Page {
  id: string;
  title: string;
  slug: string;
  status: string;
  showInMenu: boolean;
  isIndexed: boolean;
  createdAt: string;
  updatedAt: string;
}

type FilterType = 'all' | 'published' | 'draft';

export default function PagesListPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [filteredPages, setFilteredPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const pagesPerPage = 10;

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    filterPages();
  }, [pages, searchQuery, activeFilter]);

  const loadPages = async () => {
    setLoading(true);
    try {
      const data = await api.pages.list({ status: 'all' });
      const normalized = (data || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        status: p.status || (p.published ? 'published' : 'draft'),
        showInMenu: p.showInMenu ?? p.show_in_menu ?? false,
        isIndexed: p.isIndexed ?? p.is_indexed ?? true,
        createdAt: p.createdAt || p.created_at || '',
        updatedAt: p.updatedAt || p.updated_at || '',
      }));
      setPages(normalized);
    } catch (error) {
      console.error('Error loading pages:', error);
      setToast({ message: 'Failed to load pages', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filterPages = () => {
    let filtered = pages;

    if (activeFilter === 'published') {
      filtered = filtered.filter(p => p.status === 'published');
    } else if (activeFilter === 'draft') {
      filtered = filtered.filter(p => p.status !== 'published');
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPages(filtered);
    setCurrentPage(1);
  };

  const handleDelete = async (page: Page) => {
    setDeleteConfirmId(null);
    try {
      await api.pages.delete(page.id);
      setPages(pages.filter(p => p.id !== page.id));
      setToast({ message: 'Page deleted successfully', type: 'success' });
    } catch (error) {
      console.error('Error deleting page:', error);
      setToast({ message: 'Failed to delete page', type: 'error' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const totalPages = Math.ceil(filteredPages.length / pagesPerPage);
  const startIndex = (currentPage - 1) * pagesPerPage;
  const paginatedPages = filteredPages.slice(startIndex, startIndex + pagesPerPage);

  const pageToDelete = deleteConfirmId ? pages.find(p => p.id === deleteConfirmId) : null;

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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Pages</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your static pages
            </p>
          </div>
          <Link
            to="/admin/pages/new"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>New Page</span>
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
                placeholder="Search pages..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              {[
                { key: 'all' as FilterType, label: 'All', icon: Filter },
                { key: 'published' as FilterType, label: 'Published', icon: CheckCircle2 },
                { key: 'draft' as FilterType, label: 'Drafts', icon: Circle },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeFilter === filter.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <filter.icon size={18} />
                  <span className="hidden sm:inline">{filter.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Status
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
                {paginatedPages.map((page) => (
                  <tr key={page.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/pages/edit/${page.id}`}
                          className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {page.title}
                        </Link>
                        {page.showInMenu && (
                          <span title="Shown in menu">
                            <MenuIcon size={16} className="text-blue-500" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        /page/{page.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          page.status === 'published'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}
                      >
                        {page.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar size={14} />
                        <span>{formatDate(page.updatedAt || page.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {page.status === 'published' && (
                          <a
                            href={`/page/${page.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="View live page"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                        <Link
                          to={`/admin/pages/edit/${page.id}`}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => setDeleteConfirmId(page.id)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPages.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Filter size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-2">No pages found</p>
              <Link
                to="/admin/pages/new"
                className="inline-block mt-3 text-blue-600 dark:text-blue-400 hover:underline"
              >
                Create your first page
              </Link>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(startIndex + pagesPerPage, filteredPages.length)} of{' '}
              {filteredPages.length} pages
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

      {deleteConfirmId && pageToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Delete Page?</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">"{pageToDelete.title}"</span> will be permanently deleted and removed from the website.
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
                onClick={() => handleDelete(pageToDelete)}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Delete Page
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
