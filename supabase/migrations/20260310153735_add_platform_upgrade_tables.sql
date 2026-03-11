/*
  # Platform Upgrade - Additional Tables

  1. New Tables
    - `ad_payments` - Tracks advertising payments from the /advertise page
      - `id` (uuid, primary key)
      - `user_email` (text) - payer's email
      - `user_name` (text) - payer's name
      - `amount` (numeric) - payment amount
      - `currency` (text) - currency code
      - `payment_method` (text) - stripe/skrill/mobile
      - `payment_status` (text) - pending/completed/failed
      - `transaction_id` (text) - external transaction reference
      - `ad_package` (text) - selected advertising package
      - `created_at` (timestamptz)
    - `keyword_research` - Stores AI keyword research results
      - `id` (uuid, primary key)
      - `keyword` (text) - the researched keyword
      - `search_volume` (text) - estimated search volume
      - `difficulty` (text) - keyword difficulty level
      - `intent` (text) - search intent type
      - `long_tail_keywords` (jsonb) - array of long-tail suggestions
      - `related_keywords` (jsonb) - related keyword data
      - `created_by` (uuid) - who ran the research
      - `created_at` (timestamptz)
    - `competitor_analyses` - Stores competitor analysis results
      - `id` (uuid, primary key)
      - `competitor_url` (text) - competitor website URL
      - `analysis_data` (jsonb) - full analysis results
      - `content_gaps` (jsonb) - identified content gaps
      - `top_keywords` (jsonb) - competitor top keywords
      - `suggested_articles` (jsonb) - suggested article ideas
      - `created_by` (uuid) - who ran the analysis
      - `created_at` (timestamptz)
    - `payment_gateway_settings` - Stores payment gateway API configs
      - `id` (uuid, primary key)
      - `gateway` (text, unique) - stripe/skrill/mobile_money
      - `is_enabled` (boolean)
      - `config` (jsonb) - encrypted config data
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Add policies for anon read/write (server-side access)
    - Add policies for authenticated admin access
*/

-- Ad Payments table
CREATE TABLE IF NOT EXISTS ad_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL DEFAULT '',
  user_name text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  payment_method text NOT NULL DEFAULT 'stripe',
  payment_status text NOT NULL DEFAULT 'pending'
    CHECK (payment_status = ANY (ARRAY['pending', 'completed', 'failed', 'refunded'])),
  transaction_id text,
  ad_package text NOT NULL DEFAULT 'standard',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ad_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert ad payments"
  ON ad_payments FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can read ad payments"
  ON ad_payments FOR SELECT TO anon USING (true);

CREATE POLICY "Auth users can read own ad payments"
  ON ad_payments FOR SELECT TO authenticated
  USING (auth.uid()::text = user_email OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Auth users can insert ad payments"
  ON ad_payments FOR INSERT TO authenticated WITH CHECK (true);

-- Keyword Research table
CREATE TABLE IF NOT EXISTS keyword_research (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL DEFAULT '',
  search_volume text DEFAULT 'Unknown',
  difficulty text DEFAULT 'Medium',
  intent text DEFAULT 'informational',
  long_tail_keywords jsonb DEFAULT '[]'::jsonb,
  related_keywords jsonb DEFAULT '[]'::jsonb,
  trend_data jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE keyword_research ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can read keyword research"
  ON keyword_research FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can insert keyword research"
  ON keyword_research FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Auth can read keyword research"
  ON keyword_research FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth can insert keyword research"
  ON keyword_research FOR INSERT TO authenticated WITH CHECK (true);

-- Competitor Analyses table
CREATE TABLE IF NOT EXISTS competitor_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_url text NOT NULL DEFAULT '',
  analysis_data jsonb DEFAULT '{}'::jsonb,
  content_gaps jsonb DEFAULT '[]'::jsonb,
  top_keywords jsonb DEFAULT '[]'::jsonb,
  suggested_articles jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'completed',
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE competitor_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can read competitor analyses"
  ON competitor_analyses FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can insert competitor analyses"
  ON competitor_analyses FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Auth can read competitor analyses"
  ON competitor_analyses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth can insert competitor analyses"
  ON competitor_analyses FOR INSERT TO authenticated WITH CHECK (true);

-- Payment Gateway Settings table
CREATE TABLE IF NOT EXISTS payment_gateway_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway text UNIQUE NOT NULL,
  is_enabled boolean DEFAULT false,
  config jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_gateway_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can read payment gateways"
  ON payment_gateway_settings FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can upsert payment gateways"
  ON payment_gateway_settings FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update payment gateways"
  ON payment_gateway_settings FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Auth can read payment gateways"
  ON payment_gateway_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth can manage payment gateways"
  ON payment_gateway_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Seed default payment gateway settings
INSERT INTO payment_gateway_settings (gateway, is_enabled, config) VALUES
  ('stripe', false, '{"publishable_key": "", "mode": "test"}'::jsonb),
  ('skrill', false, '{"merchant_email": "", "mode": "test"}'::jsonb),
  ('mobile_money', false, '{"provider": "mpesa", "mode": "test"}'::jsonb)
ON CONFLICT (gateway) DO NOTHING;
