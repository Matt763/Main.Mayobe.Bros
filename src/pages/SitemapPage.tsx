import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Map, ChevronRight, Folder, Tag, FileText, Info, ExternalLink, Globe } from 'lucide-react';
import { api } from '../lib/api';

interface Category { id: string; name: string; slug: string; }
interface Label { id: string; name: string; slug: string; categoryId: string; }
interface Post { id: string; title: string; slug: string; categorySlug: string; labelSlug?: string; published: boolean; }

const XML_SITEMAPS = [
  { label: 'Sitemap Index',       href: '/sitemap.xml',              desc: 'Master index of all sitemaps' },
  { label: 'Pages Sitemap',       href: '/authoritative-sitemap.xml', desc: 'Homepage, about, policies' },
  { label: 'Posts Sitemap',       href: '/posts-sitemap1.xml',        desc: 'All published articles' },
  { label: 'Categories Sitemap',  href: '/category-sitemap1.xml',     desc: 'Categories & topic labels' },
  { label: 'Image Sitemap',       href: '/image-sitemap1.xml',        desc: 'All post images' },
  { label: 'Video Sitemap',       href: '/video-sitemap1.xml',        desc: 'Embedded videos' },
];

export default function SitemapPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [cats, labs, postsData] = await Promise.all([
          api.categories.list(),
          api.labels.list(),
          api.posts.list({ limit: 200 }),
        ]);
        setCategories(cats || []);
        setLabels(labs || []);
        setPosts((postsData?.posts || []).filter((p: Post) => p.published !== false));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const labelsByCategory = labels.reduce<Record<string, Label[]>>((acc, l) => {
    if (!acc[l.categoryId]) acc[l.categoryId] = [];
    acc[l.categoryId].push(l);
    return acc;
  }, {});

  const postsByCategory = posts.reduce<Record<string, Post[]>>((acc, p) => {
    if (!acc[p.categorySlug]) acc[p.categorySlug] = [];
    acc[p.categorySlug].push(p);
    return acc;
  }, {});

  const staticPages = [
    { label: 'Home',                 to: '/' },
    { label: 'Popular Posts',        to: '/popular' },
    { label: 'About Us',             to: '/about' },
    { label: 'Contact Us',           to: '/contact' },
    { label: 'Sign In',              to: '/signin' },
    { label: 'Sign Up',              to: '/signup' },
    { label: 'Jobs',                 to: '/jobs' },
    { label: 'Upgrade to Premium',   to: '/upgrade' },
    { label: 'Advertise With Us',    to: '/advertise' },
    { label: 'Privacy Policy',       to: '/privacy-policy' },
    { label: 'Terms of Service',     to: '/terms-of-service' },
    { label: 'Cookie Policy',        to: '/cookie-policy' },
    { label: 'Cache Policy',         to: '/cache-policy' },
    { label: 'RSS Feed',             to: '/rss' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <Link to="/" className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-6 text-sm">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Map size={24} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Sitemap</h1>
          </div>
          <p className="text-blue-100 text-sm">A complete index of all pages and content on Mayobe Bros.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-5xl py-12 sm:py-16">
        {/* XML Sitemaps for Search Engines */}
        <section className="mb-12">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Globe size={16} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">XML Sitemaps</h2>
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">for search engines</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {XML_SITEMAPS.map(({ label, href, desc }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 px-4 py-3 bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900 hover:border-green-300 dark:hover:border-green-700 group transition-all"
              >
                <ExternalLink size={14} className="text-green-500 group-hover:text-green-600 transition-colors flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">{label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{desc}</div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-12">
            <section>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Info size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Static Pages</h2>
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{staticPages.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {staticPages.map(({ label, to }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 group transition-all"
                  >
                    <ChevronRight size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{label}</span>
                  </Link>
                ))}
              </div>
            </section>

            {categories.map((cat) => {
              const catLabels = labelsByCategory[cat.id] || [];
              const catPosts = postsByCategory[cat.slug] || [];
              return (
                <section key={cat.id}>
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Folder size={16} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <Link
                      to={`/category/${cat.slug}`}
                      className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {cat.name}
                    </Link>
                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{catPosts.length} posts</span>
                  </div>

                  {catLabels.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {catLabels.map((lbl) => (
                        <Link
                          key={lbl.id}
                          to={`/category/${cat.slug}/${lbl.slug}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors border border-blue-100 dark:border-blue-800"
                        >
                          <Tag size={11} />
                          {lbl.name}
                        </Link>
                      ))}
                    </div>
                  )}

                  {catPosts.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {catPosts.map((post) => (
                        <Link
                          key={post.id}
                          to={post.labelSlug
                            ? `/post/${post.categorySlug}/${post.labelSlug}/${post.slug}`
                            : `/post/${post.categorySlug}/${post.slug}`}
                          className="flex items-start gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 group transition-all"
                        >
                          <FileText size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug line-clamp-2">{post.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {catPosts.length === 0 && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">No published posts yet.</p>
                  )}
                </section>
              );
            })}

            {categories.length === 0 && (
              <p className="text-gray-400 text-center py-10">No categories found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
