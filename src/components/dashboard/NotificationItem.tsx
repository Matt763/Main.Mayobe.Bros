import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import type { NotificationItem as Item } from '../../hooks/useNotifications';

interface Props {
  item: Item;
}

function postHref(item: Item): string | null {
  if (!item.category) return null;
  if (item.label) return `/post/${item.category.slug}/${item.label.slug}/${item.slug}`;
  return `/post/${item.category.slug}/${item.slug}`;
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
  return `${Math.round(day / 30)}mo ago`;
}

export default function NotificationItem({ item }: Props) {
  const href = postHref(item);

  return (
    <Link
      to={href || '#'}
      className={`group relative flex items-stretch gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
        item.is_read
          ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700'
          : 'bg-blue-50/60 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900 hover:border-blue-400 dark:hover:border-blue-700'
      } ${!href ? 'pointer-events-none opacity-60' : ''}`}
    >
      {!item.is_read && (
        <span
          aria-hidden
          className="absolute top-4 left-2 w-1.5 h-1.5 rounded-full bg-blue-500"
          title="Unread"
        />
      )}

      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 ml-2">
        {item.featured_image ? (
          <img
            src={item.featured_image}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {item.category && (
            <span className="text-[10px] uppercase tracking-widest font-bold text-blue-600 dark:text-blue-400">
              New in {item.category.name}
            </span>
          )}
          {!item.is_read && (
            <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white">
              New
            </span>
          )}
        </div>
        <p
          className={`leading-snug line-clamp-2 ${
            item.is_read
              ? 'font-semibold text-gray-900 dark:text-white'
              : 'font-bold text-gray-900 dark:text-white'
          }`}
        >
          {item.title}
        </p>
        {item.excerpt && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
            {item.excerpt}
          </p>
        )}
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 inline-flex items-center gap-1">
          <Clock size={11} />
          {relativeTime(item.published_at)}
        </p>
      </div>

      {href && (
        <ArrowRight
          size={16}
          className="self-center text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors flex-shrink-0"
        />
      )}
    </Link>
  );
}
