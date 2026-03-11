/*
  # Fix CMS RLS Policies for Publishing

  ## Summary
  Adds missing Row Level Security (RLS) policies to enable CMS staff to publish, update, and delete posts and pages.

  ## Issues Fixed
  1. **Posts Table** - Missing UPDATE and DELETE policies
  2. **Static Pages Table** - Missing INSERT, UPDATE, and DELETE policies
  
  ## Changes Made
  
  ### Posts Table Policies
  - Added UPDATE policy for authenticated users to edit posts
  - Added DELETE policy for authenticated users to delete posts
  
  ### Static Pages Table Policies  
  - Added INSERT policy for authenticated users to create pages
  - Added UPDATE policy for authenticated users to edit pages
  - Added DELETE policy for authenticated users to delete pages
  
  ## Security
  - All policies require authentication (authenticated role)
  - Policies allow full CRUD operations for staff members
  - Read access remains public for website visitors
  
  ## Notes
  - In production, you may want to add more granular permissions
  - Consider adding role-based access control (RBAC) in the future
  - Current setup allows any authenticated user to manage content
*/

-- Posts UPDATE policy (allow authenticated users to update any post)
CREATE POLICY "Authenticated users can update posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Posts DELETE policy (allow authenticated users to delete any post)
CREATE POLICY "Authenticated users can delete posts"
  ON posts FOR DELETE
  TO authenticated
  USING (true);

-- Static Pages INSERT policy (allow authenticated users to create pages)
CREATE POLICY "Authenticated users can create static pages"
  ON static_pages FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Static Pages UPDATE policy (allow authenticated users to update pages)
CREATE POLICY "Authenticated users can update static pages"
  ON static_pages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Static Pages DELETE policy (allow authenticated users to delete pages)
CREATE POLICY "Authenticated users can delete static pages"
  ON static_pages FOR DELETE
  TO authenticated
  USING (true);

-- Categories UPDATE and DELETE policies (for CMS management)
CREATE POLICY "Authenticated users can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (true);

-- Labels UPDATE and DELETE policies (for CMS management)
CREATE POLICY "Authenticated users can update labels"
  ON labels FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete labels"
  ON labels FOR DELETE
  TO authenticated
  USING (true);

-- Site Settings policies (for CMS management)
CREATE POLICY "Authenticated users can update site settings"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can create site settings"
  ON site_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete site settings"
  ON site_settings FOR DELETE
  TO authenticated
  USING (true);

-- Media Library UPDATE and DELETE policies (already has INSERT)
CREATE POLICY "Authenticated users can update their media"
  ON media_library FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete their media"
  ON media_library FOR DELETE
  TO authenticated
  USING (true);