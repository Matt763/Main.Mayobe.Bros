/*
  # Phase 2 — Learning tracks, featured jobs, broadcast notifications

  Adds:
    - jobs.featured (boolean) — admin can pin jobs to the top
    - learning_tracks               (admin-created learning tracks)
    - track_posts                   (posts assigned to a track, ordered)
    - track_progress                (per-user completion timestamps)
    - broadcast_notifications       (manual notifications sent to readers)

  Idempotent — safe to re-run.
*/

-- ── Featured jobs ────────────────────────────────────────────────────────────
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_jobs_featured_published ON jobs(featured, published_at DESC) WHERE featured = true;

-- ── Learning tracks ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS learning_tracks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  title        text NOT NULL,
  description  text,
  cover_image  text,
  is_published boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS track_posts (
  track_id    uuid NOT NULL REFERENCES learning_tracks(id) ON DELETE CASCADE,
  post_id     uuid NOT NULL,
  position    smallint NOT NULL DEFAULT 0,
  notes       text,
  added_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (track_id, post_id)
);
CREATE INDEX IF NOT EXISTS idx_track_posts_track_position ON track_posts(track_id, position);

CREATE TABLE IF NOT EXISTS track_progress (
  user_id     uuid NOT NULL,
  track_id    uuid NOT NULL REFERENCES learning_tracks(id) ON DELETE CASCADE,
  post_id     uuid NOT NULL,
  completed_at timestamptz,
  PRIMARY KEY (user_id, track_id, post_id)
);
CREATE INDEX IF NOT EXISTS idx_track_progress_user_track ON track_progress(user_id, track_id);

ALTER TABLE learning_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_posts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_progress  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_tracks" ON learning_tracks;
CREATE POLICY "public_read_published_tracks"
  ON learning_tracks FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "public_read_track_posts" ON track_posts;
CREATE POLICY "public_read_track_posts"
  ON track_posts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "users_own_progress_select" ON track_progress;
CREATE POLICY "users_own_progress_select"
  ON track_progress FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_progress_insert" ON track_progress;
CREATE POLICY "users_own_progress_insert"
  ON track_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_progress_update" ON track_progress;
CREATE POLICY "users_own_progress_update"
  ON track_progress FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_progress_delete" ON track_progress;
CREATE POLICY "users_own_progress_delete"
  ON track_progress FOR DELETE
  USING (auth.uid() = user_id);

-- ── Broadcast notifications ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS broadcast_notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  body        text,
  link        text,
  audience    text NOT NULL DEFAULT 'all' CHECK (audience IN ('all','free','premium')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid
);
CREATE INDEX IF NOT EXISTS idx_broadcast_created ON broadcast_notifications(created_at DESC);

ALTER TABLE broadcast_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_broadcasts" ON broadcast_notifications;
CREATE POLICY "public_read_broadcasts"
  ON broadcast_notifications FOR SELECT
  USING (true);
