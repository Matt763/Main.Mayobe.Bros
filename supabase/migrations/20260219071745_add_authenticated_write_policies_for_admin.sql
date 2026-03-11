/*
  # Add Authenticated Write Policies for Admin Operations

  ## Problem
  The CMS admin panel uses Supabase auth (JWT-based). Write operations need to work
  directly via the Supabase client when the user is authenticated with Supabase auth.
  Currently only anon-role policies exist (for the Express server path), but no
  authenticated-user policies exist for write operations on key tables.

  ## Changes
  Add authenticated-user INSERT, UPDATE, DELETE policies for:
  - posts
  - static_pages
  - categories
  - labels
  - site_settings

  These policies allow any authenticated Supabase user (i.e., the admin) to perform
  write operations directly via the Supabase client, bypassing the Express server.

  ## Security
  All policies are restricted to the `authenticated` role, meaning only users who
  have a valid Supabase JWT session can perform these operations.
*/

-- POSTS: authenticated write policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='posts' AND policyname='Authenticated users can insert posts') THEN
    CREATE POLICY "Authenticated users can insert posts"
      ON posts FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='posts' AND policyname='Authenticated users can update posts') THEN
    CREATE POLICY "Authenticated users can update posts"
      ON posts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='posts' AND policyname='Authenticated users can delete posts') THEN
    CREATE POLICY "Authenticated users can delete posts"
      ON posts FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- STATIC PAGES: authenticated write policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='static_pages' AND policyname='Authenticated users can insert pages') THEN
    CREATE POLICY "Authenticated users can insert pages"
      ON static_pages FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='static_pages' AND policyname='Authenticated users can update pages') THEN
    CREATE POLICY "Authenticated users can update pages"
      ON static_pages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='static_pages' AND policyname='Authenticated users can delete pages') THEN
    CREATE POLICY "Authenticated users can delete pages"
      ON static_pages FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- CATEGORIES: authenticated write policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='categories' AND policyname='Authenticated users can insert categories') THEN
    CREATE POLICY "Authenticated users can insert categories"
      ON categories FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='categories' AND policyname='Authenticated users can update categories') THEN
    CREATE POLICY "Authenticated users can update categories"
      ON categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='categories' AND policyname='Authenticated users can delete categories') THEN
    CREATE POLICY "Authenticated users can delete categories"
      ON categories FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- LABELS: authenticated write policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='labels' AND policyname='Authenticated users can insert labels') THEN
    CREATE POLICY "Authenticated users can insert labels"
      ON labels FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='labels' AND policyname='Authenticated users can update labels') THEN
    CREATE POLICY "Authenticated users can update labels"
      ON labels FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='labels' AND policyname='Authenticated users can delete labels') THEN
    CREATE POLICY "Authenticated users can delete labels"
      ON labels FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- SITE SETTINGS: authenticated write policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='site_settings' AND policyname='Authenticated users can insert site settings') THEN
    CREATE POLICY "Authenticated users can insert site settings"
      ON site_settings FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='site_settings' AND policyname='Authenticated users can update site settings') THEN
    CREATE POLICY "Authenticated users can update site settings"
      ON site_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='site_settings' AND policyname='Authenticated users can delete site settings') THEN
    CREATE POLICY "Authenticated users can delete site settings"
      ON site_settings FOR DELETE TO authenticated USING (true);
  END IF;
END $$;
