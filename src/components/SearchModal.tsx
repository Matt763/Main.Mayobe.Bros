import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, TrendingUp, Clock } from 'lucide-react';
import { api } from '../lib/api';

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featuredImage: string | null;
  views: number;
  categorySlug: string;
  categoryName: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      const recent = localStorage.getItem('recentSearches');
      if (recent) {
        setRecentSearches(JSON.parse(recent));
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      const [postsData, categoriesData] = await Promise.all([
        api.posts.list({ search: searchQuery }),
        api.categories.list(),
      ]);
      const catMap = new Map((categoriesData || []).map((c: any) => [c.id, c]));
      const mappedResults = (postsData || []).slice(0, 6).map((p: any) => {
        const cat = catMap.get(p.categoryId);
        return {
          id: p.id,
          title: p.title,
          slug: p.slug,
          content: p.content || '',
          excerpt: p.excerpt || null,
          featuredImage: p.featuredImage || null,
          views: p.views || 0,
          categorySlug: cat?.slug || '',
          categoryName: cat?.name || '',
        };
      });
      setResults(mappedResults);
      setLoading(false);
    };

    const debounce = setTimeout(handleSearch, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSearchSubmit = (query: string) => {
    if (!query.trim()) return;

    const recent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(recent);
    localStorage.setItem('recentSearches', JSON.stringify(recent));
  };

  const handleClose = () => {
    setSearchQuery('');
    setResults([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      <div className="absolute top-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-2xl transition-transform">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit(searchQuery)}
                placeholder="Search posts, topics, or keywords..."
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none text-gray-900 dark:text-gray-100 text-lg"
              />
              {loading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <button
              onClick={handleClose}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close search"
            >
              <X size={24} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {searchQuery.trim().length < 2 && recentSearches.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                  <Clock size={16} />
                  Recent Searches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setSearchQuery(search)}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {results.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                  <TrendingUp size={16} />
                  Search Results ({results.length})
                </h3>
                <div className="space-y-3">
                  {results.map((post) => (
                    <Link
                      key={post.id}
                      to={`/post/${post.categorySlug}/${post.slug}`}
                      onClick={() => {
                        handleSearchSubmit(searchQuery);
                        handleClose();
                      }}
                      className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                    >
                      {post.featuredImage && (
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            {post.categoryName}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {post.views} views
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                          {post.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {post.excerpt || post.content.substring(0, 120)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {searchQuery.trim().length >= 2 && results.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try different keywords or browse our categories
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
