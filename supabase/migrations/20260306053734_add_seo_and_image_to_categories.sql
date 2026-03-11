/*
  # Add SEO Fields and Featured Image to Categories

  ## Summary
  Adds image and SEO fields to the categories table so admins can:
  - Set a custom featured image for each category hero
  - Set SEO meta title, meta description, and meta keywords per category

  ## Changes to categories table
  - `featured_image` (text, nullable) - URL of the category hero image
  - `meta_title` (text, nullable) - Custom SEO title for the category page
  - `meta_description` (text, nullable) - SEO meta description (120-160 chars recommended)
  - `meta_keywords` (text, nullable) - Comma-separated SEO keywords

  ## Notes
  - All new fields are optional/nullable, no existing data is affected
  - Uses IF NOT EXISTS guards to be safe on re-runs
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'featured_image'
  ) THEN
    ALTER TABLE categories ADD COLUMN featured_image text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'meta_title'
  ) THEN
    ALTER TABLE categories ADD COLUMN meta_title text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'meta_description'
  ) THEN
    ALTER TABLE categories ADD COLUMN meta_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'meta_keywords'
  ) THEN
    ALTER TABLE categories ADD COLUMN meta_keywords text;
  END IF;
END $$;
