import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

type Counts = Record<string, number>;

export function useReactions(postId: string, userId: string | null) {
  const [reactions, setReactions] = useState<Counts>(() => {
    if (!postId) return {};
    try { return JSON.parse(localStorage.getItem(`reactions-${postId}`) || '{}'); } catch { return {}; }
  });
  const [userReaction, setUserReaction] = useState<string | null>(() => {
    if (!postId) return null;
    return localStorage.getItem(`user-reaction-${postId}`);
  });
  const [animating, setAnimating] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!postId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const { data: all } = await supabase
          .from('reactions')
          .select('reaction_type')
          .eq('post_id', postId);

        if (!cancelled && all) {
          const counts: Counts = {};
          for (const r of all) counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1;
          setReactions(counts);
          localStorage.setItem(`reactions-${postId}`, JSON.stringify(counts));
        }

        if (userId && !cancelled) {
          const { data: own } = await supabase
            .from('reactions')
            .select('reaction_type')
            .eq('post_id', postId)
            .eq('user_identifier', userId)
            .maybeSingle();
          const type = own?.reaction_type ?? null;
          setUserReaction(type);
          if (type) localStorage.setItem(`user-reaction-${postId}`, type);
          else localStorage.removeItem(`user-reaction-${postId}`);
        }
      } catch {
        // keep localStorage cache as fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [postId, userId]);

  const handleReaction = useCallback(async (type: string) => {
    if (!userId || !postId) return;

    let newCounts: Counts;
    let newType: string | null;

    if (userReaction === type) {
      newCounts = { ...reactions, [type]: Math.max((reactions[type] ?? 1) - 1, 0) };
      newType = null;
    } else {
      newCounts = { ...reactions, [type]: (reactions[type] ?? 0) + 1 };
      if (userReaction) newCounts[userReaction] = Math.max((newCounts[userReaction] ?? 1) - 1, 0);
      newType = type;
    }

    setReactions(newCounts);
    setUserReaction(newType);
    setAnimating(type);
    localStorage.setItem(`reactions-${postId}`, JSON.stringify(newCounts));
    if (newType) localStorage.setItem(`user-reaction-${postId}`, newType);
    else localStorage.removeItem(`user-reaction-${postId}`);

    try {
      if (newType === null) {
        await supabase
          .from('reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_identifier', userId);
      } else {
        await supabase.from('reactions').upsert(
          { post_id: postId, reaction_type: type, user_identifier: userId },
          { onConflict: 'post_id,user_identifier' }
        );
      }
    } catch {
      // optimistic update stays; silent fail
    }
  }, [postId, userId, reactions, userReaction]);

  const clearAnimating = useCallback(() => setAnimating(null), []);

  return { reactions, userReaction, handleReaction, loading, animating, clearAnimating };
}
