import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { applyMeta, buildCategoryMeta } from '../lib/seo';
import Pagination, { getPageSize, useIsMobile } from '../components/Pagination';
import Reveal from '../components/Reveal';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  featuredImage?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
}
interface Label { id: string; name: string; slug: string; categoryId?: string; description?: string; }

const CATEGORY_IMAGES: Record<string, string> = {
  technology: 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=1920',
  tech: 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=1920',
  business: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1920',
  finance: 'https://images.pexels.com/photos/3483098/pexels-photo-3483098.jpeg?auto=compress&cs=tinysrgb&w=1920',
  health: 'https://images.pexels.com/photos/3768914/pexels-photo-3768914.jpeg?auto=compress&cs=tinysrgb&w=1920',
  lifestyle: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1920',
  travel: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=1920',
  food: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1920',
  sports: 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1920',
  entertainment: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1920',
  science: 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=1920',
  education: 'https://images.pexels.com/photos/159844/cellular-education-classroom-159844.jpeg?auto=compress&cs=tinysrgb&w=1920',
  politics: 'https://images.pexels.com/photos/1550337/pexels-photo-1550337.jpeg?auto=compress&cs=tinysrgb&w=1920',
  culture: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=1920',
  nature: 'https://images.pexels.com/photos/4350050/pexels-photo-4350050.jpeg?auto=compress&cs=tinysrgb&w=1920',
  fashion: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=1920',
  automotive: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=1920',
  real: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1920',
  music: 'https://images.pexels.com/photos/164693/pexels-photo-164693.jpeg?auto=compress&cs=tinysrgb&w=1920',
  art: 'https://images.pexels.com/photos/1269968/pexels-photo-1269968.jpeg?auto=compress&cs=tinysrgb&w=1920',
};

const FALLBACK_IMAGES = [
  'https://images.pexels.com/photos/1591062/pexels-photo-1591062.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'https://images.pexels.com/photos/3768914/pexels-photo-3768914.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1920',
];

function getCategoryImage(slug: string): string {
  const lower = slug.toLowerCase();
  for (const key of Object.keys(CATEGORY_IMAGES)) {
    if (lower.includes(key)) return CATEGORY_IMAGES[key];
  }
  const hash = slug.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return FALLBACK_IMAGES[hash % FALLBACK_IMAGES.length];
}

export default function CategoryPage() {
  const { categorySlug, labelSlug } = useParams();
  const location = useLocation();
  const [posts, setPosts] = useState<any[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [label, setLabel] = useState<Label | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { resolvedTheme } = useTheme();
  const isMobile = useIsMobile();
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const active = label || category;
    if (active) {
      applyMeta(buildCategoryMeta(active, location.pathname));
    }
  }, [category, label, location.pathname]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setLabel(null);
    setCurrentPage(1);
    loadData();
  }, [categorySlug, labelSlug]);

  useEffect(() => {
    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!heroRef.current) return;
        const scrollY = window.scrollY;
        const bg = heroRef.current.querySelector('.hero-bg') as HTMLElement;
        if (bg) bg.style.transform = `scale(1.02) translateY(${scrollY * 0.3}px)`;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const loadData = async () => {
    try {
      const [categoriesData, labelsData, postsData] = await Promise.all([
        api.categories.list(),
        api.labels.list(),
        api.posts.list({ category: categorySlug, label: labelSlug }),
      ]);

      const cat = (categoriesData || []).find((c: any) => c.slug === categorySlug);
      if (!cat) {
        setError('Category not found.');
        return;
      }
      setCategory(cat);

      const catLabels = (labelsData || []).filter((l: any) => l.categoryId === cat.id);
      setLabels(catLabels);

      if (labelSlug) {
        const lbl = catLabels.find((l: any) => l.slug === labelSlug);
        if (lbl) setLabel(lbl);
      }

      const mapped = (postsData || []).map((p: any) => ({
        ...p,
        featured_image: p.featuredImage,
        published_at: p.publishedAt,
        is_popular: p.isPopular,
        category: cat,
        labelSlug: p.labelSlug,
      }));
      setPosts(mapped);
    } catch (err) {
      console.error('Error loading category data:', err);
      setError('Failed to load content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black transition-colors">
        <div className="relative overflow-hidden" style={{ height: '600px' }}>
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-72 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center transition-colors">
        <div className="text-center px-4">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{error}</h2>
          <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!category) return null;

  const heroImage = category.featuredImage || getCategoryImage(category.slug);
  const activeLabel = label;

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      <section
        ref={heroRef}
        className="relative flex items-center justify-center overflow-hidden"
        style={{ height: '600px' }}
      >
        <div
          className="hero-bg absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundPosition: 'center 40%',
            transform: 'scale(1.02)',
          }}
        />

        {resolvedTheme === 'dark' ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white to-transparent" />
          </>
        )}

        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-8">
          <div className="flex flex-col items-center text-center gap-4">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase border backdrop-blur-sm ${
              resolvedTheme === 'dark'
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-black/10 border-black/20 text-gray-800'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              {activeLabel ? category.name : 'Category'}
            </div>

            <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[0.9] tracking-tight ${
              resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {activeLabel ? activeLabel.name : category.name}
            </h1>

            <p className={`text-base sm:text-lg max-w-xl leading-relaxed font-light ${
              resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {activeLabel
                ? (activeLabel.description || `Explore all posts under ${activeLabel.name}`)
                : (category.description || `Discover curated content and insights in ${category.name}`)
              }
            </p>
          </div>
        </div>
      </section>

      {labels.length > 0 && (
        <Reveal as="section" type="down" className={`sticky top-0 z-30 border-b transition-colors ${
          resolvedTheme === 'dark'
            ? 'bg-black/95 backdrop-blur-xl border-white/10'
            : 'bg-white/95 backdrop-blur-xl border-gray-200 shadow-sm'
        }`}>
          <div className="container mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-3 sm:py-4 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
              <Link
                to={`/category/${categorySlug}`}
                className={`flex-none px-4 sm:px-5 py-2 rounded-full font-semibold text-sm transition-all whitespace-nowrap ${
                  !labelSlug
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : resolvedTheme === 'dark'
                      ? 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                All Posts
              </Link>
              {labels.map((lbl) => (
                <Link
                  key={lbl.id}
                  to={`/category/${categorySlug}/${lbl.slug}`}
                  className={`flex-none px-4 sm:px-5 py-2 rounded-full font-semibold text-sm transition-all whitespace-nowrap ${
                    labelSlug === lbl.slug
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : resolvedTheme === 'dark'
                        ? 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                >
                  {lbl.name}
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      <Reveal as="section" type="up" className="container mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-14 md:py-16">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <span className="text-3xl">📝</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No posts yet</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {labelSlug
                ? `No posts found under this label. Try viewing all posts in ${category.name}.`
                : `No posts published in ${category.name} yet.`
              }
            </p>
            {labelSlug && (
              <Link
                to={`/category/${categorySlug}`}
                className="inline-flex items-center gap-2 mt-4 text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                View all {category.name} posts
              </Link>
            )}
          </div>
        ) : (() => {
          const pageSize = getPageSize(isMobile);
          const startIdx = (currentPage - 1) * pageSize;
          const paginatedPosts = posts.slice(startIdx, startIdx + pageSize);

          return (
            <>
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                    {activeLabel ? activeLabel.name : `All ${category.name} Posts`}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {posts.length} {posts.length === 1 ? 'post' : 'posts'} found
                  </p>
                </div>
              </div>

              <Reveal stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                {paginatedPosts.map((post, index) => (
                  <Link
                    key={post.id}
                    to={`/post/${post.category.slug}${post.labelSlug ? `/${post.labelSlug}` : ''}/${post.slug}`}
                    className="group bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-black/50 transition-all transform hover:-translate-y-1 duration-300"
                  >
                    <div className="relative overflow-hidden" style={{ height: '200px' }}>
                      <img
                        src={post.featured_image || getCategoryImage(category.slug)}
                        alt={post.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {post.is_popular && (
                        <div className="absolute top-3 right-3 bg-amber-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-md">
                          Popular
                        </div>
                      )}
                      {post.labelName && (
                        <div className="absolute top-3 left-3 bg-blue-600/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                          {post.labelName}
                        </div>
                      )}
                    </div>
                    <div className="p-5 sm:p-6">
                      <h3 className={`text-base sm:text-lg font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug ${
                        resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4 leading-relaxed">
                        {post.excerpt || (post.content ? post.content.replace(/<[^>]+>/g, '').substring(0, 150) + '...' : '')}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                        <span>{new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>{(post.views || 0).toLocaleString()} views</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </Reveal>

              <Reveal type="up" delay={100}>
              <Pagination
                totalItems={posts.length}
                currentPage={currentPage}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
              </Reveal>
            </>
          );
        })()}
      </Reveal>
    </div>
  );
}
