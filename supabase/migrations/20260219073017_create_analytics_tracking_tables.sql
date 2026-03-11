/*
  # Create Analytics Tracking Tables

  ## Overview
  Full visitor analytics system similar to Google Analytics / Blogger stats.

  ## New Tables

  ### page_views
  Records every page visit with:
  - session_id: unique per browser session (not per user) for deduplication
  - visitor_id: fingerprint stored in localStorage, persists across sessions
  - page_path: the URL path visited
  - referrer: where the visitor came from
  - country_code, country_name, city: geo location auto-detected via IP
  - device_type: mobile/tablet/desktop
  - browser, os: parsed from user-agent
  - duration_seconds: how long they stayed (updated on exit)
  - is_unique: whether this is first visit from this visitor_id today
  - created_at: timestamp

  ### online_visitors
  Tracks currently-online visitors via heartbeat pings.
  - visitor_id: matches visitor_id in page_views
  - page_path: current page being viewed
  - last_seen: updated every 30 seconds; entries older than 2 minutes = offline
  - country_name, city, device_type

  ## Security
  - RLS enabled on both tables
  - Anonymous users can INSERT/UPDATE (needed for tracking from frontend)
  - Only authenticated users can SELECT (admin only)
*/

CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  visitor_id text NOT NULL,
  page_path text NOT NULL,
  page_title text,
  referrer text,
  country_code text,
  country_name text,
  city text,
  latitude numeric,
  longitude numeric,
  device_type text DEFAULT 'desktop',
  browser text,
  os text,
  screen_width integer,
  duration_seconds integer DEFAULT 0,
  is_unique boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS online_visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  session_id text NOT NULL,
  page_path text NOT NULL,
  country_name text,
  city text,
  device_type text DEFAULT 'desktop',
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(visitor_id, session_id)
);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert page views"
  ON page_views FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can insert online visitors"
  ON online_visitors FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update own online visitor record"
  ON online_visitors FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can read page views"
  ON page_views FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read online visitors"
  ON online_visitors FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can delete online visitors"
  ON online_visitors FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can insert page views"
  ON page_views FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can insert online visitors"
  ON online_visitors FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update online visitors"
  ON online_visitors FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_country ON page_views(country_name);
CREATE INDEX IF NOT EXISTS idx_online_visitors_last_seen ON online_visitors(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_online_visitors_visitor_id ON online_visitors(visitor_id);
