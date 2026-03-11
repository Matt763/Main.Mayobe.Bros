/*
  # Mayobe Bros Website Database Schema

  ## Overview
  Creates the complete database schema for the Mayobe Bros content platform with categories, labels, posts, and reviews.

  ## New Tables

  ### 1. categories
  Main navigation categories (Educational, Business Ideas, etc.)
  - `id` (uuid, primary key)
  - `name` (text, unique) - Category display name
  - `slug` (text, unique) - URL-friendly version
  - `description` (text, nullable) - Category description
  - `display_order` (integer) - Sort order in navigation
  - `show_in_footer` (boolean) - Whether to display in footer
  - `created_at` (timestamptz) - Creation timestamp

  ### 2. labels
  Subcategories under main categories (e.g., "Smartphones" under "Technology Solutions")
  - `id` (uuid, primary key)
  - `category_id` (uuid, foreign key) - Parent category
  - `name` (text) - Label display name
  - `slug` (text) - URL-friendly version
  - `description` (text, nullable) - Label description
  - `display_order` (integer) - Sort order within category
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. posts
  Content posts with hierarchical categorization
  - `id` (uuid, primary key)
  - `title` (text) - Post title
  - `slug` (text) - URL-friendly title
  - `content` (text) - Post body content
  - `excerpt` (text, nullable) - Short summary
  - `category_id` (uuid, foreign key) - Main category
  - `label_id` (uuid, foreign key, nullable) - Optional subcategory
  - `featured_image` (text, nullable) - Image URL from Pexels
  - `author` (text) - Author name
  - `views` (integer) - View count
  - `is_popular` (boolean) - Featured as popular
  - `published_at` (timestamptz) - Publication date
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. reviews
  User reviews and testimonials
  - `id` (uuid, primary key)
  - `user_name` (text) - Reviewer name
  - `user_avatar` (text, nullable) - Avatar URL
  - `rating` (integer) - Rating 1-5
  - `comment` (text) - Review content
  - `is_verified` (boolean) - Verified review badge
  - `created_at` (timestamptz) - Creation timestamp

  ### 5. contact_submissions
  Form submissions from "Advertise With Us" page
  - `id` (uuid, primary key)
  - `name` (text) - Contact name
  - `email` (text) - Contact email
  - `subject` (text) - Subject line
  - `message` (text) - Message content
  - `type` (text) - Submission type (advertising, general, etc.)
  - `created_at` (timestamptz) - Submission timestamp

  ## Security
  - Enable RLS on all tables
  - Public read access for content tables
  - Authenticated write access for contact submissions

  ## Indexes
  - Optimized for URL routing and content queries
  - Performance indexes on slug fields and foreign keys
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  show_in_footer boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create labels table
CREATE TABLE IF NOT EXISTS labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(category_id, slug)
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL,
  content text NOT NULL,
  excerpt text,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  label_id uuid REFERENCES labels(id) ON DELETE SET NULL,
  featured_image text,
  author text DEFAULT 'Mayobe Bros',
  views integer DEFAULT 0,
  is_popular boolean DEFAULT false,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category_id, label_id, slug)
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL,
  user_avatar text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create contact_submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_label ON posts(label_id);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_popular ON posts(is_popular) WHERE is_popular = true;
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_labels_category ON labels(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_labels_slug ON labels(slug);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories (public read)
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for labels (public read)
CREATE POLICY "Anyone can view labels"
  ON labels FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for posts (public read)
CREATE POLICY "Anyone can view published posts"
  ON posts FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for reviews (public read, authenticated insert)
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can submit reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for contact_submissions (authenticated insert only)
CREATE POLICY "Anyone can submit contact forms"
  ON contact_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);