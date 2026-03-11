/*
  # Add author_role to comments table

  ## Changes
  - New Columns
    - `comments.author_role` (text, nullable): Stores the role of the comment author if they are staff/admin/ceo.
      Values: 'ceo' | 'admin' | 'staff' | NULL (for public users)

  ## Purpose
  - Allows privileged users (CEO, Admin, Staff) to be identified visually in comments with a badge.
  - Comments from these roles are auto-approved (handled at application level).
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments' AND column_name = 'author_role'
  ) THEN
    ALTER TABLE comments ADD COLUMN author_role text DEFAULT NULL;
  END IF;
END $$;
