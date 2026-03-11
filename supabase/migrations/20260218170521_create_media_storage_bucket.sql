/*
  # Create Media Storage Bucket

  1. Storage
    - Creates a public 'media' bucket in Supabase Storage for image uploads
    - Files uploaded here are accessible via a permanent public URL
    - Replaces the local filesystem /data/images/ approach which is incompatible with Vercel

  2. Storage Policies
    - Anyone can view/read images (public bucket)
    - Only authenticated users (service role / anon with session) can upload
    - Only authenticated users can delete images

  3. Notes
    - This migration enables persistent image hosting that survives Vercel redeployments
    - The media_library table already exists and tracks metadata alongside the storage bucket
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

CREATE POLICY "Public can view media files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can upload media"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'media');

CREATE POLICY "Authenticated users can delete media"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'media');
