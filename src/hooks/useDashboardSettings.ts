import { useEffect, useState } from 'react';
import {
  type DashboardSettings,
  DEFAULT_DASHBOARD_SETTINGS,
  mergeWithDefaults,
} from '../lib/dashboardSettings';

let cached: { config: DashboardSettings; ts: number } | null = null;
const TTL_MS = 60_000;
const subscribers = new Set<(c: DashboardSettings) => void>();

async function fetchConfig(): Promise<DashboardSettings> {
  try {
    const res = await fetch('/api/dashboard-settings', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return DEFAULT_DASHBOARD_SETTINGS;
    const data = await res.json();
    return mergeWithDefaults(data);
  } catch {
    return DEFAULT_DASHBOARD_SETTINGS;
  }
}

async function load(force = false): Promise<DashboardSettings> {
  const now = Date.now();
  if (!force && cached && now - cached.ts < TTL_MS) return cached.config;
  const config = await fetchConfig();
  cached = { config, ts: now };
  subscribers.forEach(fn => { try { fn(config); } catch { /* noop */ } });
  return config;
}

/** Reader-facing hook — reads the public dashboard settings with TTL cache. */
export function useDashboardSettings() {
  const [config, setConfig] = useState<DashboardSettings>(
    cached?.config || DEFAULT_DASHBOARD_SETTINGS,
  );
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let cancelled = false;
    load().then(c => {
      if (!cancelled) {
        setConfig(c);
        setLoading(false);
      }
    });
    const sub = (c: DashboardSettings) => { if (!cancelled) setConfig(c); };
    subscribers.add(sub);
    return () => {
      cancelled = true;
      subscribers.delete(sub);
    };
  }, []);

  return { config, loading, refresh: () => load(true) };
}

/** Convenience for non-React callers. */
export async function getDashboardSettings(): Promise<DashboardSettings> {
  return load();
}
