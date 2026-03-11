import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { applyMeta } from '../lib/seo';
import { Grid3x3 as Grid3X3, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  categorySlug: string;
  categoryName: string;
  labelSlug?: string;
  publishedAt: string;
  views: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const PAGE_SIZE = 50;

export default function PostsDirectoryPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    applyMeta({
      title: 'All Posts - Mayobe Bros',
      description: 'Browse all articles and posts on Mayobe Bros.',
      url: 'https://mayobebros.com/post',
    });
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await api.posts.list({ status: 'published' });
      setPosts(shuffle(data || []));
    } catch (e) {
      console.error('Failed to load posts:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    const q = searchQuery.toLowerCase();
    return posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.categoryName?.toLowerCase().includes(q) ||
      stripHtml(p.excerpt || p.content || '').toLowerCase().includes(q)
    );
  }, [posts, searchQuery]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Grid3X3 size={32} className="text-blue-400" />
            <h1 className="text-4xl md:text-5xl font-bold">All Posts</h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Browse {posts.length} articles across all categories.
          </p>
          <div className="mt-8 max-w-xl mx-auto relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur"
            />
          </div>
          {searchQuery && (
            <p className="mt-3 text-gray-400 text-sm">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {paginated.length === 0 ? (
          <div className="text-center py-20">
            <Filter size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No posts found</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Try adjusting your search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginated.map((post) => {
              const desc = post.excerpt || stripHtml(post.content || '').slice(0, 150);
              const postUrl = post.labelSlug
                ? `/post/${post.categorySlug}/${post.labelSlug}/${post.slug}`
                : `/post/${post.categorySlug}/${post.slug}`;

              return (
                <Link
                  key={post.id}
                  to={postUrl}
                  className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {post.featuredImage ? (
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Grid3X3 size={40} className="text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    {post.categoryName && (
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        {post.categoryName}
                      </span>
                    )}
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                      {desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-1 mt-12">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <div className="flex items-center gap-1 mx-2">
              {getPageNumbers().map((p, i) => (
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 py-2 text-gray-400 dark:text-gray-500">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`min-w-[40px] h-10 rounded-lg text-sm font-medium transition-colors ${
                      page === p
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {p}
                  </button>
                )
              ))}
            </div>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
