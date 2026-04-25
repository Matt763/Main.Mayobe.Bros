/**
 * Learning tracks — admin-curated reading paths.
 *
 *   GET    /api/learning-tracks                       public, published tracks
 *   GET    /api/learning-tracks/slug/:slug            public, single track + posts
 *   GET    /api/learning-tracks/admin                 admin, all tracks
 *   POST   /api/learning-tracks/admin                 admin, create
 *   PATCH  /api/learning-tracks/admin/:id             admin, update
 *   DELETE /api/learning-tracks/admin/:id             admin, delete
 *   PUT    /api/learning-tracks/admin/:id/posts       admin, replace post assignments (body: [{postId, position, notes?}])
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getSupabaseAdmin } from '../utils/supabase.js';

const router = Router();

function slugify(s: string): string {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

// ── Public ───────────────────────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const supa = getSupabaseAdmin();
    const { data, error } = await supa
      .from('learning_tracks')
      .select('id, slug, title, description, cover_image, is_published, created_at, updated_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    res.json({ tracks: data || [] });
  } catch (err: any) {
    console.error('[learning] list error:', err);
    res.json({ tracks: [] });
  }
});

router.get('/slug/:slug', async (req, res) => {
  try {
    const supa = getSupabaseAdmin();
    const { data: track } = await supa
      .from('learning_tracks')
      .select('id, slug, title, description, cover_image, is_published, created_at')
      .eq('slug', req.params.slug)
      .eq('is_published', true)
      .maybeSingle();
    if (!track) return res.status(404).json({ error: 'Track not found' });

    const { data: tp } = await supa
      .from('track_posts')
      .select('post_id, position, notes')
      .eq('track_id', track.id)
      .order('position', { ascending: true });

    const postIds = (tp || []).map(r => r.post_id);
    let postsById: Record<string, any> = {};
    if (postIds.length) {
      const { data: posts } = await supa
        .from('posts')
        .select('id, title, slug, excerpt, cover_image, published_at')
        .in('id', postIds);
      (posts || []).forEach(p => { postsById[p.id] = p; });
    }
    const items = (tp || []).map(r => ({
      ...r,
      post: postsById[r.post_id] || null,
    }));

    res.json({ track, items });
  } catch (err: any) {
    console.error('[learning] slug error:', err);
    res.status(500).json({ error: err?.message || 'Failed to load track' });
  }
});

// ── Admin ────────────────────────────────────────────────────────────────────
router.get('/admin', requireAuth, async (_req, res) => {
  try {
    const supa = getSupabaseAdmin();
    const { data, error } = await supa
      .from('learning_tracks')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    res.json({ tracks: data || [] });
  } catch (err: any) {
    console.error('[learning] admin list error:', err);
    res.status(500).json({ error: err?.message || 'Failed' });
  }
});

router.get('/admin/:id', requireAuth, async (req, res) => {
  try {
    const supa = getSupabaseAdmin();
    const { data: track } = await supa.from('learning_tracks').select('*').eq('id', req.params.id).maybeSingle();
    if (!track) return res.status(404).json({ error: 'Not found' });
    const { data: tp } = await supa
      .from('track_posts')
      .select('post_id, position, notes')
      .eq('track_id', track.id)
      .order('position', { ascending: true });
    res.json({ track, items: tp || [] });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

router.post('/admin', requireAuth, async (req, res) => {
  try {
    const { title, description, coverImage, isPublished } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title is required' });
    const supa = getSupabaseAdmin();

    const baseSlug = slugify(req.body?.slug || title) || `track-${Date.now()}`;
    let slug = baseSlug;
    for (let i = 1; i < 10; i++) {
      const { data: hit } = await supa.from('learning_tracks').select('id').eq('slug', slug).maybeSingle();
      if (!hit) break;
      slug = `${baseSlug}-${i}`;
    }

    const { data, error } = await supa.from('learning_tracks').insert({
      slug, title, description: description || null, cover_image: coverImage || null,
      is_published: !!isPublished,
    }).select().single();
    if (error) throw error;
    res.json({ track: data });
  } catch (err: any) {
    console.error('[learning] create error:', err);
    res.status(500).json({ error: err?.message || 'Failed' });
  }
});

router.patch('/admin/:id', requireAuth, async (req, res) => {
  try {
    const update: any = { updated_at: new Date().toISOString() };
    const { title, description, coverImage, isPublished, slug } = req.body || {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (coverImage !== undefined) update.cover_image = coverImage;
    if (isPublished !== undefined) update.is_published = !!isPublished;
    if (slug !== undefined) update.slug = slugify(slug);

    const supa = getSupabaseAdmin();
    const { data, error } = await supa.from('learning_tracks').update(update).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ track: data });
  } catch (err: any) {
    console.error('[learning] update error:', err);
    res.status(500).json({ error: err?.message });
  }
});

router.delete('/admin/:id', requireAuth, async (req, res) => {
  try {
    const supa = getSupabaseAdmin();
    const { error } = await supa.from('learning_tracks').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// Replace post assignments — body: { items: [{ postId, position, notes? }] }
router.put('/admin/:id/posts', requireAuth, async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const supa = getSupabaseAdmin();
    await supa.from('track_posts').delete().eq('track_id', req.params.id);
    if (items.length) {
      const rows = items.map((it: any, idx: number) => ({
        track_id: req.params.id,
        post_id: String(it.postId || it.post_id),
        position: typeof it.position === 'number' ? it.position : idx,
        notes: it.notes || null,
      })).filter((r: any) => r.post_id);
      if (rows.length) {
        const { error } = await supa.from('track_posts').insert(rows);
        if (error) throw error;
      }
    }
    res.json({ ok: true, count: items.length });
  } catch (err: any) {
    console.error('[learning] assign error:', err);
    res.status(500).json({ error: err?.message });
  }
});

export default router;
