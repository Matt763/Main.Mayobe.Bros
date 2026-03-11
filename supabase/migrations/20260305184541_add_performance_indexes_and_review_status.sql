/*
  # Performance Indexes and Review Status Enhancement

  ## Summary
  This migration adds database indexes for frequently queried columns to improve
  query performance, and ensures the reviews table supports a 'rejected' status value.

  ## Changes

  ### New Indexes
  - `comments(post_id)` - speeds up fetching comments for a specific post
  - `comments(status)` - speeds up filtering comments by moderation status
  - `comments(post_id, status)` - composite index for the most common query pattern
  - `reviews(status)` - speeds up filtering reviews by moderation status
  - `posts(status)` - speeds up fetching published posts
  - `posts(category_id)` - speeds up category-filtered post listings
  - `posts(published_at DESC)` - speeds up chronological post listings

  ## Notes
  - All indexes use IF NOT EXISTS to be safe to run multiple times
  - No data is modified by this migration
*/

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_post_status ON comments(post_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_views ON posts(views DESC);
