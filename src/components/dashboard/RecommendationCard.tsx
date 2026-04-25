import { Link } from 'react-router-dom';
import { Calendar, User } from 'lucide-react';
import type { Recommendation } from '../../hooks/useInterests';

interface Props {
  item: Recommendation;
}

function postHref(item: Recommendation): string | null {
  if (!item.category) return null;
  if (item.label) return `/post/${item.category.slug}/${item.label.slug}/${item.slug}`;
  return `/post/${item.category.slug}/${item.slug}`;
}

function formatDate(value: string | null) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function RecommendationCard({ item }: Props) {
  const href = postHref(item);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
      <Link
        to={href || '#'}
        className={`block aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-800 ${!href ? 'pointer-events-none' : ''}`}
      >
        {item.featured_image ? (
          <img
            src={item.featured_image}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10" />
        )}
      </Link>

      <div className="flex-1 flex flex-col gap-2 p-4">
        {item.category && (
          <Link
            to={`/category/${item.category.slug}`}
            className="self-start text-[10px] uppercase tracking-widest font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            {item.category.name}
            {item.label ? ` / ${item.label.name}` : ''}
          </Link>
        )}

        {href ? (
          <Link
            to={href}
            className="font-bold text-base leading-snug text-gray-900 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {item.title}
          </Link>
        ) : (
          <p className="font-bold text-base leading-snug text-gray-500 dark:text-gray-400 line-clamp-2">
            {item.title}
          </p>
        )}

        {item.excerpt && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{item.excerpt}</p>
        )}

        <div className="mt-auto pt-2 flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
          {item.author && (
            <span className="inline-flex items-center gap-1 truncate">
              <User size={11} className="flex-shrink-0" />
              <span className="truncate">{item.author}</span>
            </span>
          )}
          {item.published_at && (
            <span className="inline-flex items-center gap-1">
              <Calendar size={11} />
              {formatDate(item.published_at)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
