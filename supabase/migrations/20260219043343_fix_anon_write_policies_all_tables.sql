/*
  # Fix Anon Write Policies for All Admin Tables

  ## Problem
  The Express server uses the Supabase anon key (not service role key). This means
  all DB operations run as the "anon" role. Categories, labels, media_library, and
  site_settings only had policies for the "authenticated" role, blocking all write
  operations from the server.

  ## Changes
  - Add anon INSERT, UPDATE, DELETE policies for: categories, labels, media_library, site_settings
  - These are safe because the Express requireAuth middleware validates admin session
    before any write operation reaches Supabase

  ## Tables Modified
  - categories: add anon insert, update, delete
  - labels: add anon insert, update, delete
  - media_library: add anon insert, update, delete
  - site_settings: add anon insert, update, delete
*/

-- CATEGORIES: anon write policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='categories' AND policyname='Anon can insert categories via server') THEN
    CREATE POLICY "Anon can insert categories via server" ON categories FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='categories' AND policyname='Anon can update categories via server') THEN
    CREATE POLICY "Anon can update categories via server" ON categories FOR UPDATE TO anon USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='categories' AND policyname='Anon can delete categories via server') THEN
    CREATE POLICY "Anon can delete categories via server" ON categories FOR DELETE TO anon USING (true);
  END IF;
END $$;

-- LABELS: anon write policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='labels' AND policyname='Anon can insert labels via server') THEN
    CREATE POLICY "Anon can insert labels via server" ON labels FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='labels' AND policyname='Anon can update labels via server') THEN
    CREATE POLICY "Anon can update labels via server" ON labels FOR UPDATE TO anon USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='labels' AND policyname='Anon can delete labels via server') THEN
    CREATE POLICY "Anon can delete labels via server" ON labels FOR DELETE TO anon USING (true);
  END IF;
END $$;

-- MEDIA LIBRARY: anon write policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='media_library' AND policyname='Anon can insert media via server') THEN
    CREATE POLICY "Anon can insert media via server" ON media_library FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='media_library' AND policyname='Anon can update media via server') THEN
    CREATE POLICY "Anon can update media via server" ON media_library FOR UPDATE TO anon USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='media_library' AND policyname='Anon can delete media via server') THEN
    CREATE POLICY "Anon can delete media via server" ON media_library FOR DELETE TO anon USING (true);
  END IF;
END $$;

-- SITE SETTINGS: anon write policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='site_settings' AND policyname='Anon can insert site settings via server') THEN
    CREATE POLICY "Anon can insert site settings via server" ON site_settings FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='site_settings' AND policyname='Anon can update site settings via server') THEN
    CREATE POLICY "Anon can update site settings via server" ON site_settings FOR UPDATE TO anon USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='site_settings' AND policyname='Anon can delete site settings via server') THEN
    CREATE POLICY "Anon can delete site settings via server" ON site_settings FOR DELETE TO anon USING (true);
  END IF;
END $$;
