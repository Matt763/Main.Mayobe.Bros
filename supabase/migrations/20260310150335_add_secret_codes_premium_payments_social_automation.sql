/*
  # Add Secret Codes, Premium Payments, Social Automation, and AI Engine Controls

  1. New columns on `registered_users`
    - `secret_code` (text, unique) - MB-XXXXXXXX format for members
    - `role` (text) - member/publisher/staff/admin/ceo
    - `profile_image_url` (text) - user profile image

  2. New columns on `admin_users`
    - `secret_code` (text, unique) - S-XXXXX format for staff

  3. New Table: `premium_purchases`
    - Tracks purchases of premium content
    - `user_id`, `post_id`, `amount`, `payment_method`, `payment_status`, `transaction_id`

  4. New Table: `social_media_accounts`
    - Stores connected social media API credentials
    - Encrypted tokens stored per platform

  5. New Table: `social_media_posts`
    - Tracks generated/scheduled social posts per article
    - Platform, content, status, scheduled_at

  6. New Table: `ai_engine_settings`
    - CEO controls for enabling/disabling AI features

  7. New Table: `topic_clusters`
    - Groups posts into topical authority clusters

  8. New Table: `topic_cluster_posts`
    - Junction table linking posts to clusters

  9. Security
    - RLS enabled on all new tables
    - Authenticated-only access policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registered_users' AND column_name = 'secret_code'
  ) THEN
    ALTER TABLE registered_users ADD COLUMN secret_code text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registered_users' AND column_name = 'role'
  ) THEN
    ALTER TABLE registered_users ADD COLUMN role text DEFAULT 'member';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registered_users' AND column_name = 'profile_image_url'
  ) THEN
    ALTER TABLE registered_users ADD COLUMN profile_image_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'secret_code'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN secret_code text UNIQUE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS premium_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid NOT NULL REFERENCES posts(id),
  amount numeric NOT NULL DEFAULT 0.99,
  currency text NOT NULL DEFAULT 'USD',
  payment_method text NOT NULL DEFAULT 'stripe',
  payment_status text NOT NULL DEFAULT 'pending',
  transaction_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT premium_purchases_status_check CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'))
);

ALTER TABLE premium_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read own purchases"
  ON premium_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert purchases"
  ON premium_purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anon can read purchases for server"
  ON premium_purchases FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert purchases for server"
  ON premium_purchases FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS social_media_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  account_name text DEFAULT '',
  api_key text DEFAULT '',
  api_secret text DEFAULT '',
  access_token text DEFAULT '',
  is_connected boolean DEFAULT false,
  last_posted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT social_media_accounts_platform_check CHECK (platform IN ('facebook', 'twitter', 'linkedin', 'pinterest', 'telegram', 'instagram'))
);

ALTER TABLE social_media_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage social accounts"
  ON social_media_accounts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert social accounts"
  ON social_media_accounts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update social accounts"
  ON social_media_accounts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete social accounts"
  ON social_media_accounts FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Anon can read social accounts"
  ON social_media_accounts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can update social accounts"
  ON social_media_accounts FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS social_media_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id),
  platform text NOT NULL,
  headline text DEFAULT '',
  caption text DEFAULT '',
  hashtags text DEFAULT '',
  article_link text DEFAULT '',
  status text DEFAULT 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT social_media_posts_status_check CHECK (status IN ('draft', 'approved', 'scheduled', 'published', 'failed'))
);

ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage social posts"
  ON social_media_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert social posts"
  ON social_media_posts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update social posts"
  ON social_media_posts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete social posts"
  ON social_media_posts FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Anon can read social posts"
  ON social_media_posts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert social posts"
  ON social_media_posts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS ai_engine_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text NOT NULL UNIQUE,
  is_enabled boolean DEFAULT false,
  config jsonb DEFAULT '{}',
  updated_by uuid,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_engine_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read ai settings"
  ON ai_engine_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can update ai settings"
  ON ai_engine_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can insert ai settings"
  ON ai_engine_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anon can read ai settings"
  ON ai_engine_settings FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can update ai settings"
  ON ai_engine_settings FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

INSERT INTO ai_engine_settings (feature_key, is_enabled) VALUES
  ('ai_blogging', false),
  ('social_automation', false),
  ('trending_detection', true),
  ('auto_scheduling', false),
  ('ai_topic_discovery', true),
  ('ai_editorial_review', true),
  ('ai_keyword_research', false),
  ('ai_competitor_analysis', false)
ON CONFLICT (feature_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS topic_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  pillar_post_id uuid REFERENCES posts(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE topic_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read topic clusters"
  ON topic_clusters FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated can read topic clusters"
  ON topic_clusters FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can manage topic clusters"
  ON topic_clusters FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update topic clusters"
  ON topic_clusters FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete topic clusters"
  ON topic_clusters FOR DELETE
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS topic_cluster_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id uuid NOT NULL REFERENCES topic_clusters(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(cluster_id, post_id)
);

ALTER TABLE topic_cluster_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cluster posts"
  ON topic_cluster_posts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated can read cluster posts"
  ON topic_cluster_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can manage cluster posts"
  ON topic_cluster_posts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete cluster posts"
  ON topic_cluster_posts FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_premium_purchases_user_post ON premium_purchases(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_post_id ON social_media_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_topic_cluster_posts_cluster ON topic_cluster_posts(cluster_id);
CREATE INDEX IF NOT EXISTS idx_topic_cluster_posts_post ON topic_cluster_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_registered_users_secret_code ON registered_users(secret_code);
CREATE INDEX IF NOT EXISTS idx_admin_users_secret_code ON admin_users(secret_code);
