import { Link } from 'react-router-dom';
import { Calendar, BookmarkX, User } from 'lucide-react';
import type { SavedPostWithMeta } from '../../hooks/useSavedPosts';

interface Props {
  item: SavedPostWithMeta;
  onRemove: (postId: string) => void;
}

function postHref(item: SavedPostWithMeta): string | null {
  const post = item.post;
  if (!post || !post.category) return null;
  if (post.label) return `/post/${post.category.slug}/${post.label.slug}/${post.slug}`;
  return `/post/${post.category.slug}/${post.slug}`;
}

function formatDate(value: string | null) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function SavedPostCard({ item, onRemove }: Props) {
  const post = item.post;
  const href = postHref(item);
  const placeholder = !post || !href;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
      {placeholder ? (
        <div className="aspect-[16/9] bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
          Post no longer available
        </div>
      ) : (
        <Link to={href!} className="block aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-800">
          {post!.featured_image ? (
            <img
              src={post!.featured_image}
              alt={post!.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10" />
          )}
        </Link>
      )}

      <div className="flex-1 flex flex-col gap-2 p-4">
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
            className="font-bold text-base leading-snug text-gray-900 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {post!.title}
          </Link>
        ) : (
          <p className="font-bold text-base leading-snug text-gray-500 dark:text-gray-400 line-clamp-2">
            Saved post (unavailable)
          </p>
        )}

        {post?.excerpt && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{post.excerpt}</p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between gap-2 text-[11px] text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3 min-w-0">
            {post?.author && (
              <span className="inline-flex items-center gap-1 truncate">
                <User size={11} className="flex-shrink-0" />
                <span className="truncate">{post.author}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Calendar size={11} />
              Saved {formatDate(item.created_at)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.post_id)}
            aria-label="Remove from saved"
            title="Remove from saved"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
          >
            <BookmarkX size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
