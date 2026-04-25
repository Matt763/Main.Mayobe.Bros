import { useState } from 'react';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { useIsJobSaved } from '../hooks/useJobs';

interface Props {
  jobId: string;
  onRequireAuth?: () => void;
}

export default function SaveJobButton({ jobId, onRequireAuth }: Props) {
  const { saved, loading, toggle, signedIn } = useIsJobSaved(jobId);
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

  const Icon = saved ? BookmarkCheck : Bookmark;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy || loading}
      aria-pressed={saved}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
        saved
          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800 hover:ring-blue-300 dark:hover:ring-blue-700'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400'
      }`}
    >
      {busy ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
      {saved ? 'Saved' : 'Save job'}
    </button>
  );
}
