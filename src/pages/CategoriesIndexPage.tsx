import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { applyMeta } from '../lib/seo';
import { Folder, ArrowRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  postCount?: number;
}

export default function CategoriesIndexPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyMeta({
      title: 'Categories - Mayobe Bros',
      description: 'Browse all content categories on Mayobe Bros.',
      url: 'https://mayobebros.com/category',
    });
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await api.categories.list();
      setCategories(data || []);
    } catch (e) {
      console.error('Failed to load categories:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const COLORS = [
    'from-blue-600 to-blue-800',
    'from-emerald-600 to-emerald-800',
    'from-amber-600 to-amber-800',
    'from-rose-600 to-rose-800',
    'from-teal-600 to-teal-800',
    'from-cyan-600 to-cyan-800',
    'from-orange-600 to-orange-800',
    'from-green-600 to-green-800',
  ];

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Folder size={32} className="text-blue-400" />
            <h1 className="text-4xl md:text-5xl font-bold">Categories</h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Explore {categories.length} categories of articles and resources.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {categories.length === 0 ? (
          <div className="text-center py-20">
            <Folder size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No categories yet</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, i) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {cat.image ? (
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  </div>
                ) : (
                  <div className={`aspect-[16/10] bg-gradient-to-br ${COLORS[i % COLORS.length]} relative`}>
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                      <Folder size={120} />
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h2 className="text-xl font-bold mb-1 group-hover:text-blue-300 transition-colors">
                    {cat.name}
                  </h2>
                  {cat.description && (
                    <p className="text-sm text-gray-300 line-clamp-2">{cat.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3 text-sm text-gray-400 group-hover:text-white transition-colors">
                    <span>Browse articles</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
