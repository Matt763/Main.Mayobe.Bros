/*
  # Create Editorial Reviews Table

  ## Purpose
  Stores AI-generated editorial review results for articles, so the CEO
  can track review history and compare improvements over time.

  ## New Tables

  ### editorial_reviews
  - `id` (uuid, primary key)
  - `post_id` (uuid, nullable) - links to posts table if post exists
  - `post_title` (text) - article title at time of review
  - `overall_score` (integer) - 0-100 overall quality score
  - `verdict` (text) - Publish Ready | Needs Minor Edits | Needs Major Revision | Not Ready
  - `review_data` (jsonb) - full AI review JSON (dimensions, scores, etc.)
  - `readability_data` (jsonb, nullable) - readability analysis results
  - `seo_data` (jsonb, nullable) - SEO analysis results
  - `headline_data` (jsonb, nullable) - headline analysis results
  - `engagement_data` (jsonb, nullable) - engagement analysis results
  - `checklist_data` (jsonb, nullable) - pre-publish checklist results
  - `suggestions_data` (jsonb, nullable) - improvement suggestions
  - `reviewed_by` (uuid) - auth user id (CEO)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled
  - Only the reviewing user (CEO) can read/write their own reviews
*/

CREATE TABLE IF NOT EXISTS editorial_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid,
  post_title text NOT NULL DEFAULT '',
  overall_score integer NOT NULL DEFAULT 0,
  verdict text NOT NULL DEFAULT 'Not Ready',
  review_data jsonb,
  readability_data jsonb,
  seo_data jsonb,
  headline_data jsonb,
  engagement_data jsonb,
  checklist_data jsonb,
  suggestions_data jsonb,
  reviewed_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT editorial_reviews_score_check CHECK (overall_score >= 0 AND overall_score <= 100)
);

ALTER TABLE editorial_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own editorial reviews"
  ON editorial_reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = reviewed_by);

CREATE POLICY "Users can insert own editorial reviews"
  ON editorial_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reviewed_by);

CREATE POLICY "Users can update own editorial reviews"
  ON editorial_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = reviewed_by)
  WITH CHECK (auth.uid() = reviewed_by);

CREATE POLICY "Users can delete own editorial reviews"
  ON editorial_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = reviewed_by);

CREATE INDEX IF NOT EXISTS idx_editorial_reviews_reviewed_by ON editorial_reviews(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_editorial_reviews_post_id ON editorial_reviews(post_id);
CREATE INDEX IF NOT EXISTS idx_editorial_reviews_created_at ON editorial_reviews(created_at DESC);
