import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { usePlan } from './usePlan';

export interface Broadcast {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  audience: 'all' | 'free' | 'premium';
  created_at: string;
}

const DISMISSED_KEY = 'mayobe.broadcasts.dismissed';

function getDismissed(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'));
  } catch { return new Set(); }
}
function persistDismissed(set: Set<string>) {
  try { localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set])); } catch { /* noop */ }
}

export function useBroadcasts(limit = 5) {
  const { isPremium, loading: planLoading } = usePlan();
  const [items, setItems] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(getDismissed());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess?.session?.access_token;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`/api/broadcasts?limit=${limit}`, { headers });
        const data = await res.json();
        if (cancelled) return;
        // Server already filters by audience; we just trust the result.
        setItems((data?.broadcasts || []) as Broadcast[]);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isPremium, limit, planLoading]);

  const visible = items.filter(b => !dismissed.has(b.id));
  const dismiss = (id: string) => {
    const next = new Set(dismissed); next.add(id);
    setDismissed(next); persistDismissed(next);
  };

  return { items: visible, loading, dismiss };
}
