import { Megaphone, X, ArrowRight } from 'lucide-react';
import { useBroadcasts } from '../../hooks/useBroadcasts';

export default function BroadcastBanner({ variant = 'standard' }: { variant?: 'standard' | 'premium' }) {
  const { items, dismiss } = useBroadcasts(5);
  if (items.length === 0) return null;

  const top = items[0];

  if (variant === 'premium') {
    return (
      <aside className="rounded-2xl atelier-card p-4 sm:p-5 flex items-start gap-4 premium-fade-in">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[#d4af37]/40 bg-gradient-to-b from-[#1a1438] to-[#0a0a1a] flex-shrink-0">
          <Megaphone size={16} className="text-[#e8c468]" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] tracking-[0.32em] uppercase font-medium text-[#e8c468] mb-1">Announcement</p>
          <p className="font-serif italic text-lg text-[#f8f5ec] leading-snug">{top.title}</p>
          {top.body && <p className="text-sm text-[#a8a8b8] leading-relaxed mt-1">{top.body}</p>}
          {top.link && (
            <a href={top.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-sm text-[#e8c468] hover:text-[#f4d97a] font-medium">
              Read more <ArrowRight size={12} />
            </a>
          )}
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => dismiss(top.id)}
          className="text-[#a8a8b8] hover:text-[#f8f5ec] p-1 -m-1 rounded-md hover:bg-white/[0.05]"
        >
          <X size={14} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 sm:p-5 flex items-start gap-4">
      <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex-shrink-0">
        <Megaphone size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] tracking-[0.22em] uppercase font-bold text-amber-700 dark:text-amber-400 mb-1">Announcement</p>
        <p className="font-bold text-base text-gray-900 dark:text-white">{top.title}</p>
        {top.body && <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">{top.body}</p>}
        {top.link && (
          <a href={top.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-sm text-amber-700 dark:text-amber-400 hover:underline font-semibold">
            Read more <ArrowRight size={12} />
          </a>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => dismiss(top.id)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 -m-1 rounded-md hover:bg-amber-100/50 dark:hover:bg-amber-900/30"
      >
        <X size={14} />
      </button>
    </aside>
  );
}
