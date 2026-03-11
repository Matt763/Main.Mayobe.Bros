import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { applyMeta } from '../lib/seo';
import { Tag, ArrowRight } from 'lucide-react';

interface Label {
  id: string;
  name: string;
  slug: string;
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function LabelsIndexPage() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyMeta({
      title: 'Labels - Mayobe Bros',
      description: 'Browse all content labels and tags on Mayobe Bros.',
      url: 'https://mayobebros.com/label',
    });
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [labelsData, catsData] = await Promise.all([
        api.labels.list(),
        api.categories.list(),
      ]);
      setLabels(labelsData || []);
      setCategories(catsData || []);
    } catch (e) {
      console.error('Failed to load labels:', e);
    } finally {
      setLoading(false);
    }
  };

  const grouped = categories
    .map(cat => ({
      ...cat,
      labels: labels.filter(l => l.categoryId === cat.id),
    }))
    .filter(g => g.labels.length > 0);

  const uncategorized = labels.filter(l => !l.categoryId || !categories.find(c => c.id === l.categoryId));

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
            <Tag size={32} className="text-blue-400" />
            <h1 className="text-4xl md:text-5xl font-bold">Labels</h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Browse {labels.length} labels across all categories.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {labels.length === 0 ? (
          <div className="text-center py-20">
            <Tag size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No labels yet</h3>
          </div>
        ) : (
          <div className="space-y-10">
            {grouped.map(group => (
              <div key={group.id}>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span>{group.name}</span>
                  <span className="text-sm font-normal text-gray-400 dark:text-gray-500">
                    ({group.labels.length} label{group.labels.length !== 1 ? 's' : ''})
                  </span>
                </h2>
                <div className="flex flex-wrap gap-3">
                  {group.labels.map(label => (
                    <Link
                      key={label.id}
                      to={`/category/${group.slug}/${label.slug}`}
                      className="group inline-flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all"
                    >
                      <Tag size={14} className="text-blue-500" />
                      <span className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {label.name}
                      </span>
                      <ArrowRight size={14} className="text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {uncategorized.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Other Labels</h2>
                <div className="flex flex-wrap gap-3">
                  {uncategorized.map(label => (
                    <Link
                      key={label.id}
                      to={label.categorySlug ? `/category/${label.categorySlug}/${label.slug}` : `/label/${label.slug}`}
                      className="group inline-flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all"
                    >
                      <Tag size={14} className="text-gray-400" />
                      <span className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {label.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
