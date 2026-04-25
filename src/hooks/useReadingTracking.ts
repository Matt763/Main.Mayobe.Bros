import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUserAuth } from '../contexts/UserAuthContext';

const READ_THRESHOLD_MS = 15_000; // 15 seconds on page = a "read"

export interface ReadingHistoryItem {
  post_id: string;
  last_read_at: string;
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    featured_image: string | null;
    author: string | null;
    published_at: string | null;
    category: { name: string; slug: string } | null;
    label: { name: string; slug: string } | null;
  } | null;
}

/**
 * Fires once per page session: after READ_THRESHOLD_MS on the page,
 * upserts the (user, post) row and increments today's activity count.
 * Cleanup cancels the timer if user navigates away early.
 */
export function useTrackReading(postId: string | undefined) {
  const { publicUser } = useUserAuth();

  useEffect(() => {
    if (!postId || !publicUser) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (cancelled) return;
      try {
        await supabase.rpc('track_reading', { p_post_id: postId });
      } catch {
        // Silent — tracking failure shouldn't impact reading UX.
      }
    }, READ_THRESHOLD_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [postId, publicUser?.id]);
}

export function useReadingHistory(limit = 50) {
  const { publicUser } = useUserAuth();
  const [items, setItems] = useState<ReadingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicUser) {
      setItems([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data, error } = await supabase
        .from('reading_history')
        .select(`
          post_id,
          last_read_at,
          posts:post_id (
            id, title, slug, excerpt, featured_image, author, published_at,
            categories ( name, slug ),
            labels ( name, slug )
          )
        `)
        .eq('user_id', publicUser.id)
        .order('last_read_at', { ascending: false })
        .limit(limit);

      if (cancelled) return;

      if (error) {
        setError(error.message);
        setItems([]);
      } else {
        const rows: ReadingHistoryItem[] = (data || []).map((row: any) => ({
          post_id: row.post_id,
          last_read_at: row.last_read_at,
          post: row.posts
            ? {
                id: row.posts.id,
                title: row.posts.title,
                slug: row.posts.slug,
                excerpt: row.posts.excerpt,
                featured_image: row.posts.featured_image,
                author: row.posts.author,
                published_at: row.posts.published_at,
                category: row.posts.categories
                  ? { name: row.posts.categories.name, slug: row.posts.categories.slug }
                  : null,
                label: row.posts.labels
                  ? { name: row.posts.labels.name, slug: row.posts.labels.slug }
                  : null,
              }
            : null,
        }));
        setError(null);
        setItems(rows);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [publicUser?.id, limit]);

  return { items, loading, error };
}

export interface ReadingStats {
  articlesRead: number;
  streakDays: number;
  loading: boolean;
}

/**
 * Total distinct articles read = COUNT(*) of reading_history.
 * Streak = consecutive days ending at today (or yesterday) in reading_activity.
 *   - If user read today, streak is 1 + (consecutive prior days).
 *   - If user's last activity was yesterday, streak is whatever was built up
 *     ending yesterday (still "alive" until today ends).
 *   - Otherwise streak is 0.
 */
export function useReadingStats(): ReadingStats {
  const { publicUser } = useUserAuth();
  const [stats, setStats] = useState<ReadingStats>({
    articlesRead: 0,
    streakDays: 0,
    loading: true,
  });

  useEffect(() => {
    if (!publicUser) {
      setStats({ articlesRead: 0, streakDays: 0, loading: false });
      return;
    }
    let cancelled = false;

    (async () => {
      const [{ count }, { data: dates }] = await Promise.all([
        supabase
          .from('reading_history')
          .select('post_id', { count: 'exact', head: true })
          .eq('user_id', publicUser.id),
        supabase
          .from('reading_activity')
          .select('activity_date')
          .eq('user_id', publicUser.id)
          .order('activity_date', { ascending: false })
          .limit(365),
      ]);

      if (cancelled) return;

      const dateSet = new Set<string>(
        (dates || []).map((r: any) => r.activity_date as string)
      );

      const today = new Date();
      const todayStr = isoDate(today);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = isoDate(yesterday);

      let cursor: Date;
      if (dateSet.has(todayStr)) cursor = today;
      else if (dateSet.has(yesterdayStr)) cursor = yesterday;
      else {
        setStats({ articlesRead: count || 0, streakDays: 0, loading: false });
        return;
      }

      let streak = 0;
      while (dateSet.has(isoDate(cursor))) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }

      setStats({
        articlesRead: count || 0,
        streakDays: streak,
        loading: false,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [publicUser?.id]);

  return stats;
}

function isoDate(d: Date): string {
  // Local-date YYYY-MM-DD (matches Postgres `current_date` evaluated server-side
  // in the database's TZ — close enough for streak display purposes).
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
