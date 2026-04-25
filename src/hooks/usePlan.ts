import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUserAuth } from '../contexts/UserAuthContext';

export type PlanName = 'free' | 'premium';

export interface PlanInfo {
  plan: PlanName;
  premiumUntil: string | null;
  upgradedAt: string | null;
}

async function authedFetch(path: string, init?: RequestInit) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  const headers = new Headers(init?.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(path, { ...init, headers, credentials: 'include' });
}

export async function fetchPlanFromServer(): Promise<PlanInfo | null> {
  const res = await authedFetch('/api/payments/plan');
  if (!res.ok) return null;
  return res.json();
}

export interface CheckoutResult {
  redirectUrl: string;
  orderTrackingId: string;
  merchantReference: string;
  amount: number;
  currency: string;
}

export async function startCheckout(phone?: string): Promise<CheckoutResult> {
  const res = await authedFetch('/api/payments/create-checkout', {
    method: 'POST',
    body: JSON.stringify({ phone: phone || '' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to start checkout');
  return data;
}

export async function fetchOrderStatus(trackingId: string): Promise<{
  status: string;
  upgraded?: boolean;
}> {
  const res = await authedFetch(`/api/payments/status/${encodeURIComponent(trackingId)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Status check failed');
  return data;
}

export function usePlan() {
  const { publicUser } = useUserAuth();
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    if (!publicUser) {
      setPlan(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    fetchPlanFromServer()
      .then(p => {
        if (!cancelled) setPlan(p ?? { plan: 'free', premiumUntil: null, upgradedAt: null });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [publicUser?.id, tick]);

  const isPremium = plan?.plan === 'premium';

  return { plan, isPremium, loading, refresh };
}

/** Free-tier limit — used by SaveButton/useSavedPosts when blocking saves. */
export const FREE_SAVED_POSTS_LIMIT = 10;
