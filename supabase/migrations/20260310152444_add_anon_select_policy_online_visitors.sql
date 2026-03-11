/*
  # Fix online_visitors anon access for upserts

  1. Security Changes
    - Add SELECT policy for anon role on online_visitors table
    - Required because upsert operations need SELECT to check for conflicts
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.online_visitors'::regclass
    AND polname = 'Anon can select online visitor records'
  ) THEN
    CREATE POLICY "Anon can select online visitor records"
      ON public.online_visitors
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;
