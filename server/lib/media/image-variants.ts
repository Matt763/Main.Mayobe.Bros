import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const defaultSupabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// ─── Test seam ───────────────────────────────────────────────────────────────
type Uploader = (path: string, buf: Buffer, mime: string) => Promise<string>;
let storageUpload: Uploader | null = null;
export function _setStorageMock(fn: Uploader | null): void { storageUpload = fn; }

const WIDTHS = [400, 800, 1200, 1600] as const;
const WEBP_QUALITY = 82;
const AVIF_QUALITY = 65;

export interface Variants {
  original: string;
  webp: Record<string, string>;
  avif: Record<string, string>;
  width:  number;
  height: number;
  size:   number;
}

export interface ProcessResult {
  url: string;          // largest WebP — used as legacy single URL
  variants: Variants;
}

/** Generate multi-variant WebP+AVIF + original archive for a raw image buffer,
 *  upload to Supabase Storage `media` bucket, return variants jsonb + the
 *  largest-WebP URL for legacy single-URL callers.
 *
 *  - Caps target widths at the source width (no upscaling)
 *  - Bakes EXIF orientation into pixels, then strips other EXIF (privacy + size)
 *  - All uploads run in parallel
 */
export async function processAndStoreImage(input: Buffer, _hint: string): Promise<ProcessResult> {
  const id = randomUUID();

  // Probe source metadata FIRST so we know dimensions + can filter widths
  const meta = await sharp(input).metadata();
  const sourceWidth  = meta.width  ?? 0;
  const sourceHeight = meta.height ?? 0;
  if (sourceWidth === 0) throw new Error('Image has no detectable width');
  const sourceFormat = meta.format ?? 'jpg';

  // Cap widths at source — don't upscale
  const targets = WIDTHS.filter((w) => w <= sourceWidth);
  if (targets.length === 0) targets.push(sourceWidth as 400);   // type-narrow ok for non-empty

  // Each variant gets a fresh sharp pipeline that strips EXIF (rotate() bakes
  // orientation; withMetadata false-by-default removes the rest)
  const tasks: Promise<{ kind: 'webp' | 'avif' | 'original'; width?: number; url: string }>[] = [];

  for (const w of targets) {
    tasks.push(
      sharp(input).rotate().resize({ width: w }).webp({ quality: WEBP_QUALITY }).toBuffer()
        .then((b) => uploadVariant(`media/${id}/${w}.webp`, b, 'image/webp').then((url) => ({ kind: 'webp' as const, width: w, url })))
    );
    tasks.push(
      sharp(input).rotate().resize({ width: w }).avif({ quality: AVIF_QUALITY }).toBuffer()
        .then((b) => uploadVariant(`media/${id}/${w}.avif`, b, 'image/avif').then((url) => ({ kind: 'avif' as const, width: w, url })))
    );
  }
  // Original archive (in source format)
  tasks.push(
    uploadVariant(`media/${id}/original.${sourceFormat}`, input, `image/${sourceFormat}`)
      .then((url) => ({ kind: 'original' as const, url })),
  );

  const results = await Promise.all(tasks);

  const variants: Variants = {
    original: '',
    webp: {} as Record<string, string>,
    avif: {} as Record<string, string>,
    width:  sourceWidth,
    height: sourceHeight,
    size:   input.byteLength,
  };
  for (const r of results) {
    if (r.kind === 'original') variants.original = r.url;
    else if (r.width !== undefined) variants[r.kind][String(r.width)] = r.url;
  }

  // Largest WebP as the default URL (for legacy callers that only know about
  // a single `featured_image` string).
  const largest = Math.max(...targets);
  const url = variants.webp[String(largest)];

  return { url, variants };
}

async function uploadVariant(path: string, buf: Buffer, mime: string): Promise<string> {
  if (storageUpload) return storageUpload(path, buf, mime);
  if (!defaultSupabase) throw new Error('Supabase client unavailable for variant upload');
  const { error } = await defaultSupabase.storage.from('media').upload(path, buf, {
    contentType: mime, cacheControl: '31536000',
  });
  if (error) throw new Error(`Storage upload failed for ${path}: ${error.message}`);
  const { data } = defaultSupabase.storage.from('media').getPublicUrl(path);
  return data.publicUrl;
}
