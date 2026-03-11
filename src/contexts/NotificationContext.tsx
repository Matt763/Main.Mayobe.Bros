import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useRole } from '../hooks/useRole';

interface NotificationCounts {
  comments: number;
  subscribers: number;
  publishers: number;
  reviews: number;
  posts: number;
  pages: number;
  messages: number;
}

interface NotificationContextType {
  counts: NotificationCounts;
  total: number;
  markSeen: (type: keyof NotificationCounts) => Promise<void>;
  refresh: () => Promise<void>;
}

const defaultCounts: NotificationCounts = {
  comments: 0, subscribers: 0, publishers: 0, reviews: 0, posts: 0, pages: 0, messages: 0,
};

const NotificationContext = createContext<NotificationContextType>({
  counts: defaultCounts,
  total: 0,
  markSeen: async () => {},
  refresh: async () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isCEO, isAdmin } = useRole();
  const [counts, setCounts] = useState<NotificationCounts>(defaultCounts);
  const [lastSeenMap, setLastSeenMap] = useState<Record<string, string>>({});

  const fetchCounts = async () => {
    if (!user) return;

    const { data: seenRows } = await supabase
      .from('cms_notifications')
      .select('type, last_seen_at')
      .eq('user_id', user.id);

    const seen: Record<string, string> = {};
    for (const row of seenRows || []) {
      seen[row.type] = row.last_seen_at;
    }
    setLastSeenMap(seen);

    const epoch = '1970-01-01T00:00:00Z';

    const [
      { count: commentsCount },
      { count: subsCount },
      { count: pubsCount },
      { count: reviewsCount },
      { count: postsCount },
      { count: pagesCount },
      { count: messagesCount },
    ] = await Promise.all([
      supabase.from('comments').select('*', { count: 'exact', head: true })
        .gte('created_at', seen['comments'] || epoch)
        .eq('status', 'pending'),
      supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true })
        .gte('created_at', seen['subscribers'] || epoch),
      (isCEO
        ? supabase.from('admin_users').select('*', { count: 'exact', head: true })
            .gte('created_at', seen['publishers'] || epoch)
            .neq('role', 'ceo')
        : Promise.resolve({ count: 0 })),
      supabase.from('reviews').select('*', { count: 'exact', head: true })
        .gte('created_at', seen['reviews'] || epoch)
        .eq('status', 'pending'),
      supabase.from('posts').select('*', { count: 'exact', head: true })
        .gte('created_at', seen['posts'] || epoch),
      supabase.from('pages').select('*', { count: 'exact', head: true })
        .gte('created_at', seen['pages'] || epoch),
      (isCEO
        ? supabase.from('contact_submissions').select('*', { count: 'exact', head: true })
            .eq('type', 'advertising')
            .eq('is_read', false)
        : Promise.resolve({ count: 0 })),
    ]);

    setCounts({
      comments: (isAdmin || isCEO) ? (commentsCount || 0) : 0,
      subscribers: (isAdmin || isCEO) ? (subsCount || 0) : 0,
      publishers: isCEO ? (pubsCount || 0) : 0,
      reviews: (isAdmin || isCEO) ? (reviewsCount || 0) : 0,
      posts: (isAdmin || isCEO) ? (postsCount || 0) : 0,
      pages: (isAdmin || isCEO) ? (pagesCount || 0) : 0,
      messages: isCEO ? (messagesCount || 0) : 0,
    });
  };

  const markSeen = async (type: keyof NotificationCounts) => {
    if (!user) return;
    const now = new Date().toISOString();
    await supabase.from('cms_notifications').upsert(
      { user_id: user.id, type, count: 0, last_seen_at: now, updated_at: now },
      { onConflict: 'user_id,type' }
    );
    setCounts(prev => ({ ...prev, [type]: 0 }));
    setLastSeenMap(prev => ({ ...prev, [type]: now }));
  };

  useEffect(() => {
    if (!user) return;
    fetchCounts();
    const interval = setInterval(fetchCounts, 60_000);
    return () => clearInterval(interval);
  }, [user, isCEO, isAdmin]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <NotificationContext.Provider value={{ counts, total, markSeen, refresh: fetchCounts }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
