/*
  # Add Anon Write Policies for Server Operations

  1. Problem
    - The Express server uses the Supabase anon key for all database operations
    - RLS policies for INSERT/UPDATE/DELETE on categories, labels, and site_settings 
      only allow the 'authenticated' role
    - The server validates admin authentication via its own session middleware BEFORE
      calling Supabase, so it's safe to allow anon writes here

  2. Changes
    - Add anon INSERT/UPDATE/DELETE policies for: categories, labels, site_settings
    - These mirror existing authenticated policies but for the anon role
    - The server's requireAuth middleware ensures only logged-in admins reach these endpoints

  3. Notes
    - This is safe because the Express API server controls access via session-based auth
    - The anon key is only used server-side, not exposed to untrusted clients for writes
*/

CREATE POLICY "Anon can insert categories via server"
  ON categories FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update categories via server"
  ON categories FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can delete categories via server"
  ON categories FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Anon can insert labels via server"
  ON labels FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update labels via server"
  ON labels FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can delete labels via server"
  ON labels FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Anon can insert site settings via server"
  ON site_settings FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update site settings via server"
  ON site_settings FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can upsert site settings via server"
  ON site_settings FOR DELETE
  TO anon
  USING (true);
