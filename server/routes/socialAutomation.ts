import { Router } from 'express';
import { getSupabaseClient } from '../utils/supabase.js';

const router = Router();

router.get('/accounts', async (_req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('social_media_accounts')
      .select('*')
      .order('platform');

    if (error) throw error;
    const masked = (data || []).map(a => ({
      ...a,
      api_key: a.api_key ? '****' + a.api_key.slice(-4) : '',
      api_secret: a.api_secret ? '****' + a.api_secret.slice(-4) : '',
      access_token: a.access_token ? '****' + a.access_token.slice(-4) : '',
    }));
    res.json(masked);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

router.post('/accounts', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { platform, account_name, api_key, api_secret, access_token } = req.body;

    const { data: existing } = await supabase
      .from('social_media_accounts')
      .select('id')
      .eq('platform', platform)
      .maybeSingle();

    if (existing) {
      const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (account_name !== undefined) update.account_name = account_name;
      if (api_key !== undefined) update.api_key = api_key;
      if (api_secret !== undefined) update.api_secret = api_secret;
      if (access_token !== undefined) update.access_token = access_token;
      update.is_connected = true;

      const { data, error } = await supabase
        .from('social_media_accounts')
        .update(update)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return res.json(data);
    }

    const { data, error } = await supabase
      .from('social_media_accounts')
      .insert({
        platform,
        account_name: account_name || '',
        api_key: api_key || '',
        api_secret: api_secret || '',
        access_token: access_token || '',
        is_connected: true,
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save account' });
  }
});

router.delete('/accounts/:id', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('social_media_accounts')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

router.get('/posts', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('social_media_posts')
      .select('*, posts(title, slug)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch social posts' });
  }
});

router.post('/posts', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { post_id, platform, headline, caption, hashtags, article_link, status } = req.body;

    const { data, error } = await supabase
      .from('social_media_posts')
      .insert({
        post_id,
        platform,
        headline: headline || '',
        caption: caption || '',
        hashtags: hashtags || '',
        article_link: article_link || '',
        status: status || 'draft',
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create social post' });
  }
});

router.put('/posts/:id', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

    for (const key of ['headline', 'caption', 'hashtags', 'status', 'scheduled_at']) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    const { data, error } = await supabase
      .from('social_media_posts')
      .update(update)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update social post' });
  }
});

router.delete('/posts/:id', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('social_media_posts')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete social post' });
  }
});

router.get('/ai-engine', async (_req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('ai_engine_settings')
      .select('*')
      .order('feature_key');

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch AI settings' });
  }
});

router.put('/ai-engine/:featureKey', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { is_enabled, config } = req.body;

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (is_enabled !== undefined) update.is_enabled = is_enabled;
    if (config !== undefined) update.config = config;

    const { data, error } = await supabase
      .from('ai_engine_settings')
      .update(update)
      .eq('feature_key', req.params.featureKey)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update AI setting' });
  }
});

export default router;
