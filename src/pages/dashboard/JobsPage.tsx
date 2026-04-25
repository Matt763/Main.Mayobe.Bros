import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckCheck, Bookmark, ArrowRight } from 'lucide-react';
import { useSavedJobsList, useAppliedJobsList } from '../../hooks/useJobs';
import JobCard from '../../components/JobCard';
import EmptyState from '../../components/dashboard/EmptyState';

type Tab = 'saved' | 'applied';

export default function DashboardJobsPage() {
  const [tab, setTab] = useState<Tab>('saved');
  const saved = useSavedJobsList();
  const applied = useAppliedJobsList();

  const current = tab === 'saved' ? saved : applied;
  const items =
    tab === 'saved'
      ? saved.items.filter(i => i.job).map(i => ({ ...i.job!, _caption: `Saved ${new Date(i.created_at).toLocaleDateString()}` }))
      : applied.items.filter(i => i.job).map(i => ({ ...i.job!, _caption: `Applied ${new Date(i.applied_at).toLocaleDateString()}` }));

  return (
    <div className="space-y-6">
      <header className="hidden lg:block">
        <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Jobs</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Keep your saved jobs and applications in one place.
        </p>
      </header>

      {/* Tabs */}
      <div className="inline-flex rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setTab('saved')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
            tab === 'saved'
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Bookmark size={14} />
          Saved
          {saved.items.length > 0 && (
            <span
              className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full ${
                tab === 'saved'
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
            >
              {saved.items.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab('applied')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
            tab === 'applied'
              ? 'bg-emerald-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <CheckCheck size={14} />
          Applied
          {applied.items.length > 0 && (
            <span
              className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full ${
                tab === 'applied'
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
            >
              {applied.items.length}
            </span>
          )}
        </button>
      </div>

      {current.loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={tab === 'saved' ? Bookmark : CheckCheck}
          title={tab === 'saved' ? 'No saved jobs yet' : 'No applications tracked'}
          description={
            tab === 'saved'
              ? 'Tap the Save button on any job to bookmark it for later.'
              : "As you apply to jobs, mark them here to keep track of your pipeline."
          }
          action={
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            >
              <Briefcase size={14} />
              Browse jobs
              <ArrowRight size={14} />
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((job: any) => (
            <JobCard
              key={job.id}
              job={job}
              caption={job._caption}
              onRemove={tab === 'saved' ? saved.remove : applied.remove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
