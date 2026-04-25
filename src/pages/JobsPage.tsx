import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Briefcase, Search as SearchIcon, Globe2, Loader2 } from 'lucide-react';
import JobCard from '../components/JobCard';
import { useJobsList, type Job } from '../hooks/useJobs';

const TYPES: { value: Job['employmentType']; label: string }[] = [
  { value: 'full-time',  label: 'Full-time' },
  { value: 'part-time',  label: 'Part-time' },
  { value: 'contract',   label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance',  label: 'Freelance' },
];

export default function JobsPage() {
  const [params, setParams] = useSearchParams();

  const q = params.get('q') || '';
  const type = (params.get('type') as Job['employmentType']) || undefined;
  const remote = params.get('remote') === 'true';
  const page = Math.max(1, parseInt(params.get('page') || '1', 10));

  const [qInput, setQInput] = useState(q);

  useEffect(() => setQInput(q), [q]);

  const filters = useMemo(
    () => ({ q, remote, type, page, limit: 20 }),
    [q, remote, type, page]
  );

  const { items, total, loading, error } = useJobsList(filters);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null || value === '') next.delete(key);
    else next.set(key, value);
    next.delete('page');
    setParams(next);
  };

  const goToPage = (n: number) => {
    const next = new URLSearchParams(params);
    next.set('page', String(n));
    setParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParam('q', qInput.trim() || null);
  };

  useEffect(() => {
    const prev = document.title;
    document.title = 'Jobs · Mayobe Bros';
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-[60vh]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:from-blue-950 dark:via-indigo-950 dark:to-slate-900 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-overlay"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />
        <div className="relative container mx-auto px-4 sm:px-6 max-w-6xl py-10 sm:py-14">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/80 mb-3">
            <Briefcase size={14} />
            Jobs & Opportunities
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3">
            Find your next role
          </h1>
          <p className="text-sm sm:text-base text-white/85 max-w-2xl mb-6">
            Curated opportunities across technology, business, and beyond. Save jobs to revisit,
            mark ones you've applied to, and keep your search organized.
          </p>

          <form onSubmit={onSubmitSearch} className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[240px] relative">
              <SearchIcon
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60"
              />
              <input
                type="search"
                value={qInput}
                onChange={e => setQInput(e.target.value)}
                placeholder="Search job title, company, or location"
                className="w-full pl-11 pr-4 py-3 rounded-full bg-white/15 text-white placeholder-white/60 border border-white/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/60"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 rounded-full bg-white text-blue-700 text-sm font-bold hover:bg-white/90 transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Filters */}
      <section className="container mx-auto px-4 sm:px-6 max-w-6xl mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setParam('remote', remote ? null : 'true')}
            aria-pressed={remote}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              remote
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-800 hover:border-emerald-400'
            }`}
          >
            <Globe2 size={12} />
            Remote only
          </button>
          {TYPES.map(t => {
            const active = type === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setParam('type', active ? null : t.value)}
                aria-pressed={active}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-800 hover:border-blue-400'
                }`}
              >
                {t.label}
              </button>
            );
          })}
          {(remote || type || q) && (
            <button
              type="button"
              onClick={() => setParams(new URLSearchParams())}
              className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-red-600 ml-1 cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="container mx-auto px-4 sm:px-6 max-w-6xl pt-6 pb-12">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {loading ? 'Loading…' : `${total} ${total === 1 ? 'job' : 'jobs'} found`}
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-300 mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="h-44 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 py-16 text-center">
            <Loader2 className="hidden" />
            <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              No jobs match your filters
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Try clearing filters or broadening your search.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(job => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-2 text-sm font-semibold rounded-full border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-2 text-sm font-semibold rounded-full border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
