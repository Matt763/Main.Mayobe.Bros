import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, Plus, Pencil, Trash2, Search, Loader2, AlertCircle,
} from 'lucide-react';
import type { Job } from '../../hooks/useJobs';

async function fetchJSON(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(path, {
    credentials: 'include',
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || 'Request failed');
  return res.json();
}

const STATUS_STYLES: Record<Job['status'], string> = {
  draft:     'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  closed:    'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400',
};

export default function AdminJobsListPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchJSON('/api/jobs/admin');
      setJobs(data.jobs || []);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = q
    ? jobs.filter(j =>
        [j.title, j.company, j.location || '', j.slug]
          .some(s => s.toLowerCase().includes(q.toLowerCase()))
      )
    : jobs;

  const handleDelete = async (job: Job) => {
    if (!confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    setBusyId(job.id);
    try {
      await fetchJSON(`/api/jobs/${job.id}`, { method: 'DELETE' });
      setJobs(prev => prev.filter(j => j.id !== job.id));
    } catch (e: any) {
      alert(e?.message || 'Failed to delete');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white inline-flex items-center gap-2">
            <Briefcase className="text-blue-600" size={24} />
            Jobs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage job postings published on the public /jobs page.
          </p>
        </div>
        <Link
          to="/admin/jobs/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors shadow-sm"
        >
          <Plus size={14} />
          New job
        </Link>
      </header>

      <div className="relative mb-4 max-w-md">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search title, company, location, slug…"
          className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-300 mb-4 flex items-start gap-3">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center">
            <Loader2 className="animate-spin text-blue-600" size={24} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-base font-bold text-gray-900 dark:text-white mb-1">
              {q ? 'No jobs match your search' : 'No jobs yet'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {q ? 'Try a different search term.' : 'Click "New job" to create your first posting.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-widest font-bold">
                <tr>
                  <th className="text-left px-5 py-3">Title</th>
                  <th className="text-left px-5 py-3 hidden sm:table-cell">Company</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Type</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map(job => (
                  <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-5 py-3">
                      <Link
                        to={`/admin/jobs/edit/${job.id}`}
                        className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2"
                      >
                        {job.title}
                      </Link>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 sm:hidden truncate">
                        {job.company}
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell text-gray-600 dark:text-gray-300 truncate max-w-[200px]">
                      {job.company}
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                        {job.employmentType}
                        {job.isRemote && (
                          <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px]">
                            Remote
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_STYLES[job.status]}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          to={`/admin/jobs/edit/${job.id}`}
                          aria-label="Edit"
                          title="Edit"
                          className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(job)}
                          disabled={busyId === job.id}
                          aria-label="Delete"
                          title="Delete"
                          className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {busyId === job.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
