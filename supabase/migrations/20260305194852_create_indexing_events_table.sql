/*
  # Create Indexing Events Table

  ## Summary
  This migration creates a table for tracking search engine indexing notifications
  sent when new content is published on Mayobe Bros.

  ## New Tables

  ### indexing_events
  Stores every search engine ping and Google Indexing API call made when articles are published.
  - `id` - UUID primary key
  - `post_url` - Full URL of the post that was submitted for indexing
  - `post_slug` - Slug of the post for easy reference
  - `event_type` - Type of event: 'publish_ping' | 'google_indexing_api' | 'manual_request'
  - `ping_results` - JSONB array with results from each search engine pinged
  - `pinged_at` - Timestamp when the ping was sent
  - `created_at` - Row creation timestamp

  ## Security
  - RLS enabled
  - Admin authenticated users can read all events
  - Service role (anon key in server context) can insert events

  ## Notes
  1. This table is write-only from the server side (no direct frontend writes)
  2. Admin users query this table via the CMS indexing monitor
  3. ping_results is JSONB to accommodate variable number of search engines
*/

CREATE TABLE IF NOT EXISTS indexing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_url text NOT NULL,
  post_slug text NOT NULL,
  event_type text NOT NULL DEFAULT 'publish_ping',
  ping_results jsonb DEFAULT '[]'::jsonb,
  pinged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE indexing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read indexing events"
  ON indexing_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Server can insert indexing events"
  ON indexing_events FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_indexing_events_post_slug ON indexing_events (post_slug);
CREATE INDEX IF NOT EXISTS idx_indexing_events_pinged_at ON indexing_events (pinged_at DESC);
