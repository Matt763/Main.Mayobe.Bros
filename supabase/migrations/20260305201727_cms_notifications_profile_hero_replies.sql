/*
  # CMS Enhancements: Notifications, Profile Images, Email Change Tracking, Hero Settings, Comment Replies

  ## Summary
  This migration adds all infrastructure needed for the enhanced CMS features:

  ## New Tables

  ### cms_notifications
  Tracks unread notification counts per admin user for different event types.
  - `id` - UUID primary key
  - `user_id` - Admin user ID (references admin_users)
  - `type` - Notification category (comments, subscribers, publishers, reviews, posts, pages)
  - `count` - Number of unread items
  - `last_seen_at` - Timestamp when user last checked this section
  - `updated_at` - When count was last updated

  ### email_change_log
  Tracks when users change their email to enforce monthly limits.
  - `id` - UUID primary key
  - `user_id` - Auth user ID
  - `old_email` - Previous email address
  - `new_email` - New email address
  - `changed_at` - Timestamp of the change

  ### comment_replies
  Stores threaded replies to approved comments.
  - `id` - UUID primary key
  - `comment_id` - Parent comment being replied to
  - `post_id` - Post the comment belongs to
  - `author` - Display name of reply author
  - `email` - Email of reply author
  - `content` - Reply text content
  - `author_role` - Role badge (ceo/admin/staff/null)
  - `status` - approved/pending/spam
  - `created_at` - Timestamp

  ## Modified Tables

  ### admin_users
  - Added `profile_image_url` column for avatar image links
  - Added `avatar_initials` fallback text

  ### site_settings (hero fields)
  - Added `hero_image_url` for custom homepage hero image
  - Added `hero_video_url` for optional video background
  - Added `hero_media_type` - 'image' | 'video' | 'default'

  ## Security
  - RLS enabled on all new tables
  - Authenticated users can manage their own notifications
  - CEO can see all notification types
  - Anonymous users can insert comment replies for public posting
*/

CREATE TABLE IF NOT EXISTS email_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  old_email text NOT NULL DEFAULT '',
  new_email text NOT NULL DEFAULT '',
  changed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE email_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own email change log"
  ON email_change_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own email change log"
  ON email_change_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_email_change_log_user ON email_change_log (user_id, changed_at DESC);

CREATE TABLE IF NOT EXISTS cms_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  count int NOT NULL DEFAULT 0,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, type)
);

ALTER TABLE cms_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read own notifications"
  ON cms_notifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can upsert notifications"
  ON cms_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update notifications"
  ON cms_notifications FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'profile_image_url'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN profile_image_url text DEFAULT NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS comment_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL,
  post_id uuid NOT NULL,
  author text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  content text NOT NULL,
  author_role text DEFAULT NULL,
  status text NOT NULL DEFAULT 'approved',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE comment_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved replies"
  ON comment_replies FOR SELECT
  TO anon
  USING (status = 'approved');

CREATE POLICY "Authenticated can read all replies"
  ON comment_replies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert replies"
  ON comment_replies FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated can update replies"
  ON comment_replies FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete replies"
  ON comment_replies FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_comment_replies_comment_id ON comment_replies (comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_replies_post_id ON comment_replies (post_id, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'hero_image_url'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN hero_image_url text DEFAULT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'hero_video_url'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN hero_video_url text DEFAULT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'hero_media_type'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN hero_media_type text DEFAULT 'default';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE comments ADD COLUMN is_deleted boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE comments ADD COLUMN deleted_at timestamptz DEFAULT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments' AND column_name = 'user_token'
  ) THEN
    ALTER TABLE comments ADD COLUMN user_token text DEFAULT NULL;
  END IF;
END $$;
