/*
  # Add Insert Policies for Data Seeding

  ## Changes
  - Add policies to allow inserts for categories, labels, posts during seeding
  - These policies allow anonymous inserts for initial data population

  ## Note
  In production, you would want to restrict these policies to authenticated admin users
  For development/seeding purposes, we're allowing anonymous inserts
*/

-- Allow anonymous inserts for categories (for seeding)
CREATE POLICY "Allow inserts for categories"
  ON categories FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anonymous inserts for labels (for seeding)
CREATE POLICY "Allow inserts for labels"
  ON labels FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anonymous inserts for posts (for seeding)
CREATE POLICY "Allow inserts for posts"
  ON posts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);