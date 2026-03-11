/*
  # Add unsubscribe reason to newsletter_subscribers

  1. Changes
    - Add `unsubscribe_reason` (text) — stores the selected reason category
    - Add `unsubscribe_feedback` (text) — stores the optional free-text message
    - Both nullable, only populated when a subscriber unsubscribes

  2. Notes
    - Non-destructive: only adds columns, no existing data modified
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'newsletter_subscribers' AND column_name = 'unsubscribe_reason'
  ) THEN
    ALTER TABLE newsletter_subscribers ADD COLUMN unsubscribe_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'newsletter_subscribers' AND column_name = 'unsubscribe_feedback'
  ) THEN
    ALTER TABLE newsletter_subscribers ADD COLUMN unsubscribe_feedback text;
  END IF;
END $$;
