import { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category_slug: string;
  label_slug?: string;
  views: number;
}

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const searchPosts = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('posts')
        .select('id, title, slug, excerpt, category_slug, label_slug, views')
        .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`)
        .eq('published', true)
        .order('views', { ascending: false })
        .limit(5);

      if (data) {
        setResults(data);
      }
      setLoading(false);
    };

    const debounce = setTimeout(searchPosts, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search
          size={20}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search articles..."
          className="w-full md:w-64 lg:w-80 pl-10 pr-10 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full md:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50">
          {loading && (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Searching...</p>
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="p-8 text-center">
              <Search size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-600 dark:text-gray-400">No results found for "{query}"</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Search Results
              </div>
              {results.map((result) => (
                <Link
                  key={result.id}
                  to={
                    result.label_slug
                      ? `/post/${result.category_slug}/${result.label_slug}/${result.slug}`
                      : `/post/${result.category_slug}/${result.slug}`
                  }
                  onClick={() => {
                    handleSearch(query);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-l-2 border-transparent hover:border-blue-500"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-1">
                        {result.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {result.excerpt}
                      </p>
                    </div>
                    {result.views > 1000 && (
                      <TrendingUp size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!query && recentSearches.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Recent Searches
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(search)}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <Clock size={16} className="text-gray-400 dark:text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">{search}</span>
                </button>
              ))}
            </div>
          )}

          {!query && recentSearches.length === 0 && (
            <div className="p-8 text-center">
              <Search size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Start typing to search articles
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
