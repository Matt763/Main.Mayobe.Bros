/*
  # Allow Anonymous Review Inserts for Seeding

  ## Changes
  - Temporarily allow anonymous inserts for reviews table to enable seeding
  - This policy allows bulk insertion of initial review data

  ## Note
  In production, this would be restricted or removed after seeding is complete
*/

-- Drop the existing authenticated-only review insert policy if it exists
DROP POLICY IF EXISTS "Authenticated users can submit reviews" ON reviews;

-- Create new policy that allows both anon and authenticated inserts
CREATE POLICY "Anyone can submit reviews"
  ON reviews FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);