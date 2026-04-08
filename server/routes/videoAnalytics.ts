import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

/**
 * POST /api/video-analytics
 * Fire-and-forget analytics for video play events.
 * Body: { event, videoSrc, page, type, watchTimeSec }
 */
router.post('/', async (req, res) => {
  try {
    const { event, videoSrc, page, type, watchTimeSec } = req.body;

    if (!event || !videoSrc) {
      return res.status(400).json({ error: 'event and videoSrc are required' });
    }

    await supabase.from('video_analytics').insert({
      event: String(event).slice(0, 50),
      video_src: String(videoSrc).slice(0, 500),
      page: String(page || '').slice(0, 500),
      video_type: String(type || 'unknown').slice(0, 50),
      watch_time_sec: typeof watchTimeSec === 'number' ? watchTimeSec : 0,
      ip: req.ip,
      user_agent: req.headers['user-agent']?.slice(0, 300) || null,
    });

    res.json({ ok: true });
  } catch (err) {
    // Never fail loudly — analytics should never break UX
    console.warn('[videoAnalytics] insert failed:', err);
    res.json({ ok: true });
  }
});

export default router;
