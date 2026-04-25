import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUserAuth } from '../contexts/UserAuthContext';

const WINDOW_DAYS = 30;

export interface NotificationItem {
  post_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string;
  is_read: boolean;
  category: { name: string; slug: string } | null;
  label: { name: string; slug: string } | null;
}

async function fetchLastSeen(userId: string): Promise<string> {
  const { data } = await supabase
    .from('notifications_state')
    .select('last_seen_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (data?.last_seen_at) return data.last_seen_at as string;

  // Lazy init: default to 30 days ago (matches DB default). Creating the row
  // here means subsequent markAllRead can update it without a separate insert.
  const lastSeen = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from('notifications_state')
    .insert({ user_id: userId, last_seen_at: lastSeen });
  return lastSeen;
}

async function fetchInterestCategoryIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('user_interests')
    .select('category_id')
    .eq('user_id', userId);
  return (data || []).map((r: any) => r.category_id as string);
}

export function useNotifications() {
  const { publicUser } = useUserAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasInterests, setHasInterests] = useState<boolean | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    if (!publicUser) {
      setItems([]);
      setLoading(false);
      setHasInterests(null);
      return;
    }
    let cancelled = false;
    setLoading(true);

    (async () => {
      const [catIds, lastSeen] = await Promise.all([
        fetchInterestCategoryIds(publicUser.id),
        fetchLastSeen(publicUser.id),
      ]);
      if (cancelled) return;

      setHasInterests(catIds.length > 0);
      if (catIds.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const cutoff = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('posts')
        .select(`
          id, title, slug, excerpt, featured_image, published_at,
          categories ( name, slug ),
          labels ( name, slug )
        `)
        .in('category_id', catIds)
        .eq('status', 'published')
        .gte('published_at', cutoff)
        .order('published_at', { ascending: false })
        .limit(50);

      if (cancelled) return;

      const rows: NotificationItem[] = (data || []).map((row: any) => ({
        post_id: row.id,
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt,
        featured_image: row.featured_image,
        published_at: row.published_at,
        is_read: row.published_at <= lastSeen,
        category: row.categories
          ? { name: row.categories.name, slug: row.categories.slug }
          : null,
        label: row.labels ? { name: row.labels.name, slug: row.labels.slug } : null,
      }));
      setItems(rows);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [publicUser?.id, tick]);

  const markAllRead = useCallback(async () => {
    if (!publicUser) return;
    const now = new Date().toISOString();
    // Optimistic
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase
      .from('notifications_state')
      .upsert({ user_id: publicUser.id, last_seen_at: now });
  }, [publicUser?.id]);

  const unreadCount = items.reduce((n, i) => n + (i.is_read ? 0 : 1), 0);

  return { items, loading, unreadCount, hasInterests, markAllRead, reload };
}

/** Lightweight unread-count hook for badges. Does one COUNT query. */
export function useUnreadCount(): { count: number; loading: boolean } {
  const { publicUser } = useUserAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicUser) {
      setCount(0);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    (async () => {
      const [catIds, lastSeen] = await Promise.all([
        fetchInterestCategoryIds(publicUser.id),
        fetchLastSeen(publicUser.id),
      ]);
      if (cancelled) return;
      if (catIds.length === 0) {
        setCount(0);
        setLoading(false);
        return;
      }
      const cutoff = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .in('category_id', catIds)
        .eq('status', 'published')
        .gt('published_at', lastSeen)
        .gte('published_at', cutoff);
      if (!cancelled) {
        setCount(count || 0);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [publicUser?.id]);

  return { count, loading };
}
