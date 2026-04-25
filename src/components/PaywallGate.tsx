import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Lock, ArrowRight } from 'lucide-react';
import { usePlan } from '../hooks/usePlan';
import { useUserAuth } from '../contexts/UserAuthContext';

interface Props {
  isPremiumContent: boolean;
  children: ReactNode;
  /** Optional teaser shown above the paywall card. */
  preview?: ReactNode;
}

export default function PaywallGate({ isPremiumContent, children, preview }: Props) {
  const { isPremium, loading } = usePlan();
  const { publicUser } = useUserAuth();

  if (!isPremiumContent) return <>{children}</>;
  if (loading) return null;
  if (isPremium) return <>{children}</>;

  return (
    <div className="relative">
      {preview && (
        <div className="relative max-h-72 overflow-hidden">
          <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none opacity-90">
            {preview}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/85 dark:from-gray-950 dark:via-gray-950/85 to-transparent" />
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-blue-50 dark:from-amber-950/20 dark:to-blue-950/30 border border-amber-200/60 dark:border-amber-900/40 p-6 sm:p-8 mt-2">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-amber-300/20 blur-3xl"
        />
        <div className="relative flex items-start gap-4">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md flex-shrink-0">
            <Crown size={20} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-amber-700 dark:text-amber-400 mb-1">
              <Lock size={11} />
              Premium article
            </p>
            <h3 className="text-lg sm:text-xl font-black tracking-tight text-gray-900 dark:text-white mb-1">
              Unlock the full story with Premium
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Get unlimited saves, premium articles, and priority support. One-time payment, lifetime access.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                to={publicUser ? '/upgrade' : '/signin?next=/upgrade'}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition-colors shadow-sm cursor-pointer"
              >
                Upgrade for $5
                <ArrowRight size={14} />
              </Link>
              <Link
                to="/upgrade#features"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
              >
                See what's included
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
