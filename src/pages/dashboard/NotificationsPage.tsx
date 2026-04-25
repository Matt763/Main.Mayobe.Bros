import { Bell, CheckCheck, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationItem from '../../components/dashboard/NotificationItem';
import EmptyState from '../../components/dashboard/EmptyState';

export default function NotificationsPage() {
  const { items, loading, unreadCount, hasInterests, markAllRead } = useNotifications();

  return (
    <div className="space-y-6">
      <header className="hidden lg:flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
            Notifications
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {loading
              ? 'Loading…'
              : hasInterests === false
              ? 'Follow some topics to start getting notifications here.'
              : unreadCount > 0
              ? `${unreadCount} new since you last checked`
              : 'You are all caught up.'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </header>

      {/* Mobile mark-all row */}
      {unreadCount > 0 && (
        <div className="lg:hidden flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {unreadCount} new
          </p>
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 cursor-pointer"
          >
            <CheckCheck size={12} />
            Mark all read
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse"
            />
          ))}
        </div>
      ) : hasInterests === false ? (
        <EmptyState
          icon={Sparkles}
          title="Follow topics to get notified"
          description="Notifications are tied to the categories you follow. Pick your interests and we'll ping you here when new articles drop."
          action={
            <Link
              to="/dashboard/interests"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            >
              Choose interests
              <ArrowRight size={14} />
            </Link>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No new posts in the last 30 days"
          description="We'll show fresh articles from your followed categories here. Check back soon."
        />
      ) : (
        <ul className="space-y-3">
          {items.map(item => (
            <li key={item.post_id}>
              <NotificationItem item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
