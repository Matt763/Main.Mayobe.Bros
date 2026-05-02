import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { X, Calendar, User, Clock, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';

interface PostMeta {
  id: string;
  title: string;
  slug: string;
  status: string;
  categoryName?: string;
}

interface FullPost {
  title: string;
  content: string;
  featuredImage: string | null;
  author: string;
  publishedAt: string;
  createdAt: string;
  categoryName?: string;
  excerpt?: string | null;
}

interface Props {
  post: PostMeta | null;
  onClose: () => void;
}

export default function PostPreviewModal({ post, onClose }: Props) {
  const [fullPost, setFullPost] = useState<FullPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!post) return;
    setFullPost(null);
    setError(false);
    setLoading(true);

    api.posts.getById(post.id)
      .then((data: any) => {
        setFullPost({
          title: data.title,
          content: data.content || '',
          featuredImage: data.featuredImage || data.featured_image || null,
          author: data.author || 'Mayobe Bros',
          publishedAt: data.publishedAt || data.published_at || data.createdAt || data.created_at,
          createdAt: data.createdAt || data.created_at,
          categoryName: data.category?.name || post.categoryName,
          excerpt: data.excerpt || null,
        });
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [post?.id]);

  useEffect(() => {
    if (!post) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [post, onClose]);

  if (!post) return null;

  const readingMinutes = fullPost
    ? Math.max(1, Math.round(
        (fullPost.content || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 200
      ))
    : null;

  const dateStr = fullPost
    ? new Date(fullPost.publishedAt || fullPost.createdAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null;

  const sanitized = fullPost
    ? DOMPurify.sanitize(fullPost.content, {
        ADD_TAGS: ['figure', 'figcaption', 'sub', 'sup', 'iframe'],
        ADD_ATTR: ['class', 'target', 'rel', 'title', 'style', 'src', 'width', 'height',
          'frameborder', 'allowfullscreen', 'allow', 'controls', 'autoplay', 'loop', 'playsinline', 'poster'],
        ALLOW_DATA_ATTR: true,
        FORCE_BODY: true,
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
      })
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Post preview"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 flex flex-col h-full max-w-4xl w-full mx-auto shadow-2xl bg-white dark:bg-gray-950 overflow-hidden">

        {/* Draft banner */}
        <div className="flex-shrink-0 flex items-center justify-between bg-amber-500 px-4 py-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-white" />
            <span className="text-white text-xs font-bold uppercase tracking-widest">
              Draft Preview — not published
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-amber-400 transition-colors"
            aria-label="Close preview"
          >
            <X size={18} className="text-white" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500 dark:text-gray-400">
              <AlertTriangle size={32} className="text-red-400" />
              <p className="text-sm">Could not load post content.</p>
              <button
                onClick={onClose}
                className="text-sm text-blue-600 dark:text-blue-400 underline"
              >
                Close
              </button>
            </div>
          )}

          {!loading && !error && fullPost && (
            <>
              {/* Featured image */}
              <div
                className="w-full flex-shrink-0 bg-gray-200 dark:bg-gray-800"
                style={{ height: '280px' }}
              >
                {fullPost.featuredImage ? (
                  <img
                    src={fullPost.featuredImage}
                    alt={fullPost.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-500 dark:from-gray-700 dark:to-gray-900" />
                )}
              </div>

              {/* Post meta */}
              <div className="px-6 sm:px-10 pt-8 pb-4 max-w-3xl mx-auto w-full">
                {fullPost.categoryName && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-blue-600 text-white mb-4">
                    {fullPost.categoryName}
                  </span>
                )}

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight text-gray-900 dark:text-white mb-4">
                  {fullPost.title}
                </h1>

                <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mb-8">
                  <span className="flex items-center gap-1.5">
                    <User size={14} />
                    {fullPost.author}
                  </span>
                  {readingMinutes && (
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} />
                      {readingMinutes} min read
                    </span>
                  )}
                  {dateStr && (
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {dateStr}
                    </span>
                  )}
                </div>

                {/* Article content */}
                <div
                  className="prose prose-lg max-w-none text-gray-700 dark:text-gray-300
                    [&_h1]:text-gray-900 [&_h1]:dark:text-white
                    [&_h2]:text-gray-900 [&_h2]:dark:text-white
                    [&_h3]:text-gray-900 [&_h3]:dark:text-white
                    [&_a]:text-blue-600 [&_a]:dark:text-blue-400
                    [&_img]:rounded-xl [&_img]:w-full
                    [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4 [&_blockquote]:italic
                    pb-16"
                  dangerouslySetInnerHTML={{ __html: sanitized }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
