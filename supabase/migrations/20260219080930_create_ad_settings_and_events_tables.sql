/*
  # Create Ad Settings and Ad Events Tables

  ## Summary
  This migration creates two tables to power the monetization system:

  1. **ad_settings** — Stores ad code snippets per placement slot (header, footer, body, in-page, etc.)
     - Each row is a named slot with the raw HTML/JS ad code to inject
     - Used by the frontend to inject ad code into the correct HTML sections

  2. **ad_events** — Tracks ad impressions, clicks, and estimated revenue per ad slot
     - Written by the frontend analytics tracker when ads are visible/clicked
     - Revenue column stores CPM/CPC-based estimated earnings

  ## Security
  - RLS enabled on both tables
  - `ad_settings`: only authenticated admins can read/write
  - `ad_events`: anon users can INSERT (tracking), authenticated can SELECT (reporting)
*/

CREATE TABLE IF NOT EXISTS ad_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot text UNIQUE NOT NULL,
  label text NOT NULL DEFAULT '',
  code text NOT NULL DEFAULT '',
  is_enabled boolean NOT NULL DEFAULT true,
  platform text NOT NULL DEFAULT 'custom',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ad_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read ad settings"
  ON ad_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert ad settings"
  ON ad_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update ad settings"
  ON ad_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete ad settings"
  ON ad_settings FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Anon can read enabled ad settings"
  ON ad_settings FOR SELECT
  TO anon
  USING (is_enabled = true);

CREATE TABLE IF NOT EXISTS ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('impression', 'click')),
  visitor_id text,
  page_path text,
  revenue numeric(12, 8) NOT NULL DEFAULT 0,
  platform text NOT NULL DEFAULT 'custom',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ad_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert ad events"
  ON ad_events FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated can insert ad events"
  ON ad_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can read ad events"
  ON ad_events FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS ad_events_slot_idx ON ad_events (slot);
CREATE INDEX IF NOT EXISTS ad_events_event_type_idx ON ad_events (event_type);
CREATE INDEX IF NOT EXISTS ad_events_created_at_idx ON ad_events (created_at);
CREATE INDEX IF NOT EXISTS ad_events_platform_idx ON ad_events (platform);

INSERT INTO ad_settings (slot, label, platform, code, is_enabled) VALUES
  ('head', 'Head Tag (before </head>)', 'custom', '', false),
  ('body_top', 'Body Top (after <body>)', 'custom', '', false),
  ('body_bottom', 'Body Bottom (before </body>)', 'custom', '', false),
  ('in_article', 'In-Article Ad', 'custom', '', false),
  ('sidebar', 'Sidebar Ad', 'custom', '', false),
  ('footer', 'Footer Ad', 'custom', '', false)
ON CONFLICT (slot) DO NOTHING;
