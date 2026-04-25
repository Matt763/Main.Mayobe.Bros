import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
  Briefcase, MapPin, Globe2, Calendar, ArrowLeft, ExternalLink, Loader2, AlertCircle,
} from 'lucide-react';
import { useJobBySlug } from '../hooks/useJobs';
import { useUserAuth } from '../contexts/UserAuthContext';
import SaveJobButton from '../components/SaveJobButton';
import MarkAppliedButton from '../components/MarkAppliedButton';
import AuthModal from '../components/AuthModal';

const TYPE_LABELS: Record<string, string> = {
  'full-time':  'Full-time',
  'part-time':  'Part-time',
  'contract':   'Contract',
  'internship': 'Internship',
  'freelance':  'Freelance',
};

export default function JobDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { job, loading, error } = useJobBySlug(slug);
  const { publicUser } = useUserAuth();
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!job) return;
    const prev = document.title;
    document.title = `${job.title} at ${job.company} · Mayobe Bros`;
    return () => {
      document.title = prev;
    };
  }, [job]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={28} />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl py-16">
        <div className="rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-6 text-center">
          <AlertCircle size={28} className="mx-auto text-red-600 dark:text-red-400 mb-3" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            Job not found
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The job you're looking for may have been removed or is no longer published.
          </p>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
          >
            <ArrowLeft size={14} />
            Back to jobs
          </Link>
        </div>
      </div>
    );
  }

  const companyInitial = job.company?.[0]?.toUpperCase() || '•';
  const safeDescription = DOMPurify.sanitize(job.description || '');

  const handleApply = () => {
    if (!job.applyUrl) return;
    window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-[60vh]">
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialMode="signin" />

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl pt-6">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          All jobs
        </Link>
      </div>

      {/* Hero / summary card */}
      <section className="container mx-auto px-4 sm:px-6 max-w-5xl mt-4">
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-sm">
          <div className="flex items-start gap-4 flex-wrap">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt={job.company}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-1 ring-gray-200 dark:ring-gray-800 flex-shrink-0"
                loading="lazy"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                {companyInitial}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 truncate">
                {job.company}
              </p>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
                {job.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px]">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  <Briefcase size={11} />
                  {TYPE_LABELS[job.employmentType] || job.employmentType}
                </span>
                {job.isRemote && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-semibold">
                    <Globe2 size={11} />
                    Remote
                  </span>
                )}
                {job.location && !job.isRemote && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    <MapPin size={11} />
                    {job.location}
                  </span>
                )}
                {job.salaryRange && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold">
                    {job.salaryRange}
                  </span>
                )}
                {job.publishedAt && (
                  <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400 ml-1">
                    <Calendar size={11} />
                    Posted {new Date(job.publishedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            {job.applyUrl && (
              <button
                type="button"
                onClick={handleApply}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
              >
                Apply now
                <ExternalLink size={14} />
              </button>
            )}
            <MarkAppliedButton jobId={job.id} onRequireAuth={() => setAuthOpen(true)} />
            <SaveJobButton jobId={job.id} onRequireAuth={() => setAuthOpen(true)} />
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="container mx-auto px-4 sm:px-6 max-w-5xl py-8">
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4">
            About the role
          </h2>
          <div
            className="prose prose-sm sm:prose-base dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: safeDescription }}
          />
          {!publicUser && (
            <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
              <Link to="/signin?next=/jobs/{slug}" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                Sign in
              </Link>{' '}
              to save this job or mark it as applied.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
