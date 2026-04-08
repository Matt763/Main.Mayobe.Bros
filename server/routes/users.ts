import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  // Service role key bypasses RLS so admins can manage all users
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key);
}

// GET /api/users — list all registered users
router.get('/', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('registered_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    console.error('[USERS] List error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/users/:id — update user (ban, unban, newsletter status)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const body = req.body;

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.is_banned !== undefined) update.is_banned = body.is_banned;
    if (body.ban_reason !== undefined) update.ban_reason = body.ban_reason;
    if (body.newsletter_unsubscribed !== undefined) update.newsletter_unsubscribed = body.newsletter_unsubscribed;

    const { data: user, error } = await supabase
      .from('registered_users')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // If marking newsletter_unsubscribed, also deactivate their newsletter_subscribers entry
    if (body.newsletter_unsubscribed === true && user?.email) {
      await supabase
        .from('newsletter_subscribers')
        .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
        .eq('email', user.email);
    }

    // If re-enabling newsletter, reactivate their newsletter_subscribers entry
    if (body.newsletter_unsubscribed === false && user?.email) {
      await supabase
        .from('newsletter_subscribers')
        .update({ is_active: true, unsubscribed_at: null })
        .eq('email', user.email);
    }

    res.json(user);
  } catch (err: any) {
    console.error('[USERS] Update error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/users/:id — delete a registered user
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('registered_users')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error('[USERS] Delete error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
