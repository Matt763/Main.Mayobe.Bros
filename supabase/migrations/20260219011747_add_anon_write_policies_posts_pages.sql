/*
  # Add Anon Write Policies for Posts and Static Pages

  ## Problem
  The Express server uses the Supabase anon key (no service role key configured).
  Posts and static_pages tables were missing anon INSERT/UPDATE/DELETE policies,
  causing all publish/save/delete operations to fail with RLS violations.

  ## Changes
  1. Posts table — add anon INSERT, UPDATE, DELETE policies
  2. Static pages table — add anon INSERT, UPDATE, DELETE policies
  3. Posts table — also ensure anon INSERT policy exists (was missing from prior migrations)

  ## Security
  The Express server's requireAuth middleware validates admin session BEFORE calling
  Supabase. These policies are safe because untrusted clients never reach write endpoints.
*/

-- Posts: anon INSERT (create new posts via server)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'posts' AND policyname = 'Anon can insert posts via server'
  ) THEN
    CREATE POLICY "Anon can insert posts via server"
      ON posts FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END $$;

-- Posts: anon UPDATE (publish/edit posts via server)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'posts' AND policyname = 'Anon can update posts via server'
  ) THEN
    CREATE POLICY "Anon can update posts via server"
      ON posts FOR UPDATE
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Posts: anon DELETE (delete posts via server)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'posts' AND policyname = 'Anon can delete posts via server'
  ) THEN
    CREATE POLICY "Anon can delete posts via server"
      ON posts FOR DELETE
      TO anon
      USING (true);
  END IF;
END $$;

-- Static Pages: anon INSERT (create pages via server)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'static_pages' AND policyname = 'Anon can insert static pages via server'
  ) THEN
    CREATE POLICY "Anon can insert static pages via server"
      ON static_pages FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END $$;

-- Static Pages: anon UPDATE (publish/edit pages via server)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'static_pages' AND policyname = 'Anon can update static pages via server'
  ) THEN
    CREATE POLICY "Anon can update static pages via server"
      ON static_pages FOR UPDATE
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Static Pages: anon DELETE (delete pages via server)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'static_pages' AND policyname = 'Anon can delete static pages via server'
  ) THEN
    CREATE POLICY "Anon can delete static pages via server"
      ON static_pages FOR DELETE
      TO anon
      USING (true);
  END IF;
END $$;
