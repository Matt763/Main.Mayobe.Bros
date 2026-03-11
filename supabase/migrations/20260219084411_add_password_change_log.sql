/*
  # Password Change Log Table

  ## Summary
  Tracks password change attempts per user to enforce weekly limits for non-CEO users.

  ## New Tables

  ### password_change_log
  - `id` (uuid, primary key)
  - `user_id` (uuid) - references the admin_users.user_id
  - `changed_at` (timestamptz) - when the password was changed
  - `changed_by` (uuid) - who performed the change (could be CEO changing another user's password)

  ## Notes
  - CEO has unlimited password changes
  - Admin and Staff can only change their own password 3 times per calendar week
  - CEO can change any user's password at any time without restrictions
  - CEO can delete Admin/Staff accounts from admin_users table
*/

CREATE TABLE IF NOT EXISTS password_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid NOT NULL
);

ALTER TABLE password_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert their own password log"
  ON password_change_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read password logs"
  ON password_change_log FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS password_change_log_user_id_idx ON password_change_log (user_id);
CREATE INDEX IF NOT EXISTS password_change_log_changed_at_idx ON password_change_log (changed_at);
