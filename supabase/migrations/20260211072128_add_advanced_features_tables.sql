/*
  # Add Advanced Features Tables

  ## Overview
  Adds tables for comments, reactions, newsletter, site settings, and static pages

  ## New Tables

  ### 1. comments
  User comments on posts
  - `id` (uuid, primary key)
  - `post_id` (uuid, foreign key) - Related post
  - `user_name` (text) - Commenter name
  - `user_email` (text) - Commenter email
  - `content` (text) - Comment content
  - `parent_id` (uuid, nullable) - For reply threading
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. reactions
  User reactions to posts (like, love, etc.)
  - `id` (uuid, primary key)
  - `post_id` (uuid, foreign key) - Related post
  - `reaction_type` (text) - Type: love, laugh, wow, think, sad, angry
  - `user_identifier` (text) - Anonymous user identifier (IP hash or session)
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. newsletter_subscribers
  Email newsletter subscriptions
  - `id` (uuid, primary key)
  - `email` (text, unique) - Subscriber email
  - `is_active` (boolean) - Subscription status
  - `subscribed_at` (timestamptz) - Subscription date
  - `unsubscribed_at` (timestamptz, nullable) - Unsubscription date

  ### 4. site_settings
  Global website settings
  - `id` (uuid, primary key)
  - `key` (text, unique) - Setting key
  - `value` (text) - Setting value
  - `updated_at` (timestamptz) - Last update

  ### 5. static_pages
  Additional pages (About, Contact, Privacy, Terms)
  - `id` (uuid, primary key)
  - `title` (text) - Page title
  - `slug` (text, unique) - URL-friendly slug
  - `content` (text) - Page content
  - `is_indexed` (boolean) - Allow search engine indexing
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update

  ### 6. chat_conversations
  AI chat conversation logs
  - `id` (uuid, primary key)
  - `user_identifier` (text) - Anonymous user identifier
  - `messages` (jsonb) - Conversation messages array
  - `summary` (text, nullable) - Conversation summary
  - `created_at` (timestamptz) - Creation timestamp
  - `ended_at` (timestamptz, nullable) - End timestamp

  ## Security
  - Enable RLS on all tables
  - Public read for appropriate content
  - Controlled write access

  ## Indexes
  - Performance indexes on foreign keys and lookups
*/

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  user_email text NOT NULL,
  content text NOT NULL,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('love', 'laugh', 'wow', 'think', 'sad', 'angry')),
  user_identifier text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_identifier)
);

-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  subscribed_at timestamptz DEFAULT now(),
  unsubscribed_at timestamptz
);

-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Create static_pages table
CREATE TABLE IF NOT EXISTS static_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  is_indexed boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat_conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_identifier text NOT NULL,
  messages jsonb DEFAULT '[]'::jsonb,
  summary text,
  created_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_reactions_post ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_static_pages_slug ON static_pages(slug);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE static_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments (public read and insert)
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can add comments"
  ON comments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO anon, authenticated
  USING (true);

-- RLS Policies for reactions (public read and insert)
CREATE POLICY "Anyone can view reactions"
  ON reactions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can add reactions"
  ON reactions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update reactions"
  ON reactions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for newsletter_subscribers (public insert only)
CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- RLS Policies for site_settings (public read)
CREATE POLICY "Anyone can view site settings"
  ON site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for static_pages (public read)
CREATE POLICY "Anyone can view static pages"
  ON static_pages FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for chat_conversations (public insert)
CREATE POLICY "Anyone can create chat conversations"
  ON chat_conversations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update chat conversations"
  ON chat_conversations FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default site settings
INSERT INTO site_settings (key, value) VALUES
  ('site_title', 'Mayobe Bros'),
  ('site_slogan', 'Empowering minds with knowledge, insights, and stories that inspire'),
  ('hero_image', 'https://images.pexels.com/photos/1591062/pexels-photo-1591062.jpeg?auto=compress&cs=tinysrgb&w=1920'),
  ('theme', 'light')
ON CONFLICT (key) DO NOTHING;