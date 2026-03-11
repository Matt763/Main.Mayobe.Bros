/*
  # Fix static_pages RLS policies

  1. Problem
    - Multiple overlapping/duplicate RLS policies exist on static_pages
    - This causes confusion and potential access conflicts
    - Some policies use USING (true) which is overly permissive

  2. Changes
    - Drop ALL existing policies on static_pages
    - Recreate clean, correct, non-overlapping policies:
      - Public (anon + authenticated) can SELECT published pages
      - Authenticated users can SELECT all pages (including drafts)
      - Authenticated users can INSERT, UPDATE, DELETE

  3. Security
    - Anon users can only read published pages (for frontend)
    - Authenticated admin users have full access to all pages
    - No duplicate policies
*/

DO $$
DECLARE
  pol_name text;
BEGIN
  FOR pol_name IN
    SELECT polname FROM pg_policy
    JOIN pg_class ON pg_policy.polrelid = pg_class.oid
    WHERE pg_class.relname = 'static_pages'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON static_pages', pol_name);
  END LOOP;
END $$;

ALTER TABLE static_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published pages"
  ON static_pages FOR SELECT
  TO anon
  USING (published = true);

CREATE POLICY "Authenticated users can view all pages"
  ON static_pages FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert pages"
  ON static_pages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update pages"
  ON static_pages FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete pages"
  ON static_pages FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);
