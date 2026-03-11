/*
  # Create Content Calendar and Saved Topics tables

  ## New Tables

  ### content_calendar
  - `id` (uuid, primary key)
  - `title` (text) - article title / planned post title
  - `topic` (text) - the discovered topic
  - `category` (text) - content category
  - `scheduled_date` (date) - planned publish date
  - `status` (text) - draft | in_progress | ready | published
  - `notes` (text) - CEO notes
  - `keywords` (text[]) - target keywords
  - `outline` (jsonb) - stored outline JSON
  - `meta` (jsonb) - stored SEO meta JSON
  - `created_by` (uuid) - auth user id
  - `post_id` (uuid, nullable) - link to posts table once published
  - `created_at` / `updated_at` (timestamptz)

  ### saved_topics
  - `id` (uuid, primary key)
  - `title` (text)
  - `angle` (text)
  - `interest_level` (text)
  - `search_volume` (text)
  - `difficulty` (text)
  - `primary_keyword` (text)
  - `keywords` (text[])
  - `category` (text)
  - `why_it_works` (text)
  - `created_by` (uuid)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on both tables
  - Only authenticated users (CEO) can read/write their own records
*/

CREATE TABLE IF NOT EXISTS content_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  topic text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  scheduled_date date,
  status text NOT NULL DEFAULT 'draft',
  notes text NOT NULL DEFAULT '',
  keywords text[] NOT NULL DEFAULT '{}',
  outline jsonb,
  meta jsonb,
  created_by uuid NOT NULL,
  post_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT content_calendar_status_check CHECK (status = ANY (ARRAY['draft','in_progress','ready','published']))
);

ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calendar entries"
  ON content_calendar FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own calendar entries"
  ON content_calendar FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own calendar entries"
  ON content_calendar FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own calendar entries"
  ON content_calendar FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE TABLE IF NOT EXISTS saved_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  angle text NOT NULL DEFAULT '',
  interest_level text NOT NULL DEFAULT 'Medium',
  search_volume text NOT NULL DEFAULT 'Medium',
  difficulty text NOT NULL DEFAULT 'Moderate',
  primary_keyword text NOT NULL DEFAULT '',
  keywords text[] NOT NULL DEFAULT '{}',
  category text NOT NULL DEFAULT '',
  why_it_works text NOT NULL DEFAULT '',
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE saved_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved topics"
  ON saved_topics FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own saved topics"
  ON saved_topics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own saved topics"
  ON saved_topics FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE INDEX IF NOT EXISTS idx_content_calendar_created_by ON content_calendar(created_by);
CREATE INDEX IF NOT EXISTS idx_content_calendar_scheduled_date ON content_calendar(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_saved_topics_created_by ON saved_topics(created_by);
