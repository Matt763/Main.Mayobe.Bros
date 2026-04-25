import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUserAuth } from '../contexts/UserAuthContext';
import { FREE_SAVED_POSTS_LIMIT } from './usePlan';

export interface SavedPostRow {
  post_id: string;
  created_at: string;
}

export interface SavedPostWithMeta extends SavedPostRow {
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

export function useIsSaved(postId: string | undefined) {
  const { publicUser } = useUserAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!postId || !publicUser) {
      setSaved(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from('saved_posts')
      .select('post_id')
      .eq('user_id', publicUser.id)
      .eq('post_id', postId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setSaved(!!data);
      })
      .then(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [postId, publicUser?.id]);

  const toggle = useCallback(async () => {
    if (!postId || !publicUser) return { error: 'Not signed in' as const };
    if (saved) {
      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('user_id', publicUser.id)
        .eq('post_id', postId);
      if (!error) setSaved(false);
      return { error: error?.message ?? null };
    }
    const { error } = await supabase
      .from('saved_posts')
      .insert({ user_id: publicUser.id, post_id: postId });
    if (!error) setSaved(true);
    return { error: error?.message ?? null };
  }, [postId, publicUser?.id, saved]);

  return { saved, loading, toggle, signedIn: !!publicUser };
}

export function useSavedPostsList() {
  const { publicUser } = useUserAuth();
  const [items, setItems] = useState<SavedPostWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reloadRef = useRef(0);

  const reload = useCallback(() => {
    reloadRef.current += 1;
    setLoading(true);
  }, []);

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
        .from('saved_posts')
        .select(`
          post_id,
          created_at,
          posts:post_id (
            id, title, slug, excerpt, featured_image, author, published_at,
            categories ( name, slug ),
            labels ( name, slug )
          )
        `)
        .eq('user_id', publicUser.id)
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (error) {
        setError(error.message);
        setItems([]);
      } else {
        const rows: SavedPostWithMeta[] = (data || []).map((row: any) => ({
          post_id: row.post_id,
          created_at: row.created_at,
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
  }, [publicUser?.id, reloadRef.current]);

  const remove = useCallback(
    async (postId: string) => {
      if (!publicUser) return;
      setItems(prev => prev.filter(i => i.post_id !== postId));
      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('user_id', publicUser.id)
        .eq('post_id', postId);
      if (error) reload();
    },
    [publicUser?.id, reload]
  );

  return { items, loading, error, remove, reload };
}
