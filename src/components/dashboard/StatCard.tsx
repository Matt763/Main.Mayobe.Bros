import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: 'blue' | 'indigo' | 'amber' | 'emerald';
  loading?: boolean;
}

const ACCENTS: Record<NonNullable<Props['accent']>, string> = {
  blue:    'from-blue-500/10 to-blue-500/0 text-blue-600 dark:text-blue-400 ring-blue-500/20',
  indigo:  'from-indigo-500/10 to-indigo-500/0 text-indigo-600 dark:text-indigo-400 ring-indigo-500/20',
  amber:   'from-amber-500/10 to-amber-500/0 text-amber-600 dark:text-amber-400 ring-amber-500/20',
  emerald: 'from-emerald-500/10 to-emerald-500/0 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = 'blue',
  loading,
}: Props) {
  const accentClass = ACCENTS[accent];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
      <div
        aria-hidden
        className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${accentClass} opacity-60`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight text-gray-900 dark:text-white">
            {loading ? <span className="inline-block w-12 h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /> : value}
          </p>
          {hint && !loading && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
          )}
        </div>
        <span
          className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ring-1 bg-gray-50 dark:bg-gray-800/60 ${accentClass}`}
        >
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}
