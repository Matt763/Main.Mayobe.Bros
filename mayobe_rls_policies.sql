-- ============================================================
-- Mayobe Bros — RLS Policies Migration
-- Run in Supabase SQL Editor (project: wnzrbqqlrwalvncispxm)
-- Drops ALL existing policies per table then recreates them
-- ============================================================

DO $$
DECLARE
  pol RECORD;
  tables TEXT[] := ARRAY[
    'activity_logs','ad_events','ad_payments','ad_settings','admin_users',
    'ai_engine_settings','categories','chat_conversations','cms_notifications',
    'comment_replies','comments','competitor_analyses','contact_submissions',
    'indexing_events','keyword_research','labels','media_library',
    'newsletter_subscribers','online_visitors','page_views','password_change_log',
    'payment_gateway_settings','post_view_events','posts','premium_purchases',
    'reactions','registered_users','reviews','site_settings',
    'social_media_accounts','social_media_posts','topic_cluster_posts',
    'topic_clusters','trending_scores'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, tbl);
    END LOOP;
  END LOOP;
END $$;

-- ── Ensure RLS is enabled on all tables ──────────────────────
ALTER TABLE IF EXISTS activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ad_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ad_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ad_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_engine_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cms_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comment_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS competitor_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS indexing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS keyword_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS online_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS password_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_gateway_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS post_view_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS premium_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS registered_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS social_media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS topic_cluster_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS topic_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS trending_scores ENABLE ROW LEVEL SECURITY;

-- ── activity_logs ────────────────────────────────────────────
CREATE POLICY "Anyone can read activity logs" ON activity_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anon can insert activity logs" ON activity_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated users can insert activity logs" ON activity_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ── ad_events ────────────────────────────────────────────────
CREATE POLICY "Anyone can read ad events" ON ad_events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anon can insert ad events" ON ad_events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated can insert ad events" ON ad_events FOR INSERT TO authenticated WITH CHECK (true);

-- ── ad_payments ──────────────────────────────────────────────
CREATE POLICY "Anyone can read ad payments" ON ad_payments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anon can insert ad payments" ON ad_payments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Auth users can insert ad payments" ON ad_payments FOR INSERT TO authenticated WITH CHECK (true);

-- ── ad_settings ──────────────────────────────────────────────
CREATE POLICY "Anyone can read ad settings" ON ad_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated users can insert ad settings" ON ad_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update ad settings" ON ad_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete ad settings" ON ad_settings FOR DELETE TO authenticated USING (true);

-- ── admin_users ──────────────────────────────────────────────
CREATE POLICY "Authenticated users can read admin_users" ON admin_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert admin_users" ON admin_users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update admin_users" ON admin_users FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete admin_users" ON admin_users FOR DELETE TO authenticated USING (true);

-- ── ai_engine_settings ───────────────────────────────────────
CREATE POLICY "Anyone can read ai settings" ON ai_engine_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anon can update ai settings" ON ai_engine_settings FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can insert ai settings" ON ai_engine_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update ai settings" ON ai_engine_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ── categories ───────────────────────────────────────────────
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow inserts for categories" ON categories FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anon can delete categories via server" ON categories FOR DELETE TO anon USING (true);
CREATE POLICY "Anon can update categories via server" ON categories FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete categories" ON categories FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated users can update categories" ON categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ── chat_conversations ───────────────────────────────────────
CREATE POLICY "Anyone can read chat conversations" ON chat_conversations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create chat conversations" ON chat_conversations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update chat conversations" ON chat_conversations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- ── cms_notifications ────────────────────────────────────────
CREATE POLICY "Authenticated can read notifications" ON cms_notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can upsert notifications" ON cms_notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update notifications" ON cms_notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ── comment_replies ──────────────────────────────────────────
CREATE POLICY "Anyone can read replies" ON comment_replies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert replies" ON comment_replies FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated can update replies" ON comment_replies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete replies" ON comment_replies FOR DELETE TO authenticated USING (true);

-- ── comments ─────────────────────────────────────────────────
CREATE POLICY "Anyone can read comments" ON comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add comments" ON comments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE TO anon, authenticated USING (true);

-- ── competitor_analyses ──────────────────────────────────────
CREATE POLICY "Anyone can read competitor analyses" ON competitor_analyses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anon can insert competitor analyses" ON competitor_analyses FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Auth can insert competitor analyses" ON competitor_analyses FOR INSERT TO authenticated WITH CHECK (true);

-- ── contact_submissions ──────────────────────────────────────
CREATE POLICY "Authenticated can read contact submissions" ON contact_submissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can submit contact forms" ON contact_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update contact submissions" ON contact_submissions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete contact submissions" ON contact_submissions FOR DELETE TO authenticated USING (true);

-- ── indexing_events ──────────────────────────────────────────
CREATE POLICY "Authenticated can read indexing events" ON indexing_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Server can insert indexing events" ON indexing_events FOR INSERT TO anon WITH CHECK (true);

-- ── keyword_research ─────────────────────────────────────────
CREATE POLICY "Authenticated can read keyword research" ON keyword_research FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon can insert keyword research" ON keyword_research FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Auth can insert keyword research" ON keyword_research FOR INSERT TO authenticated WITH CHECK (true);

-- ── labels ───────────────────────────────────────────────────
CREATE POLICY "Anyone can view labels" ON labels FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow inserts for labels" ON labels FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anon can delete labels via server" ON labels FOR DELETE TO anon USING (true);
CREATE POLICY "Anon can update labels via server" ON labels FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete labels" ON labels FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated users can update labels" ON labels FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ── media_library ────────────────────────────────────────────
CREATE POLICY "Anyone can view media" ON media_library FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anon can insert media via server" ON media_library FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update media via server" ON media_library FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon can delete media via server" ON media_library FOR DELETE TO anon USING (true);
CREATE POLICY "Authenticated users can upload media" ON media_library FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update media" ON media_library FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete media" ON media_library FOR DELETE TO authenticated USING (true);

-- ── newsletter_subscribers ───────────────────────────────────
CREATE POLICY "Authenticated can read subscribers" ON newsletter_subscribers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ── online_visitors ──────────────────────────────────────────
CREATE POLICY "Authenticated can read online visitors" ON online_visitors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon can insert online visitors" ON online_visitors FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update own online visitor record" ON online_visitors FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can insert online visitors" ON online_visitors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update online visitors" ON online_visitors FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete online visitors" ON online_visitors FOR DELETE TO authenticated USING (true);

-- ── page_views ───────────────────────────────────────────────
CREATE POLICY "Authenticated can read page views" ON page_views FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon can insert page views" ON page_views FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated can insert page views" ON page_views FOR INSERT TO authenticated WITH CHECK (true);

-- ── password_change_log ──────────────────────────────────────
CREATE POLICY "Authenticated can read password log" ON password_change_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert their own password log" ON password_change_log FOR INSERT TO authenticated WITH CHECK (true);

-- ── payment_gateway_settings ─────────────────────────────────
CREATE POLICY "Anyone can read payment gateways" ON payment_gateway_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anon can upsert payment gateways" ON payment_gateway_settings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update payment gateways" ON payment_gateway_settings FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Auth can manage payment gateways" ON payment_gateway_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ── post_view_events ─────────────────────────────────────────
CREATE POLICY "Authenticated can read view events" ON post_view_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert view events" ON post_view_events FOR INSERT TO anon WITH CHECK (true);

-- ── posts ────────────────────────────────────────────────────
CREATE POLICY "Anyone can view posts" ON posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow inserts for posts" ON posts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anon can update posts via server" ON posts FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon can delete posts via server" ON posts FOR DELETE TO anon USING (true);
CREATE POLICY "Authenticated users can update posts" ON posts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete posts" ON posts FOR DELETE TO authenticated USING (true);

-- ── premium_purchases ────────────────────────────────────────
CREATE POLICY "Authenticated can read purchases" ON premium_purchases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon can insert purchases for server" ON premium_purchases FOR INSERT TO anon WITH CHECK (true);

-- ── reactions ────────────────────────────────────────────────
CREATE POLICY "Anyone can read reactions" ON reactions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add reactions" ON reactions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update reactions" ON reactions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- ── registered_users ─────────────────────────────────────────
CREATE POLICY "Anyone can read registered users" ON registered_users FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anon can insert own record" ON registered_users FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update own record" ON registered_users FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can update all records" ON registered_users FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete records" ON registered_users FOR DELETE TO authenticated USING (true);

-- ── reviews ──────────────────────────────────────────────────
CREATE POLICY "Anyone can read reviews" ON reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can submit a review" ON reviews FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update reviews" ON reviews FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete reviews" ON reviews FOR DELETE TO authenticated USING (true);

-- ── site_settings ────────────────────────────────────────────
CREATE POLICY "Anyone can read site settings" ON site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anon can insert site settings via server" ON site_settings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update site settings via server" ON site_settings FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon can delete site settings via server" ON site_settings FOR DELETE TO anon USING (true);
CREATE POLICY "Authenticated users can insert site settings" ON site_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update site settings" ON site_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete site settings" ON site_settings FOR DELETE TO authenticated USING (true);

-- ── social_media_accounts ────────────────────────────────────
CREATE POLICY "Authenticated can read social accounts" ON social_media_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon can update social accounts" ON social_media_accounts FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can insert social accounts" ON social_media_accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update social accounts" ON social_media_accounts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete social accounts" ON social_media_accounts FOR DELETE TO authenticated USING (true);

-- ── social_media_posts ───────────────────────────────────────
CREATE POLICY "Authenticated can read social posts" ON social_media_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon can insert social posts" ON social_media_posts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated users can insert social posts" ON social_media_posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update social posts" ON social_media_posts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete social posts" ON social_media_posts FOR DELETE TO authenticated USING (true);

-- ── topic_cluster_posts ──────────────────────────────────────
CREATE POLICY "Authenticated can read cluster posts" ON topic_cluster_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage cluster posts" ON topic_cluster_posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can delete cluster posts" ON topic_cluster_posts FOR DELETE TO authenticated USING (true);

-- ── topic_clusters ───────────────────────────────────────────
CREATE POLICY "Authenticated can read topic clusters" ON topic_clusters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage topic clusters" ON topic_clusters FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update topic clusters" ON topic_clusters FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete topic clusters" ON topic_clusters FOR DELETE TO authenticated USING (true);

-- ── trending_scores ──────────────────────────────────────────
CREATE POLICY "Anyone can read trending scores" ON trending_scores FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Server can upsert trending scores" ON trending_scores FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Server can update trending scores" ON trending_scores FOR UPDATE TO anon USING (true) WITH CHECK (true);
