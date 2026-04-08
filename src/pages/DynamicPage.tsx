import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { api } from '../lib/api';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { usePlyrInit } from '../hooks/usePlyrInit';

interface StaticPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: string;
  published: boolean;
  featuredImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  updatedAt: string;
}

export default function DynamicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<StaticPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { resolvedTheme } = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);

  usePlyrInit(contentRef, page?.content || '');

  useEffect(() => {
    if (slug) loadPage(slug);
  }, [slug]);

  useEffect(() => {
    if (page) {
      document.title = page.metaTitle || page.title;
      const desc = document.querySelector('meta[name="description"]');
      if (desc) desc.setAttribute('content', page.metaDescription || page.title);
    }
  }, [page]);

  const loadPage = async (pageSlug: string) => {
    setLoading(true);
    setNotFound(false);
    try {
      const data = await api.pages.get(pageSlug);
      if (!data || !data.published) {
        setNotFound(true);
      } else {
        setPage(data);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors">
        <div className="h-64 sm:h-80 bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-2/3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center transition-colors">
        <div className="text-center px-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Page not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The page you are looking for does not exist or is not published.
          </p>
          <Link
            to="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors font-medium"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!page) return null;

  const wordCount = page.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.round(wordCount / 200));
  const updatedDate = page.updatedAt
    ? new Date(page.updatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors">
      <div className="relative overflow-hidden" style={{ minHeight: page.featuredImage ? '340px' : '180px' }}>
        {page.featuredImage ? (
          <>
            <img
              src={page.featuredImage}
              alt={page.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {resolvedTheme === 'dark' ? (
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent" />
            )}
          </>
        ) : (
          <div
            className={`absolute inset-0 ${
              resolvedTheme === 'dark'
                ? 'bg-gradient-to-br from-gray-900 to-gray-800'
                : 'bg-gradient-to-br from-gray-100 to-gray-50'
            }`}
          />
        )}

        <div className="relative z-10 flex flex-col justify-end h-full px-4 sm:px-8 pb-10 pt-12 max-w-5xl mx-auto" style={{ minHeight: page.featuredImage ? '340px' : '180px' }}>
          <Link
            to="/"
            className={`inline-flex items-center gap-2 text-sm font-medium mb-4 transition-colors ${
              page.featuredImage
                ? 'text-white/80 hover:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <h1
            className={`text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-4 ${
              page.featuredImage
                ? 'text-white drop-shadow-lg'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {page.title}
          </h1>
          <div className={`flex flex-wrap items-center gap-4 text-sm ${
            page.featuredImage ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {updatedDate && (
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                Updated {updatedDate}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {readTime} min read
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-10 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 sm:p-10 transition-colors">
          <div
            ref={contentRef}
            className="article-content prose prose-sm sm:prose-base md:prose-lg max-w-none text-gray-700 dark:text-gray-300 [&_h1]:text-gray-900 [&_h1]:dark:text-white [&_h2]:text-gray-900 [&_h2]:dark:text-white [&_h3]:text-gray-900 [&_h3]:dark:text-white [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_img]:rounded-xl [&_img]:w-full [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_pre]:bg-gray-900 [&_pre]:rounded-lg [&_code]:text-blue-600 [&_code]:dark:text-blue-400"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(page.content, {
                ADD_TAGS: ['figure', 'figcaption', 'iframe'],
                ADD_ATTR: [
                  'class', 'target', 'rel', 'style',
                  'src', 'width', 'height',
                  'frameborder', 'allowfullscreen', 'allow',
                  'controls', 'playsinline', 'poster',
                ],
                ALLOW_DATA_ATTR: true,
                FORCE_BODY: true,
                FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
              }),
            }}
          />
        </div>
      </div>
    </div>
  );
}
