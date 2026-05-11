import { Router, type Request, type Response } from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireAuth } from '../../middleware/auth.js';
import {
  isBunnyConfigured, bunnyCreateVideo, bunnyDeleteVideo,
  bunnyDirectUploadUrl, bunnyAccessKey,
} from '../../lib/media/bunny.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const router = Router();
router.use(requireAuth);

// ─── List videos ─────────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  if (!supabase) return res.json({ videos: [], total: 0 });
  const limit  = Math.min(Number(req.query.limit  ?? 20), 100);
  const offset = Number(req.query.offset ?? 0);
  const statusFilter = req.query.status as string | undefined;
  let q = supabase.from('videos').select('*', { count: 'exact' });
  if (statusFilter) q = q.eq('status', statusFilter);
  const { data, count } = await q.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  return res.json({ videos: data ?? [], total: count ?? 0 });
});

// ─── Init upload (Bunny create video + return direct-upload URL) ─────────────
router.post('/init', async (req: Request, res: Response) => {
  if (!isBunnyConfigured()) return res.status(503).json({ error: 'BUNNY_NOT_CONFIGURED', detail: 'Set BUNNY_STREAM_API_KEY, BUNNY_STREAM_LIBRARY_ID, BUNNY_WEBHOOK_SECRET, BUNNY_CDN_HOST.' });
  if (!supabase) return res.status(500).json({ error: 'NO_DB' });

  const { title, description } = req.body as { title?: string; description?: string };
  if (!title || !title.trim()) return res.status(400).json({ error: 'MISSING_TITLE' });

  let ref;
  try {
    ref = await bunnyCreateVideo(title);
  } catch (e) {
    return res.status(502).json({ error: 'BUNNY_FAILED', detail: (e as Error).message });
  }

  const userId = (req as unknown as { user?: { id?: string } }).user?.id ?? null;
  const { data, error } = await supabase.from('videos').insert({
    bunny_video_id:   ref.guid,
    bunny_library_id: ref.libraryId,
    title,
    description: description ?? null,
    status: 'uploading',
    created_by: userId,
  }).select('*').single();
  if (error) return res.status(500).json({ error: 'DB_ERROR', detail: error.message });

  return res.json({
    ok: true,
    video: data,
    uploadUrl: bunnyDirectUploadUrl(ref.guid),
    accessKey: bunnyAccessKey(),
  });
});

// ─── Delete (Bunny + local DB) ───────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  if (!supabase) return res.status(500).json({ error: 'NO_DB' });
  const { data: vid } = await supabase.from('videos').select('bunny_video_id').eq('id', req.params.id).maybeSingle();
  if (!vid) return res.status(404).json({ error: 'NOT_FOUND' });

  try {
    await bunnyDeleteVideo(vid.bunny_video_id);
  } catch (e) {
    console.warn('bunny delete failed (continuing with DB delete):', (e as Error).message);
  }
  await supabase.from('videos').delete().eq('id', req.params.id);
  return res.json({ ok: true });
});

// ─── Public read-by-ids (used by post render for [video:<id>] embeds) ────────
router.post('/by-ids', async (req: Request, res: Response) => {
  if (!supabase) return res.json({ videos: [] });
  const { ids } = req.body as { ids?: string[] };
  if (!Array.isArray(ids) || ids.length === 0) return res.json({ videos: [] });
  const safeIds = ids.filter((id) => typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id)).slice(0, 100);
  if (safeIds.length === 0) return res.json({ videos: [] });
  const { data } = await supabase
    .from('videos')
    .select('id, bunny_video_id, title, poster_url, hls_url, iframe_url, duration_seconds, status')
    .in('id', safeIds)
    .eq('status', 'ready');
  return res.json({ videos: data ?? [] });
});

export default router;
