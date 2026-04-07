-- ═══ Migration: 20260407000001_add_delete_policy_page_views.sql ═══
/*
  # Fix Analytics Data Reset

  ## Problem
  The analytics "Clear All Data" feature fails because there is no DELETE
  RLS policy on the page_views table for authenticated users.

  ## Changes
  1. Add DELETE policy for authenticated users on page_views
  2. Add DELETE policy for authenticated users on ad_events (for full reset)
  3. Ensure online_visitors DELETE policy exists (already exists but adding safely)
*/

-- Allow authenticated admins to delete page view records (for analytics reset)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'page_views'
      AND policyname = 'Authenticated can delete page views'
  ) THEN
    EXECUTE '
      CREATE POLICY "Authenticated can delete page views"
        ON page_views FOR DELETE TO authenticated USING (true)
    ';
  END IF;
END $$;

-- Allow authenticated admins to delete ad event records (for analytics reset)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ad_events'
      AND policyname = 'Authenticated can delete ad events'
  ) THEN
    EXECUTE '
      CREATE POLICY "Authenticated can delete ad events"
        ON ad_events FOR DELETE TO authenticated USING (true)
    ';
  END IF;
END $$;

-- Ensure online_visitors DELETE for authenticated exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'online_visitors'
      AND policyname = 'Authenticated can delete online visitors'
  ) THEN
    EXECUTE '
      CREATE POLICY "Authenticated can delete online visitors"
        ON online_visitors FOR DELETE TO authenticated USING (true)
    ';
  END IF;
END $$;
