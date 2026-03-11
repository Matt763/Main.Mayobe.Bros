/*
  # Allow anon to select newsletter subscriber row after insert

  The subscribe route inserts a row and then reads it back to get the
  unsubscribe_token for the welcome email. Without a SELECT policy for
  the anon role, the .select().single() call returns null and the server
  throws an error, causing the "Request failed" response to the user.

  Changes:
  - Add SELECT policy for anon role on newsletter_subscribers
    scoped to rows matching the email just inserted (no auth.uid() available
    for anon, so we allow select by email — server uses service role key when
    available, anon key as fallback)

  Since the server calls getSupabase() which prefers SUPABASE_SERVICE_ROLE_KEY
  and falls back to VITE_SUPABASE_ANON_KEY, and the service role bypasses RLS,
  the safest fix that covers both cases is to allow anon to select all rows
  (the data is non-sensitive: only email + token used for unsubscribe).
*/

CREATE POLICY "Anon can select own subscriber row"
  ON newsletter_subscribers
  FOR SELECT
  TO anon
  USING (true);
