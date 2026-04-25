import { Link } from 'react-router-dom';
import { Bookmark, ArrowRight, AlertCircle } from 'lucide-react';
import { useSavedPostsList } from '../../hooks/useSavedPosts';
import SavedPostCard from '../../components/dashboard/SavedPostCard';
import EmptyState from '../../components/dashboard/EmptyState';

export default function SavedPostsPage() {
  const { items, loading, error, remove } = useSavedPostsList();

  return (
    <div className="space-y-6">
      <header className="hidden lg:block">
        <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Saved</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {loading
            ? 'Loading your saved articles…'
            : items.length === 0
            ? 'Articles you bookmark will appear here.'
            : `${items.length} ${items.length === 1 ? 'article' : 'articles'} saved`}
        </p>
      </header>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-start gap-3">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
            >
              <div className="aspect-[16/9] bg-gray-100 dark:bg-gray-800 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved articles yet"
          description="Tap the bookmark icon on any article to save it here. Your reading list lives here, ad-free."
          action={
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            >
              Browse articles
              <ArrowRight size={14} />
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <SavedPostCard key={item.post_id} item={item} onRemove={remove} />
          ))}
        </div>
      )}
    </div>
  );
}
