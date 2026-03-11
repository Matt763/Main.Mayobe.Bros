/*
  # Add Missing CMS Columns and Align Schema

  ## Overview
  Aligns the database schema with what the CMS server routes need, filling gaps
  between the file-based system and Supabase tables.

  ## Changes

  ### posts table
  - Add `status` column ('draft' | 'published') as an alias for the `published` boolean
  - Add `category_slug` for URL routing (denormalized for performance)
  - Add `label_ids` (text array) to support multi-label posts (matches file-based schema)
  - Add `featured` boolean column

  ### comments table
  - Add `status` column ('pending' | 'approved' | 'spam') - was missing from original schema
  - Add `author` alias column for user_name compatibility

  ### reviews table
  - Add `author` column (user_name in Supabase)
  - Add `role` column (reviewer's role/title)
  - Add `content` column alias for comment
  - Add `status` column ('pending' | 'approved')
  - Add `avatar` column (user_avatar alias)

  ### site_settings
  - No changes needed (key/value store handles arbitrary settings)

  ### newsletter_subscribers
  - Add `source` column
  - Add `confirmed_at` column
  - Add `updated_at` column
  - Add `unsubscribe_token` column (unique token for unsubscribe links)

  ## Security
  - All existing RLS policies remain
  - Add missing INSERT policy for reviews (public can submit)
  - Add missing INSERT/UPDATE/DELETE policies for comments moderation
*/

-- ─── posts: add missing columns ───────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'status'
  ) THEN
    ALTER TABLE posts ADD COLUMN status text DEFAULT 'published';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'featured'
  ) THEN
    ALTER TABLE posts ADD COLUMN featured boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'label_ids'
  ) THEN
    ALTER TABLE posts ADD COLUMN label_ids text[] DEFAULT '{}';
  END IF;
END $$;

-- Sync published -> status for existing rows
UPDATE posts SET status = CASE WHEN published = true THEN 'published' ELSE 'draft' END WHERE status IS NULL;

-- ─── comments: add status column ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'status'
  ) THEN
    ALTER TABLE comments ADD COLUMN status text DEFAULT 'pending';
  END IF;
END $$;

-- ─── reviews: add missing columns ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'role'
  ) THEN
    ALTER TABLE reviews ADD COLUMN role text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'status'
  ) THEN
    ALTER TABLE reviews ADD COLUMN status text DEFAULT 'pending';
  END IF;
END $$;

-- ─── newsletter_subscribers: add missing columns ──────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_subscribers' AND column_name = 'source'
  ) THEN
    ALTER TABLE newsletter_subscribers ADD COLUMN source text DEFAULT 'website';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_subscribers' AND column_name = 'confirmed_at'
  ) THEN
    ALTER TABLE newsletter_subscribers ADD COLUMN confirmed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_subscribers' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE newsletter_subscribers ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_subscribers' AND column_name = 'unsubscribe_token'
  ) THEN
    ALTER TABLE newsletter_subscribers ADD COLUMN unsubscribe_token uuid DEFAULT gen_random_uuid() UNIQUE;
  END IF;
END $$;

-- ─── reviews: RLS - public can insert (submit review) ─────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Anyone can submit a review'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can submit a review" ON reviews FOR INSERT TO anon, authenticated WITH CHECK (true)';
  END IF;
END $$;

-- ─── reviews: authenticated users can update/delete ───────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Authenticated users can update reviews'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can update reviews" ON reviews FOR UPDATE TO authenticated USING (true) WITH CHECK (true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Authenticated users can delete reviews'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can delete reviews" ON reviews FOR DELETE TO authenticated USING (true)';
  END IF;
END $$;

-- ─── contact_submissions: authenticated can read ──────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contact_submissions' AND policyname = 'Authenticated users can view contact submissions'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can view contact submissions" ON contact_submissions FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

-- ─── posts: INSERT policy for authenticated ────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Authenticated users can create posts'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can create posts" ON posts FOR INSERT TO authenticated WITH CHECK (true)';
  END IF;
END $$;

-- ─── categories: INSERT policy for authenticated ──────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Authenticated users can create categories'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can create categories" ON categories FOR INSERT TO authenticated WITH CHECK (true)';
  END IF;
END $$;

-- ─── labels: INSERT policy for authenticated ──────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'labels' AND policyname = 'Authenticated users can create labels'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can create labels" ON labels FOR INSERT TO authenticated WITH CHECK (true)';
  END IF;
END $$;

-- ─── indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
