import { Link } from 'react-router-dom';
import { Crown, ArrowRight, X } from 'lucide-react';

interface Props {
  title?: string;
  description?: string;
  onDismiss?: () => void;
  variant?: 'inline' | 'card';
}

export default function UpgradePrompt({
  title = "You've hit the free tier limit",
  description = 'Upgrade to Premium for unlimited saves, premium articles, and priority support — one-time $5 payment, lifetime access.',
  onDismiss,
  variant = 'card',
}: Props) {
  const isInline = variant === 'inline';

  return (
    <div
      className={`relative overflow-hidden ${
        isInline ? 'rounded-xl' : 'rounded-2xl'
      } bg-gradient-to-br from-amber-50 to-blue-50 dark:from-amber-950/20 dark:to-blue-950/30 border border-amber-200/60 dark:border-amber-900/40 ${
        isInline ? 'p-4' : 'p-5 sm:p-6'
      }`}
    >
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="absolute top-2 right-2 p-1.5 rounded-full text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      )}
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex items-center justify-center ${
            isInline ? 'w-9 h-9' : 'w-11 h-11'
          } rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md flex-shrink-0`}
        >
          <Crown size={isInline ? 16 : 18} />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className={`font-black tracking-tight text-gray-900 dark:text-white ${isInline ? 'text-sm' : 'text-base sm:text-lg'}`}>
            {title}
          </h3>
          <p className={`text-gray-700 dark:text-gray-300 mt-0.5 ${isInline ? 'text-xs' : 'text-sm'}`}>
            {description}
          </p>
          <Link
            to="/upgrade"
            className={`inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors shadow-sm cursor-pointer ${
              isInline ? 'text-xs' : 'text-sm'
            }`}
          >
            Upgrade to Premium
            <ArrowRight size={isInline ? 12 : 14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
