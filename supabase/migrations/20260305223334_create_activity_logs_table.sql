/*
  # Create Activity Logs Table

  ## Summary
  Creates a dedicated activity_logs table for the CEO's Live Platform Activity dashboard.
  This table records all important platform events in real time.

  ## New Tables
  - `activity_logs`
    - `id` (uuid, primary key)
    - `user_id` (uuid, nullable - the admin/staff user who performed the action)
    - `user_name` (text - display name of the user)
    - `user_role` (text - role: ceo, admin, staff, user, system)
    - `activity_type` (text - category: post, page, comment, review, subscriber, publisher, user, system)
    - `action` (text - specific action: published, created, submitted, approved, deleted, updated, subscribed)
    - `content_title` (text, nullable - title of the related content)
    - `content_id` (text, nullable - id of the related content)
    - `description` (text - human-readable description of the event)
    - `metadata` (jsonb, nullable - extra context data)
    - `created_at` (timestamptz - when the event occurred)

  ## Security
  - RLS enabled; only the CEO role can SELECT
  - The anon/service role can INSERT (for server-side logging)
  - No UPDATE or DELETE allowed from client

  ## Indexes
  - Index on created_at (DESC) for fast feed queries
  - Index on activity_type for filtering
  - Index on user_id for user-specific queries
*/

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_name text NOT NULL DEFAULT 'System',
  user_role text NOT NULL DEFAULT 'system',
  activity_type text NOT NULL,
  action text NOT NULL,
  content_title text,
  content_id text,
  description text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON activity_logs (activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs (action);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEO can view all activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.role = 'ceo'
        AND admin_users.is_active = true
    )
  );

CREATE POLICY "Authenticated users can insert activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anon can insert activity logs"
  ON activity_logs FOR INSERT
  TO anon
  WITH CHECK (true);
