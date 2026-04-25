import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUserAuth } from '../contexts/UserAuthContext';
import { api } from '../lib/api';

export interface InterestCategory {
  id: string;
  name: string;
  slug: string;
  selected: boolean;
}

export interface Recommendation {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  author: string | null;
  published_at: string | null;
  category: { name: string; slug: string } | null;
  label: { name: string; slug: string } | null;
}

/**
 * Merges the site's real categories with the user's saved interests so the
 * picker can render chips with a correct `selected` state. Writes go straight
 * to Supabase (RLS-protected).
 */
export function useInterests() {
  const { publicUser } = useUserAuth();
  const [categories, setCategories] = useState<InterestCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cats = await api.categories.list();
      const catList: { id: string; name: string; slug: string }[] = (cats || []).map(
        (c: any) => ({ id: c.id, name: c.name, slug: c.slug })
      );

      let selectedIds = new Set<string>();
      if (publicUser) {
        const { data } = await supabase
          .from('user_interests')
          .select('category_id')
          .eq('user_id', publicUser.id);
        selectedIds = new Set((data || []).map((r: any) => r.category_id));
      }

      setCategories(
        catList
          .map(c => ({ ...c, selected: selectedIds.has(c.id) }))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load interests');
    } finally {
      setLoading(false);
    }
  }, [publicUser?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = useCallback(
    async (categoryId: string) => {
      if (!publicUser || saving) return;
      const current = categories.find(c => c.id === categoryId);
      if (!current) return;

      // Optimistic
      setCategories(prev =>
        prev.map(c => (c.id === categoryId ? { ...c, selected: !c.selected } : c))
      );
      setSaving(true);

      const { error } = current.selected
        ? await supabase
            .from('user_interests')
            .delete()
            .eq('user_id', publicUser.id)
            .eq('category_id', categoryId)
        : await supabase
            .from('user_interests')
            .insert({ user_id: publicUser.id, category_id: categoryId });

      setSaving(false);
      if (error) {
        setError(error.message);
        // Rollback
        setCategories(prev =>
          prev.map(c => (c.id === categoryId ? { ...c, selected: current.selected } : c))
        );
      }
    },
    [categories, publicUser?.id, saving]
  );

  const selected = categories.filter(c => c.selected);

  return { categories, selected, loading, saving, error, toggle, reload: load };
}

export function useRecommendations(limit = 9) {
  const { publicUser } = useUserAuth();
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasInterests, setHasInterests] = useState<boolean | null>(null);

  useEffect(() => {
    if (!publicUser) {
      setItems([]);
      setHasInterests(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data: interests } = await supabase
        .from('user_interests')
        .select('category_id')
        .eq('user_id', publicUser.id);

      if (cancelled) return;

      const catIds = (interests || []).map((r: any) => r.category_id);
      setHasInterests(catIds.length > 0);

      if (catIds.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('posts')
        .select(`
          id, title, slug, excerpt, featured_image, author, published_at,
          categories ( name, slug ),
          labels ( name, slug )
        `)
        .in('category_id', catIds)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(limit);

      if (cancelled) return;

      const recs: Recommendation[] = (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt,
        featured_image: row.featured_image,
        author: row.author,
        published_at: row.published_at,
        category: row.categories
          ? { name: row.categories.name, slug: row.categories.slug }
          : null,
        label: row.labels ? { name: row.labels.name, slug: row.labels.slug } : null,
      }));
      setItems(recs);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [publicUser?.id, limit]);

  return { items, loading, hasInterests };
}
