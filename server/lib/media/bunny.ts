const BUNNY_API_KEY  = process.env.BUNNY_STREAM_API_KEY   || '';
const BUNNY_LIBRARY  = process.env.BUNNY_STREAM_LIBRARY_ID || '';
const BUNNY_CDN_HOST = process.env.BUNNY_CDN_HOST          || '';
const BASE = 'https://video.bunnycdn.com';

export interface BunnyVideoRef {
  guid: string;
  libraryId: string;
}

export function isBunnyConfigured(): boolean {
  return !!(BUNNY_API_KEY && BUNNY_LIBRARY && BUNNY_CDN_HOST);
}

/** Create a video object on Bunny Stream and return its guid. */
export async function bunnyCreateVideo(title: string): Promise<BunnyVideoRef> {
  if (!isBunnyConfigured()) throw new Error('Bunny Stream not configured');
  const r = await fetch(`${BASE}/library/${BUNNY_LIBRARY}/videos`, {
    method: 'POST',
    headers: { 'AccessKey': BUNNY_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`Bunny createVideo ${r.status}: ${body}`);
  }
  const body = await r.json();
  if (!body?.guid) throw new Error('Bunny createVideo response missing guid');
  return { guid: body.guid, libraryId: BUNNY_LIBRARY };
}

/** Delete a video from Bunny Stream. 404 is treated as success (already gone). */
export async function bunnyDeleteVideo(guid: string): Promise<void> {
  if (!isBunnyConfigured()) throw new Error('Bunny Stream not configured');
  const r = await fetch(`${BASE}/library/${BUNNY_LIBRARY}/videos/${guid}`, {
    method: 'DELETE',
    headers: { 'AccessKey': BUNNY_API_KEY },
  });
  if (!r.ok && r.status !== 404) {
    throw new Error(`Bunny deleteVideo ${r.status}`);
  }
}

/** Direct-upload URL — the browser PUTs the file here, never our server. */
export function bunnyDirectUploadUrl(guid: string): string {
  return `${BASE}/library/${BUNNY_LIBRARY}/videos/${guid}`;
}

/** The API key the browser needs to send with the PUT. */
export function bunnyAccessKey(): string {
  return BUNNY_API_KEY;
}

export function bunnyPosterUrl(guid: string): string {
  return `https://${BUNNY_CDN_HOST}/${guid}/thumbnail.jpg`;
}

export function bunnyHlsUrl(guid: string): string {
  return `https://${BUNNY_CDN_HOST}/${guid}/playlist.m3u8`;
}

export function bunnyIframeUrl(guid: string): string {
  return `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY}/${guid}`;
}
