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

// Determine the requester's tier from an optional Supabase Bearer token.
// Anonymous → free. Premium plan → premium. Anything else → free.
async function audienceForRequest(req: any): Promise<'all'[] | ('all' | 'free' | 'premium')[]> {
  const supa = getSupabaseAdmin();
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return ['all', 'free'];
  try {
    const { data } = await supa.auth.getUser(token);
    const userId = data?.user?.id;
    if (!userId) return ['all', 'free'];
    const { data: plan } = await supa
      .from('user_plans')
      .select('plan, premium_until')
      .eq('user_id', userId)
      .maybeSingle();
    const isPremium = !!(plan && plan.plan === 'premium' &&
      (!plan.premium_until || new Date(plan.premium_until as string).getTime() >= Date.now()));
    return isPremium ? ['all', 'premium'] : ['all', 'free'];
  } catch {
    return ['all', 'free'];
  }
}

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt((req.query.limit as string) || '5', 10)));
    const audiences = await audienceForRequest(req);
    const supa = getSupabaseAdmin();
    const { data, error } = await supa
      .from('broadcast_notifications')
      .select('id, title, body, link, audience, created_at')
      .in('audience', audiences as string[])
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
