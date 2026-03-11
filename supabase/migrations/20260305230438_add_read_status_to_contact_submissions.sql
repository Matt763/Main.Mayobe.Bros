/*
  # Add read status to contact_submissions and CEO access policies

  1. Changes
    - `contact_submissions` table: add `is_read` boolean column (default false)

  2. Security
    - Add authenticated SELECT policy so CEO can read all submissions
    - Add authenticated UPDATE policy so CEO can mark messages as read
    - Add authenticated DELETE policy so CEO can delete messages
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_submissions' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE contact_submissions ADD COLUMN is_read boolean DEFAULT false NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'contact_submissions' AND policyname = 'Authenticated users can read contact submissions'
  ) THEN
    CREATE POLICY "Authenticated users can read contact submissions"
      ON contact_submissions FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'contact_submissions' AND policyname = 'Authenticated users can update contact submissions'
  ) THEN
    CREATE POLICY "Authenticated users can update contact submissions"
      ON contact_submissions FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'contact_submissions' AND policyname = 'Authenticated users can delete contact submissions'
  ) THEN
    CREATE POLICY "Authenticated users can delete contact submissions"
      ON contact_submissions FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;
