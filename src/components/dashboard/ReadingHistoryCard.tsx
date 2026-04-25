import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import type { ReadingHistoryItem } from '../../hooks/useReadingTracking';

interface Props {
  item: ReadingHistoryItem;
  variant?: 'default' | 'compact';
}

function postHref(item: ReadingHistoryItem): string | null {
  const post = item.post;
  if (!post || !post.category) return null;
  if (post.label) return `/post/${post.category.slug}/${post.label.slug}/${post.slug}`;
  return `/post/${post.category.slug}/${post.slug}`;
}

function relativeTime(iso: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.round(ms / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (sec < 60) return 'just now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  if (day < 30) return `${Math.round(day / 7)}w ago`;
  if (day < 365) return `${Math.round(day / 30)}mo ago`;
  return `${Math.round(day / 365)}y ago`;
}

export default function ReadingHistoryCard({ item, variant = 'default' }: Props) {
  const post = item.post;
  const href = postHref(item);
  const relative = relativeTime(item.last_read_at);

  if (variant === 'compact') {
    return (
      <Link
        to={href || '#'}
        className={`group flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all ${
          !href ? 'pointer-events-none opacity-60' : ''
        }`}
      >
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
          {post?.featured_image ? (
            <img
              src={post.featured_image}
              alt={post.title}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {post?.category && (
            <p className="text-[10px] uppercase tracking-widest font-bold text-blue-600 dark:text-blue-400 truncate">
              {post.category.name}
            </p>
          )}
          <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug">
            {post?.title || 'Article (unavailable)'}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 inline-flex items-center gap-1">
            <Clock size={11} />
            {relative}
          </p>
        </div>
        {href && (
          <ArrowRight
            size={16}
            className="text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors flex-shrink-0"
          />
        )}
      </Link>
    );
  }

  return (
    <article className="group rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-all">
      {href ? (
        <Link to={href} className="block aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-800">
          {post?.featured_image ? (
            <img
              src={post.featured_image}
              alt={post.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10" />
          )}
        </Link>
      ) : (
        <div className="aspect-[16/9] bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
          Article unavailable
        </div>
      )}
      <div className="p-4 space-y-2">
        {post?.category && (
          <Link
            to={`/category/${post.category.slug}`}
            className="self-start text-[10px] uppercase tracking-widest font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            {post.category.name}
            {post.label ? ` / ${post.label.name}` : ''}
          </Link>
        )}
        {href ? (
          <Link
            to={href}
            className="block font-bold text-base leading-snug text-gray-900 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {post!.title}
          </Link>
        ) : (
          <p className="font-bold text-base leading-snug text-gray-500 dark:text-gray-400 line-clamp-2">
            Article (unavailable)
          </p>
        )}
        <p className="text-[11px] text-gray-500 dark:text-gray-400 inline-flex items-center gap-1.5 pt-1">
          <Clock size={11} />
          Read {relative}
        </p>
      </div>
    </article>
  );
}
