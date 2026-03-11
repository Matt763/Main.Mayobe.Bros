import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getSupabaseClient } from '../utils/supabase.js';
import { notifySearchEngines } from '../utils/searchPing.js';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('indexing_events')
      .select('*')
      .order('pinged_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Error fetching indexing events:', err);
    res.status(500).json({ error: 'Failed to fetch indexing events' });
  }
});

router.post('/ping', requireAuth, async (req, res) => {
  const { postUrl, postSlug } = req.body;

  if (!postUrl || !postSlug) {
    return res.status(400).json({ error: 'postUrl and postSlug are required' });
  }

  try {
    const supabase = getSupabaseClient();
    const { pingSearchEngines } = await import('../utils/searchPing.js');

    const results = await pingSearchEngines(postUrl, postSlug);

    await supabase.from('indexing_events').insert({
      post_url: postUrl,
      post_slug: postSlug,
      event_type: 'manual_request',
      ping_results: results || [],
      pinged_at: new Date().toISOString(),
    }).then(() => {});

    res.json({ success: true, message: 'Search engine ping sent successfully' });
  } catch (err) {
    console.error('Error sending manual ping:', err);
    res.status(500).json({ error: 'Failed to send ping' });
  }
});

router.get('/stats', requireAuth, async (_req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('indexing_events')
      .select('event_type, post_url, ping_results, pinged_at')
      .order('pinged_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    const events = data || [];
    const totalPings = events.length;
    const uniqueUrls = new Set(events.map((e: any) => e.post_url || '')).size;
    const last24h = events.filter((e: any) => {
      const ts = new Date(e.pinged_at).getTime();
      return Date.now() - ts < 86400000;
    }).length;

    let successCount = 0;
    let errorCount = 0;
    for (const event of events) {
      const results: any[] = event.ping_results || [];
      for (const r of results) {
        if (r.status === 'success') successCount++;
        else errorCount++;
      }
    }

    res.json({ totalPings, uniqueUrls, last24h, successCount, errorCount });
  } catch (err) {
    console.error('Error fetching indexing stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
