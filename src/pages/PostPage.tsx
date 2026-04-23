import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Calendar, User, ArrowLeft, Clock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function PostPage() {
  const { categorySlug, labelSlug, postSlug } = useParams();
  const [post, setPost] = useState<any | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    loadPost();
  }, [categorySlug, labelSlug, postSlug]);

  const loadPost = async () => {
    const [categoriesData, labelsData, postsData] = await Promise.all([
      api.categories.list(),
      api.labels.list(),
      api.posts.list({ category: categorySlug }),
    ]);

    const cat = (categoriesData || []).find((c: any) => c.slug === categorySlug);
    if (!cat) return;

    let post = (postsData || []).find((p: any) => p.slug === postSlug);
    if (!post) return;

    const label = labelSlug
      ? (labelsData || []).find((l: any) => l.slug === labelSlug && l.categoryId === cat.id)
      : null;

    const postWithMeta = {
      ...post,
      featured_image: post.featuredImage,
      published_at: post.publishedAt,
      category: cat,
      label: label || null,
    };
    setPost(postWithMeta as any);

    // Update views
    api.posts.trackView(post.slug).catch(() => {});

    // Related posts
    const related = (postsData || [])
      .filter((p: any) => p.id !== post.id)
      .slice(0, 3)
      .map((p: any) => ({ ...p, featured_image: p.featuredImage, category: cat }));
    setRelatedPosts(related as any);
  };

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 dark:text-gray-400 transition-colors">Loading...</p>
      </div>
    );
  }

  const readingMinutes = Math.max(1, Math.round(
    (post.content || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 200
  ));

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      {/* Hero section - mirrors homepage hero style */}
      <section className="relative flex items-end overflow-hidden" style={{ height: 'clamp(420px, 60vw, 720px)' }}>
        {post.featured_image ? (
          <div
            className="absolute inset-0 bg-cover bg-center scale-[1.02] transition-transform duration-700"
            style={{ backgroundImage: `url(${post.featured_image})`, backgroundPosition: 'center 40%' }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-400 dark:from-gray-800 dark:to-gray-900" />
        )}

        {resolvedTheme === 'dark' ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white to-transparent" />
          </>
        )}

        <div className="relative z-10 w-full container mx-auto px-4 sm:px-6 md:px-8 max-w-4xl pb-8 sm:pb-12 md:pb-16">
          <Link
            to={`/category/${post.category.slug}${post.label ? `/${post.label.slug}` : ''}`}
            className={`inline-flex items-center gap-2 mb-4 transition-colors text-sm font-medium min-h-[44px] ${
              resolvedTheme === 'dark'
                ? 'text-white/80 hover:text-white'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <ArrowLeft size={18} />
            Back to {post.label?.name || post.category.name}
          </Link>

          <span className={`inline-block px-4 py-1 rounded-full text-xs font-semibold tracking-wider uppercase mb-4 ${
            resolvedTheme === 'dark'
              ? 'bg-blue-600/80 text-white'
              : 'bg-blue-600 text-white'
          }`}>
            {post.category.name}{post.label && ` • ${post.label.name}`}
          </span>

          <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-tight mb-4 max-w-3xl ${
            resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {post.title}
          </h1>

          <div className={`flex flex-wrap gap-3 sm:gap-5 text-sm ${
            resolvedTheme === 'dark' ? 'text-white/80' : 'text-gray-600'
          }`}>
            <div className="flex items-center gap-1.5">
              <User size={15} />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={15} />
              <span>{readingMinutes} min read</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={15} />
              <span className="hidden sm:inline">{new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span className="sm:hidden">{new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </section>

      <article className="container mx-auto px-4 py-8 max-w-4xl">
        <div
          className="prose prose-lg max-w-none mb-12 text-gray-700 dark:text-gray-300 [&_h1]:text-gray-900 [&_h1]:dark:text-white [&_h2]:text-gray-900 [&_h2]:dark:text-white [&_h3]:text-gray-900 [&_h3]:dark:text-white [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_img]:rounded-xl [&_img]:w-full [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4 [&_blockquote]:italic"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {relatedPosts.length > 0 && (
        <section className="bg-gray-50 dark:bg-gray-900 py-16 transition-colors">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 transition-colors">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  to={`/post/${relatedPost.category.slug}/${relatedPost.slug}`}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl dark:hover:shadow-2xl transition-all"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={relatedPost.featured_image || 'https://images.pexels.com/photos/1591062/pexels-photo-1591062.jpeg?auto=compress&cs=tinysrgb&w=800'}
                      alt={relatedPost.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {relatedPost.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
