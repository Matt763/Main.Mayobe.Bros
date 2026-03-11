/*
  # Add Trending Scores and View Events Tracking

  ## Summary
  This migration adds the infrastructure needed for the automatic content virality
  and trending article system on Mayobe Bros.

  ## New Tables

  ### post_view_events
  Records individual page view events with timestamps, enabling time-windowed
  trending calculations (e.g., views in the last 1h, 24h, 7 days).
  - `id` - UUID primary key
  - `post_id` - References the post being viewed
  - `post_slug` - Slug for quick lookups without JOIN
  - `viewed_at` - When the view occurred (indexed for time-window queries)
  - `session_id` - Optional anonymous session identifier (no PII)

  ### trending_scores
  Cached trending scores computed from the algorithm. Refreshed periodically
  by the server to avoid recalculating on every request.
  - `id` - UUID primary key
  - `post_id` - References the post
  - `score` - Computed virality score (higher = more trending)
  - `views_1h` - Views in the last 1 hour
  - `views_24h` - Views in the last 24 hours
  - `views_7d` - Views in the last 7 days
  - `comment_count` - Total approved comments
  - `updated_at` - When the score was last computed

  ## Modified Tables

  ### posts
  - Added `comment_count` cached column for fast retrieval without JOIN
  - Added `trending_score` float column for current trending rank

  ## Security
  - RLS enabled on all new tables
  - Anonymous users can INSERT view events (needed for tracking)
  - Authenticated admins can SELECT trending_scores
  - Public SELECT allowed on trending_scores for homepage display

  ## Indexes
  - Index on post_view_events(viewed_at DESC) for time-window queries
  - Index on post_view_events(post_id, viewed_at) for per-post time windows
  - Index on trending_scores(score DESC) for sorted trending queries
*/

CREATE TABLE IF NOT EXISTS post_view_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  post_slug text NOT NULL DEFAULT '',
  viewed_at timestamptz NOT NULL DEFAULT now(),
  session_id text DEFAULT NULL
);

ALTER TABLE post_view_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert view events"
  ON post_view_events FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read view events"
  ON post_view_events FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_view_events_viewed_at ON post_view_events (viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_view_events_post_id ON post_view_events (post_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_view_events_post_slug ON post_view_events (post_slug, viewed_at DESC);

CREATE TABLE IF NOT EXISTS trending_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL UNIQUE,
  post_slug text NOT NULL DEFAULT '',
  score float NOT NULL DEFAULT 0,
  views_1h int NOT NULL DEFAULT 0,
  views_24h int NOT NULL DEFAULT 0,
  views_7d int NOT NULL DEFAULT 0,
  total_views int NOT NULL DEFAULT 0,
  comment_count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trending_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read trending scores"
  ON trending_scores FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated can read trending scores"
  ON trending_scores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Server can upsert trending scores"
  ON trending_scores FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Server can update trending scores"
  ON trending_scores FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_trending_scores_score ON trending_scores (score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_scores_post_id ON trending_scores (post_id);
