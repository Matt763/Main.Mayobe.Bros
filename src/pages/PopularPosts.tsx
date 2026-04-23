import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { TrendingUp } from 'lucide-react';
import { applyMeta, buildStaticMeta } from '../lib/seo';

export default function PopularPosts() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    applyMeta(buildStaticMeta(
      'Popular Articles',
      'Discover the most-read and trending articles on Mayobe Bros. Explore top stories across education, business, technology, and more.',
      '/popular',
    ));
    loadPopularPosts();
  }, []);

  const loadPopularPosts = async () => {
    const [postsData, categoriesData] = await Promise.all([
      api.posts.list(),
      api.categories.list(),
    ]);
    const catMap = new Map((categoriesData || []).map((c: any) => [c.id, c]));
    const posts = (postsData || [])
      .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
      .slice(0, 12)
      .map((p: any) => {
        const cat = catMap.get(p.categoryId);
        return {
          ...p,
          featured_image: p.featuredImage,
          published_at: p.publishedAt,
          category: cat || { slug: '', name: '' },
        };
      });
    setPosts(posts);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      <section className="bg-gradient-to-r from-yellow-500 to-orange-600 dark:from-yellow-600 dark:to-orange-700 text-white py-12 sm:py-16 md:py-20 transition-colors">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 text-center">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <TrendingUp size={32} className="sm:w-10 sm:h-10" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Popular Posts</h1>
          </div>
          <p className="text-base sm:text-lg md:text-xl text-orange-100 dark:text-orange-200 max-w-3xl mx-auto">
            Our most-read and trending articles across all categories
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16">
        {posts.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg transition-colors">No popular posts available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {posts.map((post, index) => (
              <Link
                key={post.id}
                to={`/post/${post.category.slug}/${post.slug}`}
                className="group bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl dark:hover:shadow-2xl transition-all transform hover:-translate-y-1"
              >
                <div className="relative h-40 sm:h-48 overflow-hidden">
                  <img
                    src={post.featured_image || 'https://images.pexels.com/photos/1591062/pexels-photo-1591062.jpeg?auto=compress&cs=tinysrgb&w=800'}
                    alt={post.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-yellow-500 dark:bg-yellow-600 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                    #{index + 1}
                  </div>
                  <div className="absolute top-3 right-3 bg-blue-600 dark:bg-blue-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-semibold">
                    {post.category.name}
                  </div>
                </div>
                <div className="p-4 sm:p-5 md:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 line-clamp-3 mb-3 sm:mb-4 transition-colors leading-relaxed">
                    {post.excerpt || post.content.substring(0, 150) + '...'}
                  </p>
                  <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400 transition-colors">
                    <span>{new Date(post.published_at).toLocaleDateString()}</span>
                    <span>{new Date(post.published_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
