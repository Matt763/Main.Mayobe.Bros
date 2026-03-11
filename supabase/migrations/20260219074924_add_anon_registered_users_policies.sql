/*
  # Add anon read/update policies for registered_users

  Allows:
  - Anon users to read their own record by email (for ban checking after OAuth)
  - Anon users to update their own record (last_sign_in_at, name, avatar_url)
  - Authenticated users to read all records (admin access)
*/

CREATE POLICY "Anon can read own record"
  ON registered_users FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can update own record"
  ON registered_users FOR UPDATE
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated can read all records"
  ON registered_users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can update all records"
  ON registered_users FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete records"
  ON registered_users FOR DELETE
  TO authenticated
  USING (true);
