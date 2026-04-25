/**
 * Broadcast notifications — admin-composed announcements shown to readers.
 *
 *   GET    /api/broadcasts             public, recent broadcasts (audience filtered server-side later)
 *   POST   /api/broadcasts/admin       admin auth, create
 *   DELETE /api/broadcasts/admin/:id   admin auth, delete
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getSupabaseAdmin } from '../utils/supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt((req.query.limit as string) || '5', 10)));
    const supa = getSupabaseAdmin();
    const { data, error } = await supa
      .from('broadcast_notifications')
      .select('id, title, body, link, audience, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    res.json({ broadcasts: data || [] });
  } catch (err: any) {
    console.error('[broadcasts] list error:', err);
    res.json({ broadcasts: [] });
  }
});

router.post('/admin', requireAuth, async (req, res) => {
  try {
    const { title, body, link, audience } = req.body || {};
    if (!title || typeof title !== 'string') return res.status(400).json({ error: 'title is required' });

    const aud = ['all', 'free', 'premium'].includes(audience) ? audience : 'all';
    const userId = (req as any).session?.userId || null;

    const supa = getSupabaseAdmin();
    const { data, error } = await supa
      .from('broadcast_notifications')
      .insert({
        title: String(title).slice(0, 200),
        body: body ? String(body).slice(0, 5000) : null,
        link: link ? String(link).slice(0, 500) : null,
        audience: aud,
        created_by: userId,
      })
      .select()
      .single();
    if (error) throw error;
    res.json({ broadcast: data });
  } catch (err: any) {
    console.error('[broadcasts] create error:', err);
    res.status(500).json({ error: err?.message || 'Failed to create broadcast' });
  }
});

router.delete('/admin/:id', requireAuth, async (req, res) => {
  try {
    const supa = getSupabaseAdmin();
    const { error } = await supa.from('broadcast_notifications').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err: any) {
    console.error('[broadcasts] delete error:', err);
    res.status(500).json({ error: err?.message || 'Failed to delete broadcast' });
  }
});

router.get('/admin', requireAuth, async (_req, res) => {
  try {
    const supa = getSupabaseAdmin();
    const { data, error } = await supa
      .from('broadcast_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    res.json({ broadcasts: data || [] });
  } catch (err: any) {
    console.error('[broadcasts] admin list error:', err);
    res.status(500).json({ error: err?.message || 'Failed' });
  }
});

export default router;
