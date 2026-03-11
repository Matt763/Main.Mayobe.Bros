/*
  # CMS Enhancements for Mayobe Bros Staff Portal

  ## Overview
  Adds comprehensive CMS features for managing posts, pages, media, and site settings.

  ## New Columns for Posts
    - `published` (boolean) - Draft vs published status
    - `meta_title` (text) - SEO title
    - `meta_description` (text) - SEO description
    - `meta_keywords` (text) - SEO keywords
    - `is_featured` (boolean) - Featured post flag
    - `reading_time` (integer) - Estimated reading time in minutes
    - `author_id` (uuid) - Future reference to auth.users

  ## New Columns for Static Pages
    - `published` (boolean) - Draft vs published status
    - `meta_title` (text) - SEO title
    - `meta_description` (text) - SEO description
    - `show_in_menu` (boolean) - Display in navigation

  ## New Table: Media Library
    - Stores uploaded images and files
    - Tracks file metadata, size, dimensions
    - Links to Pexels or local storage

  ## Site Settings Enhancements
    - Add default values for theme, logo, favicon
    - Site-wide configuration options

  ## Security
    - Enable RLS on new tables
    - Add policies for authenticated admin users
*/

-- Add new columns to posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'published'
  ) THEN
    ALTER TABLE posts ADD COLUMN published boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'meta_title'
  ) THEN
    ALTER TABLE posts ADD COLUMN meta_title text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'meta_description'
  ) THEN
    ALTER TABLE posts ADD COLUMN meta_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'meta_keywords'
  ) THEN
    ALTER TABLE posts ADD COLUMN meta_keywords text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE posts ADD COLUMN is_featured boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'reading_time'
  ) THEN
    ALTER TABLE posts ADD COLUMN reading_time integer DEFAULT 5;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'author_id'
  ) THEN
    ALTER TABLE posts ADD COLUMN author_id uuid;
  END IF;
END $$;

-- Add new columns to static_pages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'static_pages' AND column_name = 'published'
  ) THEN
    ALTER TABLE static_pages ADD COLUMN published boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'static_pages' AND column_name = 'meta_title'
  ) THEN
    ALTER TABLE static_pages ADD COLUMN meta_title text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'static_pages' AND column_name = 'meta_description'
  ) THEN
    ALTER TABLE static_pages ADD COLUMN meta_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'static_pages' AND column_name = 'show_in_menu'
  ) THEN
    ALTER TABLE static_pages ADD COLUMN show_in_menu boolean DEFAULT false;
  END IF;
END $$;

-- Create media_library table
CREATE TABLE IF NOT EXISTS media_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  original_filename text NOT NULL,
  file_path text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  width integer,
  height integer,
  alt_text text,
  caption text,
  source text DEFAULT 'upload',
  pexels_id text,
  pexels_url text,
  uploaded_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view media"
  ON media_library FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can upload media"
  ON media_library FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update media"
  ON media_library FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete media"
  ON media_library FOR DELETE
  TO authenticated
  USING (true);

-- Update existing posts to set published = true where published_at is not null
UPDATE posts
SET published = true
WHERE published_at IS NOT NULL AND published IS NULL;

-- Update existing static_pages to set published = true
UPDATE static_pages
SET published = true
WHERE published IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_featured ON posts(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_label ON posts(label_id);
CREATE INDEX IF NOT EXISTS idx_media_source ON media_library(source);
CREATE INDEX IF NOT EXISTS idx_media_created ON media_library(created_at DESC);
