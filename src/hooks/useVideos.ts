/** Plain-React hooks for the Bunny Stream video admin pages.
 *  Slice 3 uses plain useState/useEffect rather than React Query to avoid a
 *  dep coordination across feature branches (Slice 1 adds @tanstack/react-query
 *  separately). After all slices merge to main, these can be refactored to
 *  match the usePrompts / useAutopilot patterns.
 */

import { useCallback, useEffect, useState } from 'react';

export interface Video {
  id: string;
  bunny_video_id: string;
  bunny_library_id: string;
  title: string | null;
  description: string | null;
  status: 'uploading' | 'encoding' | 'ready' | 'failed';
  poster_url: string | null;
  hls_url: string | null;
  iframe_url: string | null;
  duration_seconds: number | null;
  size_bytes: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface UseVideosListResult {
  videos: Video[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVideosList(opts: { limit?: number; offset?: number; status?: string; pollMs?: number } = {}): UseVideosListResult {
  const { limit = 20, offset = 0, status, pollMs } = opts;
  const [videos, setVideos] = useState<Video[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
      if (status) params.set('status', status);
      const r = await fetch(`/api/admin/videos?${params.toString()}`);
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
      setVideos(body.videos ?? []);
      setTotal(body.total ?? 0);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [limit, offset, status]);

  useEffect(() => { refetch(); }, [refetch]);

  // Auto-poll if there's a video in a non-terminal state
  useEffect(() => {
    if (!pollMs) return;
    const hasPending = videos.some((v) => v.status === 'uploading' || v.status === 'encoding');
    if (!hasPending) return;
    const t = setInterval(refetch, pollMs);
    return () => clearInterval(t);
  }, [videos, pollMs, refetch]);

  return { videos, total, loading, error, refetch };
}

export interface InitUploadResponse {
  ok: boolean;
  video: Video;
  uploadUrl: string;
  accessKey: string;
}

export async function initVideoUpload(title: string, description?: string): Promise<InitUploadResponse> {
  const r = await fetch('/api/admin/videos/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description }),
  });
  const body = await r.json();
  if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
  return body as InitUploadResponse;
}

export async function deleteVideo(id: string): Promise<void> {
  const r = await fetch(`/api/admin/videos/${id}`, { method: 'DELETE' });
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${r.status}`);
  }
}

/** Stream a file directly to Bunny via PUT. Browser-only — bypasses our server.
 *  Reports upload progress via the optional callback (0-100). */
export function directUploadToBunny(
  uploadUrl: string,
  accessKey: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('AccessKey', accessKey);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress((e.loaded / e.total) * 100);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload to Bunny failed: HTTP ${xhr.status} ${xhr.statusText}`));
    };
    xhr.onerror = () => reject(new Error('Network error during direct-upload to Bunny'));
    xhr.send(file);
  });
}

/** Public: load videos by ids (for post body [video:<id>] resolution). */
export async function fetchVideosByIds(ids: string[]): Promise<Video[]> {
  if (ids.length === 0) return [];
  const r = await fetch('/api/admin/videos/by-ids', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!r.ok) return [];
  const body = await r.json();
  return body.videos ?? [];
}
