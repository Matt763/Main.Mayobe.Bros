import { Router } from 'express';
import express from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { verifyBunnyWebhookSignature } from '../../lib/media/webhook-verify.js';
import { bunnyPosterUrl, bunnyHlsUrl, bunnyIframeUrl } from '../../lib/media/bunny.js';

const BUNNY_WEBHOOK_SECRET = process.env.BUNNY_WEBHOOK_SECRET || '';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Bunny Stream status codes (from their docs):
//   0 = Queued       3 = Finished but encoding
//   1 = Processing   4 = Finished
//   2 = Encoding     5 = Failed
const STATUS_FINISHED = 4;
const STATUS_FAILED   = 5;
const STATUS_ENCODING_RANGE = new Set([1, 2, 3]);

const router = Router();

// Raw body middleware ONLY for this route so the HMAC compute matches what
// Bunny signed. Mounted before global express.json() in server/index.ts.
router.post(
  '/bunny',
  express.raw({ type: 'application/json', limit: '1mb' }),
  async (req, res) => {
    const rawBody = (req.body as Buffer)?.toString('utf8') ?? '';
    const signature = req.header('X-Webhook-Signature') ?? req.header('x-webhook-signature') ?? '';

    if (!verifyBunnyWebhookSignature(rawBody, signature, BUNNY_WEBHOOK_SECRET)) {
      return res.status(401).json({ error: 'BAD_SIGNATURE' });
    }

    let payload: { VideoLibraryId?: string | number; VideoGuid?: string; Status?: number; Length?: number; ErrorMessage?: string };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return res.status(400).json({ error: 'BAD_JSON' });
    }

    const { VideoGuid, Status, Length, ErrorMessage } = payload;
    if (!VideoGuid) return res.status(400).json({ error: 'MISSING_GUID' });
    if (!supabase) return res.status(500).json({ error: 'NO_DB' });

    const now = new Date().toISOString();

    if (Status === STATUS_FINISHED) {
      const update = await supabase.from('videos').update({
        status: 'ready',
        poster_url:        bunnyPosterUrl(VideoGuid),
        hls_url:           bunnyHlsUrl(VideoGuid),
        iframe_url:        bunnyIframeUrl(VideoGuid),
        duration_seconds:  Length ?? null,
        updated_at:        now,
      }).eq('bunny_video_id', VideoGuid).select('id').maybeSingle();
      if (!update.data) {
        return res.json({ ok: true, ignored: 'unknown_guid' });
      }
    } else if (Status === STATUS_FAILED) {
      await supabase.from('videos').update({
        status: 'failed',
        error_message: ErrorMessage ?? 'Unknown encoding error',
        updated_at: now,
      }).eq('bunny_video_id', VideoGuid);
    } else if (typeof Status === 'number' && STATUS_ENCODING_RANGE.has(Status)) {
      await supabase.from('videos').update({
        status: 'encoding',
        updated_at: now,
      }).eq('bunny_video_id', VideoGuid);
    }
    // Any other Status (0=queued, etc.) — no-op.

    return res.json({ ok: true });
  },
);

export default router;
