/*
  # Add featured_image to static_pages

  1. Changes
    - `static_pages` table: add `featured_image` column (text, nullable) — used as the hero image on the dynamic page frontend renderer

  2. Notes
    - No data loss; existing rows get NULL for the new column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'static_pages' AND column_name = 'featured_image'
  ) THEN
    ALTER TABLE static_pages ADD COLUMN featured_image text;
  END IF;
END $$;
