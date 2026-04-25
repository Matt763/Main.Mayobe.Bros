import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getSupabaseClient } from '../utils/supabase.js';

const router = Router();

function slugify(input: string): string {
  return String(input || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function shapeJob(row: any) {
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
    featured: !!row.featured,
    publishedAt: row.published_at ?? null,
    expiresAt: row.expires_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Public: list jobs ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const offset = (page - 1) * limit;
    const q = (req.query.q as string || '').trim();
    const remote = req.query.remote as string | undefined;
    const type = req.query.type as string | undefined;

    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (q) {
      query = query.or(`title.ilike.%${q}%,company.ilike.%${q}%,location.ilike.%${q}%`);
    }
    if (remote === 'true') query = query.eq('is_remote', true);
    if (type)              query = query.eq('employment_type', type);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      jobs: (data || []).map(shapeJob),
      total: count ?? 0,
      page,
      limit,
    });
  } catch (err: any) {
    console.error('[jobs] list error:', err);
    res.status(500).json({ error: 'Failed to load jobs' });
  }
});

// ── Public: single job by slug ───────────────────────────────────────────────
router.get('/slug/:slug', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('slug', req.params.slug)
      .eq('status', 'published')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Job not found' });
    res.json(shapeJob(data));
  } catch (err: any) {
    console.error('[jobs] slug error:', err);
    res.status(500).json({ error: 'Failed to load job' });
  }
});

// ── Admin: list (all statuses) ───────────────────────────────────────────────
router.get('/admin', requireAuth, async (_req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    res.json({ jobs: (data || []).map(shapeJob) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load jobs' });
  }
});

// ── Admin: create ────────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const body = req.body || {};

    if (!body.title || !body.company) {
      return res.status(400).json({ error: 'title and company are required' });
    }

    const baseSlug = slugify(body.slug || body.title);
    if (!baseSlug) return res.status(400).json({ error: 'Invalid slug' });

    // Ensure slug uniqueness
    let slug = baseSlug;
    let suffix = 0;
    while (true) {
      const { data: existing } = await supabase
        .from('jobs')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (!existing) break;
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const row = {
      title: String(body.title).trim(),
      slug,
      company: String(body.company).trim(),
      company_logo: body.companyLogo ?? body.company_logo ?? null,
      location: body.location ?? null,
      is_remote: !!(body.isRemote ?? body.is_remote),
      employment_type: body.employmentType ?? body.employment_type ?? 'full-time',
      salary_range: body.salaryRange ?? body.salary_range ?? null,
      description: body.description ?? '',
      apply_url: body.applyUrl ?? body.apply_url ?? null,
      category_id: body.categoryId ?? body.category_id ?? null,
      featured: !!(body.featured ?? false),
      status: body.status ?? 'draft',
      published_at:
        (body.status ?? 'draft') === 'published'
          ? (body.publishedAt ?? body.published_at ?? new Date().toISOString())
          : null,
      expires_at: body.expiresAt ?? body.expires_at ?? null,
    };

    const { data, error } = await supabase.from('jobs').insert(row).select('*').single();
    if (error) throw error;
    res.status(201).json(shapeJob(data));
  } catch (err: any) {
    console.error('[jobs] create error:', err);
    res.status(500).json({ error: err?.message || 'Failed to create job' });
  }
});

// ── Admin: update ────────────────────────────────────────────────────────────
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const body = req.body || {};
    const update: any = { updated_at: new Date().toISOString() };

    if (body.title !== undefined) update.title = body.title;
    if (body.slug !== undefined) update.slug = slugify(body.slug);
    if (body.company !== undefined) update.company = body.company;
    if (body.companyLogo !== undefined || body.company_logo !== undefined)
      update.company_logo = body.companyLogo ?? body.company_logo;
    if (body.location !== undefined) update.location = body.location;
    if (body.isRemote !== undefined || body.is_remote !== undefined)
      update.is_remote = !!(body.isRemote ?? body.is_remote);
    if (body.employmentType !== undefined || body.employment_type !== undefined)
      update.employment_type = body.employmentType ?? body.employment_type;
    if (body.salaryRange !== undefined || body.salary_range !== undefined)
      update.salary_range = body.salaryRange ?? body.salary_range;
    if (body.description !== undefined) update.description = body.description;
    if (body.applyUrl !== undefined || body.apply_url !== undefined)
      update.apply_url = body.applyUrl ?? body.apply_url;
    if (body.categoryId !== undefined || body.category_id !== undefined)
      update.category_id = body.categoryId ?? body.category_id;
    if (body.featured !== undefined) update.featured = !!body.featured;
    if (body.status !== undefined) {
      update.status = body.status;
      if (body.status === 'published' && !body.publishedAt && !body.published_at) {
        update.published_at = new Date().toISOString();
      }
    }
    if (body.publishedAt !== undefined || body.published_at !== undefined)
      update.published_at = body.publishedAt ?? body.published_at;
    if (body.expiresAt !== undefined || body.expires_at !== undefined)
      update.expires_at = body.expiresAt ?? body.expires_at;

    const { data, error } = await supabase
      .from('jobs')
      .update(update)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) throw error;
    res.json(shapeJob(data));
  } catch (err: any) {
    console.error('[jobs] update error:', err);
    res.status(500).json({ error: err?.message || 'Failed to update job' });
  }
});

// ── Admin: delete ────────────────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('jobs').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

export default router;
