import { useState } from 'react';
import { Check, CheckCheck, Loader2 } from 'lucide-react';
import { useIsJobApplied } from '../hooks/useJobs';

interface Props {
  jobId: string;
  onRequireAuth?: () => void;
}

export default function MarkAppliedButton({ jobId, onRequireAuth }: Props) {
  const { applied, appliedAt, loading, toggle, signedIn } = useIsJobApplied(jobId);
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (!signedIn) {
      onRequireAuth?.();
      return;
    }
    if (busy) return;
    setBusy(true);
    await toggle();
    setBusy(false);
  };

  const Icon = applied ? CheckCheck : Check;
  const label = applied
    ? appliedAt
      ? `Applied ${new Date(appliedAt).toLocaleDateString()}`
      : 'Applied'
    : 'Mark as applied';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy || loading}
      aria-pressed={applied}
      title={applied ? 'Click to unmark' : 'I applied to this job'}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
        applied
          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-400'
      }`}
    >
      {busy ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
      {label}
    </button>
  );
}
