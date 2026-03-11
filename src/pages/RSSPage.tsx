import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Rss, Copy, Check, ExternalLink, Calendar, User } from 'lucide-react';
import { api } from '../lib/api';
import { useSiteSettings } from '../hooks/useSiteSettings';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  categorySlug: string;
  labelSlug?: string;
  author?: string;
  publishedAt?: string;
  createdAt?: string;
  published: boolean;
}

export default function RSSPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { settings } = useSiteSettings();

  const feedUrl = `${window.location.origin}/feed.xml`;

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.posts.list({ limit: 20 });
        setPosts((data?.posts || []).filter((p: Post) => p.published !== false));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const copyFeedUrl = () => {
    navigator.clipboard.writeText(feedUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const rssApps = [
    { name: 'Feedly', url: `https://feedly.com/i/subscription/feed/${encodeURIComponent(feedUrl)}`, color: 'bg-green-500' },
    { name: 'Inoreader', url: `https://www.inoreader.com/feed/${encodeURIComponent(feedUrl)}`, color: 'bg-blue-500' },
    { name: 'NewsBlur', url: `https://newsblur.com/?url=${encodeURIComponent(feedUrl)}`, color: 'bg-orange-500' },
    { name: 'The Old Reader', url: `https://theoldreader.com/feeds/subscribe?url=${encodeURIComponent(feedUrl)}`, color: 'bg-gray-600' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <Link to="/" className="inline-flex items-center gap-2 text-orange-100 hover:text-white transition-colors mb-6 text-sm">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Rss size={24} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">RSS Feed</h1>
          </div>
          <p className="text-orange-100 text-sm max-w-xl">
            Subscribe to {settings.site_title || 'Mayobe Bros'} in your favourite RSS reader to get the latest articles delivered directly.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-4xl py-12 sm:py-16 space-y-12">
        <section className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Your RSS Feed URL</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Copy this URL and paste it into any RSS reader app.</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 overflow-hidden">
              <Rss size={15} className="text-orange-500 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300 font-mono truncate">{feedUrl}</span>
            </div>
            <button
              onClick={copyFeedUrl}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">Subscribe with an RSS App</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {rssApps.map(({ name, url, color }) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-orange-200 dark:hover:border-orange-800 hover:shadow-md transition-all group"
              >
                <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
                  <Rss size={18} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{name}</span>
                <ExternalLink size={12} className="text-gray-300 dark:text-gray-600 group-hover:text-orange-400 transition-colors" />
              </a>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">Latest Articles in Feed</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <p className="text-gray-400 text-center py-10">No articles available yet.</p>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to={post.labelSlug
                    ? `/post/${post.categorySlug}/${post.labelSlug}/${post.slug}`
                    : `/post/${post.categorySlug}/${post.slug}`}
                  className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-orange-200 dark:hover:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/10 group transition-all"
                >
                  <div className="flex-shrink-0 w-9 h-9 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mt-0.5">
                    <Rss size={16} className="text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors leading-snug mb-1 line-clamp-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">{post.excerpt}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                      {(post.publishedAt || post.createdAt) && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {formatDate(post.publishedAt || post.createdAt)}
                        </span>
                      )}
                      {post.author && (
                        <span className="flex items-center gap-1">
                          <User size={11} />
                          {post.author}
                        </span>
                      )}
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-orange-400 transition-colors flex-shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">What is RSS?</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            RSS (Really Simple Syndication) is a web feed format that allows you to subscribe to your favourite websites and receive new content automatically, without having to visit each site individually. Use an RSS reader app to follow {settings.site_title || 'Mayobe Bros'} and never miss a post.
          </p>
        </section>
      </div>
    </div>
  );
}
