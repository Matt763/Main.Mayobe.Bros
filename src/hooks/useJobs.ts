import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUserAuth } from '../contexts/UserAuthContext';

export interface Job {
  id: string;
  title: string;
  slug: string;
  company: string;
  companyLogo: string | null;
  location: string | null;
  isRemote: boolean;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance';
  salaryRange: string | null;
  description: string;
  applyUrl: string | null;
  categoryId: string | null;
  status: 'draft' | 'published' | 'closed';
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobFilters {
  q?: string;
  remote?: boolean;
  type?: Job['employmentType'];
  page?: number;
  limit?: number;
}

async function fetchJSON(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(path, {
    credentials: 'include',
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || 'Request failed');
  return res.json();
}

export function useJobsList(filters: JobFilters = {}) {
  const [items, setItems] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { q, remote, type, page = 1, limit = 20 } = filters;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (remote) params.set('remote', 'true');
    if (type) params.set('type', type);
    params.set('page', String(page));
    params.set('limit', String(limit));

    fetchJSON(`/api/jobs?${params.toString()}`)
      .then(data => {
        if (cancelled) return;
        setItems(data.jobs || []);
        setTotal(data.total || 0);
        setError(null);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err.message || 'Failed to load jobs');
        setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [q, remote, type, page, limit]);

  return { items, total, loading, error };
}

export function useJobBySlug(slug: string | undefined) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setJob(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchJSON(`/api/jobs/slug/${encodeURIComponent(slug)}`)
      .then(data => {
        if (!cancelled) {
          setJob(data);
          setError(null);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message || 'Job not found');
          setJob(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { job, loading, error };
}

// ── Saved jobs ───────────────────────────────────────────────────────────────
export function useIsJobSaved(jobId: string | undefined) {
  const { publicUser } = useUserAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!jobId || !publicUser) {
      setSaved(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from('saved_jobs')
      .select('job_id')
      .eq('user_id', publicUser.id)
      .eq('job_id', jobId)
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
  }, [jobId, publicUser?.id]);

  const toggle = useCallback(async () => {
    if (!jobId || !publicUser) return { error: 'Not signed in' as const };
    if (saved) {
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', publicUser.id)
        .eq('job_id', jobId);
      if (!error) setSaved(false);
      return { error: error?.message ?? null };
    }
    const { error } = await supabase
      .from('saved_jobs')
      .insert({ user_id: publicUser.id, job_id: jobId });
    if (!error) setSaved(true);
    return { error: error?.message ?? null };
  }, [jobId, publicUser?.id, saved]);

  return { saved, loading, toggle, signedIn: !!publicUser };
}

export interface SavedJobRow {
  job_id: string;
  created_at: string;
  job: Job | null;
}

function shapeJobFromJoin(row: any): Job | null {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    company: row.company,
    companyLogo: row.company_logo ?? null,
    location: row.location ?? null,
    isRemote: !!row.is_remote,
    employmentType: row.employment_type,
    salaryRange: row.salary_range ?? null,
    description: row.description ?? '',
    applyUrl: row.apply_url ?? null,
    categoryId: row.category_id ?? null,
    status: row.status,
    publishedAt: row.published_at ?? null,
    expiresAt: row.expires_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useSavedJobsList() {
  const { publicUser } = useUserAuth();
  const [items, setItems] = useState<SavedJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick(t => t + 1), []);

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
        .from('saved_jobs')
        .select('job_id, created_at, jobs:job_id (*)')
        .eq('user_id', publicUser.id)
        .order('created_at', { ascending: false });
      if (cancelled) return;

      if (error) {
        setError(error.message);
        setItems([]);
      } else {
        setItems(
          (data || []).map((row: any) => ({
            job_id: row.job_id,
            created_at: row.created_at,
            job: shapeJobFromJoin(row.jobs),
          }))
        );
        setError(null);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [publicUser?.id, tick]);

  const remove = useCallback(
    async (jobId: string) => {
      if (!publicUser) return;
      setItems(prev => prev.filter(i => i.job_id !== jobId));
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', publicUser.id)
        .eq('job_id', jobId);
      if (error) reload();
    },
    [publicUser?.id, reload]
  );

  return { items, loading, error, remove, reload };
}

// ── Applied jobs ─────────────────────────────────────────────────────────────
export function useIsJobApplied(jobId: string | undefined) {
  const { publicUser } = useUserAuth();
  const [applied, setApplied] = useState(false);
  const [appliedAt, setAppliedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!jobId || !publicUser) {
      setApplied(false);
      setAppliedAt(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from('job_applications')
      .select('applied_at')
      .eq('user_id', publicUser.id)
      .eq('job_id', jobId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setApplied(!!data);
        setAppliedAt((data?.applied_at as string) ?? null);
      })
      .then(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [jobId, publicUser?.id]);

  const toggle = useCallback(async () => {
    if (!jobId || !publicUser) return { error: 'Not signed in' as const };
    if (applied) {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('user_id', publicUser.id)
        .eq('job_id', jobId);
      if (!error) {
        setApplied(false);
        setAppliedAt(null);
      }
      return { error: error?.message ?? null };
    }
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('job_applications')
      .insert({ user_id: publicUser.id, job_id: jobId, applied_at: now });
    if (!error) {
      setApplied(true);
      setAppliedAt(now);
    }
    return { error: error?.message ?? null };
  }, [jobId, publicUser?.id, applied]);

  return { applied, appliedAt, loading, toggle, signedIn: !!publicUser };
}

export interface AppliedJobRow {
  job_id: string;
  applied_at: string;
  note: string | null;
  job: Job | null;
}

export function useAppliedJobsList() {
  const { publicUser } = useUserAuth();
  const [items, setItems] = useState<AppliedJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick(t => t + 1), []);

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
        .from('job_applications')
        .select('job_id, applied_at, note, jobs:job_id (*)')
        .eq('user_id', publicUser.id)
        .order('applied_at', { ascending: false });
      if (cancelled) return;

      if (error) {
        setError(error.message);
        setItems([]);
      } else {
        setItems(
          (data || []).map((row: any) => ({
            job_id: row.job_id,
            applied_at: row.applied_at,
            note: row.note ?? null,
            job: shapeJobFromJoin(row.jobs),
          }))
        );
        setError(null);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [publicUser?.id, tick]);

  const remove = useCallback(
    async (jobId: string) => {
      if (!publicUser) return;
      setItems(prev => prev.filter(i => i.job_id !== jobId));
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('user_id', publicUser.id)
        .eq('job_id', jobId);
      if (error) reload();
    },
    [publicUser?.id, reload]
  );

  return { items, loading, error, remove, reload };
}
