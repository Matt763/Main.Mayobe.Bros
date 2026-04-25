import { useState } from 'react';
import { Bookmark, BookmarkCheck, Loader2, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useIsSaved } from '../hooks/useSavedPosts';
import { useUserAuth } from '../contexts/UserAuthContext';
import { usePlan, FREE_SAVED_POSTS_LIMIT } from '../hooks/usePlan';
import { useDashboardSettings } from '../hooks/useDashboardSettings';

interface Props {
  postId: string;
  variant?: 'default' | 'compact';
  onRequireAuth?: () => void;
}

export default function SaveButton({ postId, variant = 'default', onRequireAuth }: Props) {
  const { saved, loading, toggle, signedIn } = useIsSaved(postId);
  const { publicUser } = useUserAuth();
  const { isPremium } = usePlan();
  const { config: dashboardConfig } = useDashboardSettings();
  const savedLimit = dashboardConfig.limits.freeSavedPostsMax ?? FREE_SAVED_POSTS_LIMIT;
  const savedFeatureEnabled = dashboardConfig.features.savedContent;
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<'saved' | 'removed' | null>(null);
  const [limitHit, setLimitHit] = useState(false);

  const handleClick = async () => {
    if (!signedIn) {
      onRequireAuth?.();
      return;
    }
    if (busy) return;

    // Free-tier limit: check before saving (no check on un-save).
    if (!saved && !isPremium && publicUser) {
      const { count } = await supabase
        .from('saved_posts')
        .select('post_id', { count: 'exact', head: true })
        .eq('user_id', publicUser.id);
      if ((count || 0) >= savedLimit) {
        setLimitHit(true);
        return;
      }
    }

    setBusy(true);
    const wasSaved = saved;
    const result = await toggle();
    setBusy(false);
    if (!result.error) {
      setFeedback(wasSaved ? 'removed' : 'saved');
      setTimeout(() => setFeedback(null), 1600);
    }
  };

  // Hide entirely when the saved-content feature is disabled by admin.
  if (!savedFeatureEnabled) return null;

  const isCompact = variant === 'compact';
  const Icon = saved ? BookmarkCheck : Bookmark;

  if (limitHit) {
    return (
      <div
        className={`relative ${
          isCompact
            ? 'p-2 rounded-2xl'
            : 'px-4 py-3 rounded-2xl'
        } bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-900 inline-flex items-center gap-2`}
      >
        <Crown size={14} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold">
          Free limit reached.{' '}
          <Link to="/upgrade" className="underline font-bold">
            Upgrade
          </Link>
        </p>
        <button
          type="button"
          onClick={() => setLimitHit(false)}
          aria-label="Dismiss"
          className="ml-1 text-amber-700 dark:text-amber-400 hover:text-amber-900 cursor-pointer text-xs font-bold"
        >
          ×
        </button>
      </div>
    );
  }

  if (isCompact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={busy || loading}
        aria-pressed={saved}
        aria-label={saved ? 'Remove from saved' : 'Save article'}
        title={saved ? 'Remove from saved' : 'Save for later'}
        className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
          saved
            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400'
        }`}
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
      </button>
    );
  }

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
      <span>
        {feedback === 'saved'
          ? 'Saved!'
          : feedback === 'removed'
          ? 'Removed'
          : saved
          ? 'Saved'
          : 'Save'}
      </span>
    </button>
  );
}
