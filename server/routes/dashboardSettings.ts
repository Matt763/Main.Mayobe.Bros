import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getSupabaseAdmin } from '../utils/supabase.js';

const router = Router();

const DEFAULTS = {
  features: {
    personalizedFeed: true,
    savedContent: true,
    learningSystem: false,
    jobsTracker: true,
    notifications: true,
    userStats: true,
    aiAssistant: false,
  },
  limits: {
    freeSavedPostsMax: 10,
    freeReadingHistoryMax: 100,
    freeNotificationsPerDay: 5,
  },
  layout: {
    sectionVisibility: {
      recommended: true,
      saved: true,
      learning: false,
      jobs: true,
      notifications: true,
    },
    sectionOrder: ['recommended', 'saved', 'learning', 'jobs', 'notifications'],
  },
  personalization: {
    recommendationSource: 'category' as const,
    defaultInterestIds: [] as string[],
  },
  premium: {
    enabled: true,
    priceUsd: 5,
    currency: 'USD',
    premiumOnlyFeatures: [] as string[],
  },
  notifications: {
    globalEnabled: true,
  },
  jobs: {
    showOnDashboard: true,
    featuredJobIds: [] as string[],
  },
};

function deepMerge<T extends Record<string, any>>(base: T, patch: Partial<T>): T {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return base;
  const out: any = { ...base };
  for (const key of Object.keys(patch)) {
    const pv = (patch as any)[key];
    const bv = (base as any)[key];
    if (pv !== null && typeof pv === 'object' && !Array.isArray(pv) && bv && typeof bv === 'object' && !Array.isArray(bv)) {
      out[key] = deepMerge(bv, pv);
    } else if (pv !== undefined) {
      out[key] = pv;
    }
  }
  return out;
}

async function loadConfig() {
  const supa = getSupabaseAdmin();
  const { data, error } = await supa
    .from('dashboard_settings')
    .select('config, updated_at')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  return {
    config: deepMerge(DEFAULTS, (data?.config as any) || {}),
    updatedAt: data?.updated_at || null,
  };
}

// ── Public: GET /api/dashboard-settings ──────────────────────────────────────
// Used by the user-facing dashboard to render only enabled features.
// No secrets to hide here, so we expose the full config.
router.get('/', async (_req, res) => {
  try {
    const { config } = await loadConfig();
    res.json(config);
  } catch (err: any) {
    console.error('[dashboard-settings] public read error:', err);
    res.json(DEFAULTS);
  }
});

// ── Admin: GET /api/admin/dashboard-settings ─────────────────────────────────
router.get('/admin', requireAuth, async (_req, res) => {
  try {
    const { config, updatedAt } = await loadConfig();
    res.json({ config, updatedAt });
  } catch (err: any) {
    console.error('[dashboard-settings] admin read error:', err);
    res.status(500).json({ error: err?.message || 'Failed to load settings' });
  }
});

// ── Admin: PATCH /api/admin/dashboard-settings ───────────────────────────────
// Body: a partial DashboardSettings object that gets deep-merged over current.
router.patch('/admin', requireAuth, async (req, res) => {
  try {
    const supa = getSupabaseAdmin();
    const { config: current } = await loadConfig();
    const patch = (req.body || {}) as any;
    const next = deepMerge(current, patch);

    // Validate critical numeric bounds
    next.limits.freeSavedPostsMax        = clampInt(next.limits.freeSavedPostsMax, 0, 10000, 10);
    next.limits.freeReadingHistoryMax    = clampInt(next.limits.freeReadingHistoryMax, 0, 100000, 100);
    next.limits.freeNotificationsPerDay  = clampInt(next.limits.freeNotificationsPerDay, 0, 1000, 5);
    next.premium.priceUsd                = clampNumber(next.premium.priceUsd, 0, 1000, 5);

    const userId = (req as any).session?.userId || (req as any).adminUser?.userId || null;

    const { error } = await supa
      .from('dashboard_settings')
      .upsert(
        { id: 1, config: next, updated_by: userId, updated_at: new Date().toISOString() },
        { onConflict: 'id' },
      );
    if (error) throw error;

    res.json({ ok: true, config: next });
  } catch (err: any) {
    console.error('[dashboard-settings] admin write error:', err);
    res.status(500).json({ error: err?.message || 'Failed to save settings' });
  }
});

function clampInt(v: any, min: number, max: number, fallback: number): number {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
function clampNumber(v: any, min: number, max: number, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export default router;
