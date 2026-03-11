import { Link } from 'react-router-dom';
import { Flame, Eye, TrendingUp, BarChart2, Clock } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  featuredImage?: string | null;
  featured_image?: string | null;
  categorySlug?: string;
  categoryName?: string;
  publishedAt?: string;
  published_at?: string;
  views: number;
  score?: number;
  views_1h?: number;
  views_24h?: number;
}

interface Props {
  posts: Post[];
}

function getImage(post: Post): string {
  return (
    post.featuredImage ||
    post.featured_image ||
    'https://images.pexels.com/photos/1591062/pexels-photo-1591062.jpeg?auto=compress&cs=tinysrgb&w=1200'
  );
}

function getDate(post: Post): string {
  return post.publishedAt || post.published_at || '';
}

export default function TrendingSection({ posts }: Props) {
  if (!posts || posts.length === 0) return null;

  const hero = posts[0];
  const rest = posts.slice(1, 6);
  const heroHot = (hero.views_1h || 0) > 0 || (hero.views_24h || 0) > 5;

  return (
    <section className="bg-gray-900 dark:bg-black py-14 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-orange-400">
              <Flame size={22} className="animate-pulse" />
              <span className="text-sm font-bold uppercase tracking-widest text-white">Trending Now</span>
            </div>
            <div className="h-px w-16 sm:w-32 bg-white/10" />
          </div>
          <Link
            to="/popular"
            className="flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors uppercase tracking-widest"
          >
            <BarChart2 size={13} />
            View All Popular
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <Link
              to={`/post/${hero.categorySlug}/${hero.slug}`}
              className="group relative block rounded-2xl overflow-hidden shadow-2xl"
              style={{ height: '420px' }}
            >
              <img
                src={getImage(hero)}
                alt={hero.title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide shadow-lg">
                  <TrendingUp size={12} />
                  #1 Trending
                </span>
                {heroHot && (
                  <span className="inline-flex items-center gap-1 bg-red-600/90 text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-lg">
                    <Flame size={10} className="animate-pulse" />
                    Hot
                  </span>
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                {hero.categoryName && (
                  <span className="inline-block bg-blue-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full mb-3">
                    {hero.categoryName}
                  </span>
                )}
                <h2 className="text-white font-black text-xl sm:text-2xl leading-snug mb-3 group-hover:text-blue-300 transition-colors line-clamp-3">
                  {hero.title}
                </h2>
                <div className="flex items-center gap-4 text-white/70 text-xs flex-wrap">
                  <span className="flex items-center gap-1">
                    <Eye size={12} />
                    {(hero.views || 0).toLocaleString()} total views
                  </span>
                  {(hero.views_24h || 0) > 0 && (
                    <span className="flex items-center gap-1 text-orange-300">
                      <TrendingUp size={11} />
                      {hero.views_24h} today
                    </span>
                  )}
                  {getDate(hero) && (
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(getDate(hero)).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-3">
            {rest.map((post, i) => {
              const isHot = (post.views_1h || 0) > 0 || (post.views_24h || 0) > 3;
              return (
                <Link
                  key={post.id}
                  to={`/post/${post.categorySlug}/${post.slug}`}
                  className="group flex gap-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all"
                >
                  <div className="flex-shrink-0 w-8 flex items-start pt-0.5">
                    <span className="text-2xl font-black text-white/20 group-hover:text-orange-400 transition-colors leading-none">
                      {i + 2}
                    </span>
                  </div>
                  <div className="relative w-20 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                    <img
                      src={getImage(post)}
                      alt={post.title}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {isHot && (
                      <div className="absolute top-0.5 right-0.5 bg-red-600 rounded-full p-0.5">
                        <Flame size={8} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-sm leading-snug line-clamp-2 group-hover:text-blue-300 transition-colors mb-1.5">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-2 text-white/40 text-xs flex-wrap">
                      <span className="flex items-center gap-1">
                        <Eye size={11} />
                        {(post.views || 0).toLocaleString()}
                      </span>
                      {(post.views_24h || 0) > 0 && (
                        <span className="flex items-center gap-1 text-orange-400/70">
                          <TrendingUp size={10} />
                          {post.views_24h} today
                        </span>
                      )}
                      {post.categoryName && (
                        <>
                          <span className="w-0.5 h-0.5 rounded-full bg-white/30" />
                          <span>{post.categoryName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
