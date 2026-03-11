/*
  # Admin Roles System and Post Approval Workflow

  ## Summary
  This migration establishes a three-tier role system for the CMS:

  1. **CEO** - Mclean Mbaga (mbagamclean@gmail.com) - Full access, no approval needed for own posts
  2. **Admin** - Hired by CEO, can manage most things, posts need CEO approval before publishing
  3. **Staff/Publisher** - Hired by CEO or Admin, can only write posts and use labels, posts need approval

  ## New Tables

  ### admin_users
  - Stores role assignments for all CMS users (CEO, Admin, Staff)
  - Links to Supabase auth.users via user_id (uuid)
  - Tracks who hired each user (hired_by), display name, and active status
  - Roles: 'ceo', 'admin', 'staff'

  ## Modified Tables

  ### posts
  - Added `approval_status` column: 'pending' | 'approved' | 'rejected'
  - Added `approved_by` column: uuid of user who approved
  - Added `approved_at` column: timestamp of approval
  - CEO posts are auto-approved; Admin and Staff posts start as 'pending'

  ## Security
  - RLS enabled on admin_users
  - Only authenticated users can read admin_users
  - Only CEO can insert/update admin_users (enforced at app level via role check)
*/

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  display_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('ceo', 'admin', 'staff')),
  hired_by uuid REFERENCES admin_users(user_id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read admin_users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert admin_users"
  ON admin_users FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update admin_users"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete admin_users"
  ON admin_users FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS admin_users_user_id_idx ON admin_users (user_id);
CREATE INDEX IF NOT EXISTS admin_users_email_idx ON admin_users (email);
CREATE INDEX IF NOT EXISTS admin_users_role_idx ON admin_users (role);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE posts ADD COLUMN approval_status text NOT NULL DEFAULT 'pending'
      CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE posts ADD COLUMN approved_by uuid;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE posts ADD COLUMN approved_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'author_role'
  ) THEN
    ALTER TABLE posts ADD COLUMN author_role text NOT NULL DEFAULT 'ceo'
      CHECK (author_role IN ('ceo', 'admin', 'staff'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'author_name'
  ) THEN
    ALTER TABLE posts ADD COLUMN author_name text;
  END IF;
END $$;

UPDATE posts SET approval_status = 'approved' WHERE approval_status = 'pending';
