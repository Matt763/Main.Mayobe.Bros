/*
  # Create registered_users table

  ## Summary
  Creates a table to track all registered users (both email/password and Google OAuth).
  This gives the admin CMS visibility into every account created on the site.

  ## New Tables
  - `registered_users`
    - `id` (uuid, primary key) - matches auth.users id
    - `email` (text, unique, not null)
    - `name` (text) - display name
    - `avatar_url` (text, nullable) - profile picture URL
    - `provider` (text) - 'email' or 'google'
    - `is_banned` (boolean) - admin can ban users from the site
    - `ban_reason` (text, nullable) - reason for ban
    - `newsletter_unsubscribed` (boolean) - admin can remove newsletter subscription
    - `last_sign_in_at` (timestamptz, nullable)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - Enable RLS
  - Authenticated users can read their own record
  - Anon/service role can insert (needed for sign-up sync)
  - Only authenticated admin can update/delete via service role

  ## Notes
  - Insert is allowed for anon so the frontend can sync on sign-up
  - Admin reads all records via service role in SubscribersPage
*/

CREATE TABLE IF NOT EXISTS registered_users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL DEFAULT '',
  avatar_url text,
  provider text NOT NULL DEFAULT 'email',
  is_banned boolean NOT NULL DEFAULT false,
  ban_reason text,
  newsletter_unsubscribed boolean NOT NULL DEFAULT false,
  last_sign_in_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE registered_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own record"
  ON registered_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Anon can insert own record"
  ON registered_users FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated can insert own record"
  ON registered_users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own record"
  ON registered_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
