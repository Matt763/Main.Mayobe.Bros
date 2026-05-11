import { Router, type Request, type Response } from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireAuth } from '../../middleware/auth.js';
import { processAndStoreImage } from '../../lib/media/image-variants.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const BATCH = 25;

const router = Router();
router.use(requireAuth);

/** Chunked one-time backfill: re-process up to 25 existing media_library
 *  rows that don't have variants yet. Idempotent — call repeatedly until
 *  remaining === 0. Skips non-image entries (file_type doesn't start with
 *  'image/') so video uploads (Slice 3 future) aren't disturbed. */
router.post('/backfill-variants', async (_req: Request, res: Response) => {
  if (!supabase) return res.status(500).json({ error: 'NO_DB' });

  const { data: pending } = await supabase
    .from('media_library')
    .select('id, file_url, filename, file_type')
    .is('variants', null)
    .like('file_type', 'image/%')
    .limit(BATCH);

  if (!pending || pending.length === 0) {
    const { count } = await supabase
      .from('media_library')
      .select('id', { count: 'exact', head: true })
      .is('variants', null)
      .like('file_type', 'image/%');
    return res.json({ done: 0, remaining: count ?? 0 });
  }

  let done = 0;
  const errors: { id: string; reason: string }[] = [];

  for (const m of pending) {
    try {
      // Download the original file from Storage
      const r = await fetch(m.file_url);
      if (!r.ok) {
        errors.push({ id: m.id, reason: `fetch ${r.status}` });
        continue;
      }
      const buf = Buffer.from(await r.arrayBuffer());
      const result = await processAndStoreImage(buf, m.filename ?? m.id);
      const { error } = await supabase
        .from('media_library')
        .update({ variants: result.variants })
        .eq('id', m.id);
      if (error) {
        errors.push({ id: m.id, reason: error.message });
        continue;
      }
      done++;
    } catch (e) {
      errors.push({ id: m.id, reason: (e as Error).message });
    }
  }

  // Remaining count after this batch
  const { count } = await supabase
    .from('media_library')
    .select('id', { count: 'exact', head: true })
    .is('variants', null)
    .like('file_type', 'image/%');

  return res.json({ done, remaining: count ?? 0, errors });
});

export default router;
