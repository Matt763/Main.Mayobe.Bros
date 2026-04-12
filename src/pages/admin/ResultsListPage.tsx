import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Result } from '../../lib/api';
import AdminLayout from '../../components/admin/AdminLayout';
import Toast from '../../components/admin/Toast';
import {
  Plus, Edit, Trash2, Calendar, CheckCircle2, Circle,
  ChevronLeft, ChevronRight, GraduationCap,
} from 'lucide-react';

const EXAM_TYPES = ['ftna', 'csee', 'acsee', 'psle'];
const PER_PAGE   = 10;

export default function ResultsListPage() {
  const [results, setResults]       = useState<Result[]>([]);
  const [filtered, setFiltered]     = useState<Result[]>([]);
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setStatus]   = useState('all');
  const [yearFilter, setYear]       = useState('');
  const [examFilter, setExam]       = useState('');
  const [page, setPage]             = useState(1);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [toast, setToast]           = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.results.list({ status: 'all' });
      setResults(data);
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let data = [...results];
    if (statusFilter !== 'all') data = data.filter(r => r.status === statusFilter);
    if (yearFilter)  data = data.filter(r => String(r.year) === yearFilter);
    if (examFilter)  data = data.filter(r => r.exam_type === examFilter);
    setFiltered(data);
    setPage(1);
  }, [results, statusFilter, yearFilter, examFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.results.delete(deleteId);
      showToast('Result deleted', 'success');
      setDeleteId(null);
      load();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const years      = [...new Set(results.map(r => r.year))].sort((a, b) => b - a);

  return (
    <AdminLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <GraduationCap size={24} className="text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Results</h1>
            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {filtered.length}
            </span>
          </div>
          <Link
            to="/admin/results/new"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Plus size={18} /> New Result
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={statusFilter}
            onChange={e => setStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <select
            value={yearFilter}
            onChange={e => setYear(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={examFilter}
            onChange={e => setExam(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="">All Exams</option>
            {EXAM_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No results yet.{' '}
              <Link to="/admin/results/new" className="text-green-600 hover:underline">Create one →</Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Exam</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {paginated.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">{r.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{r.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                        {r.exam_type?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{r.year}</td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1.5 text-xs font-medium ${r.status === 'published' ? 'text-green-600' : 'text-amber-500'}`}>
                        {r.status === 'published' ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                        {r.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1"><Calendar size={12} />{new Date(r.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/results/${r.id}`}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => setDeleteId(r.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Result?</h3>
            <p className="text-sm text-gray-500 mb-6">This also deletes the bridge post in Educational &gt; Results. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
