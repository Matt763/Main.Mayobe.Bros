import { Link } from 'react-router-dom';
import { MapPin, Briefcase, Globe2, Calendar, BookmarkX } from 'lucide-react';
import type { Job } from '../hooks/useJobs';

interface Props {
  job: Job;
  onRemove?: (jobId: string) => void;
  caption?: string;
}

const TYPE_LABELS: Record<Job['employmentType'], string> = {
  'full-time':  'Full-time',
  'part-time':  'Part-time',
  'contract':   'Contract',
  'internship': 'Internship',
  'freelance':  'Freelance',
};

function formatDate(value: string | null) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function JobCard({ job, onRemove, caption }: Props) {
  const companyInitial = job.company?.[0]?.toUpperCase() || '•';

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all">
      <div className="flex items-start gap-3 p-5">
        {job.companyLogo ? (
          <img
            src={job.companyLogo}
            alt={job.company}
            className="w-12 h-12 rounded-xl object-cover ring-1 ring-gray-200 dark:ring-gray-800 flex-shrink-0"
            loading="lazy"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {companyInitial}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Link
            to={`/jobs/${job.slug}`}
            className="block font-bold text-base leading-snug text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2"
          >
            {job.title}
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{job.company}</p>
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(job.id)}
            aria-label="Remove from saved"
            title="Remove from saved"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer flex-shrink-0"
          >
            <BookmarkX size={14} />
          </button>
        )}
      </div>

      <div className="px-5 pb-5 flex flex-wrap items-center gap-2 text-[11px]">
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
      </div>

      {(caption || job.publishedAt) && (
        <div className="px-5 pb-4 mt-auto pt-0 text-[11px] text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3 flex items-center gap-1.5">
          <Calendar size={11} />
          {caption ?? `Posted ${formatDate(job.publishedAt)}`}
        </div>
      )}
    </article>
  );
}
