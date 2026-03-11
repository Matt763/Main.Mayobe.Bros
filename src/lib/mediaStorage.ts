import { supabase } from './supabase';

export interface MediaItem {
  id: string;
  filename: string;
  originalFilename: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  width: number;
  height: number;
  source: 'upload' | 'pexels' | 'url';
  altText?: string;
  pexelsId?: string;
  createdAt: string;
}

export function isVideo(item: MediaItem): boolean {
  return item.fileType.startsWith('video/') || /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(item.filename);
}

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

function mapRow(row: any): MediaItem {
  return {
    id: row.id,
    filename: row.filename,
    originalFilename: row.original_filename || row.filename,
    fileUrl: row.file_url,
    fileType: row.file_type || 'image/jpeg',
    fileSize: row.file_size || 0,
    width: row.width || 0,
    height: row.height || 0,
    source: row.source || 'upload',
    altText: row.alt_text || '',
    pexelsId: row.pexels_id || '',
    createdAt: row.created_at || '',
  };
}

export async function listMedia(): Promise<MediaItem[]> {
  const { data, error } = await supabase
    .from('media_library')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapRow);
}

export async function uploadMedia(file: File): Promise<MediaItem> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: storageErr } = await supabase.storage
    .from('media')
    .upload(filename, file, { contentType: file.type, upsert: false });

  if (storageErr) throw new Error(storageErr.message);

  const { data: urlData } = supabase.storage.from('media').getPublicUrl(filename);
  const publicUrl = urlData.publicUrl;

  const { data: row, error: dbErr } = await supabase
    .from('media_library')
    .insert({
      filename,
      original_filename: file.name,
      file_path: filename,
      file_url: publicUrl,
      file_type: file.type,
      file_size: file.size,
      source: 'upload',
    })
    .select()
    .single();

  if (dbErr) throw new Error(dbErr.message);
  return mapRow(row);
}

export async function saveExternalMedia(params: {
  url: string;
  filename: string;
  originalFilename: string;
  fileType?: string;
  width?: number;
  height?: number;
  source: 'pexels' | 'url';
  pexelsId?: string;
  altText?: string;
}): Promise<MediaItem> {
  const { data: row, error } = await supabase
    .from('media_library')
    .insert({
      filename: params.filename,
      original_filename: params.originalFilename,
      file_path: params.url,
      file_url: params.url,
      file_type: params.fileType || 'image/jpeg',
      file_size: 0,
      width: params.width || 0,
      height: params.height || 0,
      source: params.source,
      pexels_id: params.pexelsId || null,
      alt_text: params.altText || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapRow(row);
}

export async function deleteMedia(item: MediaItem): Promise<void> {
  if (item.source === 'upload') {
    await supabase.storage.from('media').remove([item.filename]);
  }
  const { error } = await supabase.from('media_library').delete().eq('id', item.id);
  if (error) throw new Error(error.message);
}

export async function searchPexels(query: string, page = 1): Promise<{ photos: any[]; total: number }> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const res = await fetch(
    `${supabaseUrl}/functions/v1/pexels-search?query=${encodeURIComponent(query)}&per_page=24&page=${page}`,
    { headers: { Authorization: `Bearer ${anonKey}`, apikey: anonKey } }
  );

  if (!res.ok) throw new Error('Failed to search Pexels');
  const data = await res.json();
  return { photos: data.photos || [], total: data.total_results || 0 };
}
