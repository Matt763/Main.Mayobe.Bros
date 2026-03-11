import { createClient } from '@supabase/supabase-js';
import { sendPostDigestEmail, type DigestPostData, type RelatedPostData } from './resend.js';

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key);
}

function getSiteUrl(): string {
  return process.env.VITE_SITE_URL || 'https://mayobebros.com';
}

export async function dispatchPostNewsletter(post: {
  id?: string;
  slug: string;
  title: string;
  excerpt?: string;
  featuredImage?: string;
  categoryName?: string;
  author?: string;
  readingTime?: number;
}): Promise<void> {
  const supabase = getSupabase();
  const siteUrl = getSiteUrl();

  const { data: existing } = await supabase
    .from('newsletter_send_log')
    .select('id, status')
    .eq('post_slug', post.slug)
    .maybeSingle();

  if (existing && (existing.status === 'sent' || existing.status === 'pending')) {
    console.log(`[NEWSLETTER] Already ${existing.status} for slug: ${post.slug} — skipping`);
    return;
  }

  const { data: logEntry, error: logErr } = await supabase
    .from('newsletter_send_log')
    .insert({
      post_id: post.id || null,
      post_slug: post.slug,
      status: 'pending',
    })
    .select()
    .single();

  if (logErr) {
    console.error('[NEWSLETTER] Failed to create send log:', logErr);
    return;
  }

  try {
    const { data: subscribers, error: subErr } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, unsubscribe_token')
      .eq('is_active', true);

    if (subErr) throw subErr;

    if (!subscribers || subscribers.length === 0) {
      console.log('[NEWSLETTER] No active subscribers');
      await supabase
        .from('newsletter_send_log')
        .update({ status: 'sent', subscriber_count: 0 })
        .eq('id', logEntry.id);
      return;
    }

    const { data: relatedRows } = await supabase
      .from('posts')
      .select('title, excerpt, featured_image, slug, categories(name)')
      .eq('status', 'published')
      .neq('slug', post.slug)
      .order('published_at', { ascending: false })
      .limit(3);

    const relatedPosts: RelatedPostData[] = (relatedRows || []).map((r: any) => ({
      title: r.title,
      excerpt: r.excerpt || '',
      featuredImage: r.featured_image || undefined,
      url: `${siteUrl}/post/${r.slug}`,
      category: r.categories?.name || 'Article',
    }));

    const postData: DigestPostData = {
      title: post.title,
      excerpt: post.excerpt || 'Read the latest article from Mayobe Bros.',
      featuredImage: post.featuredImage,
      url: `${siteUrl}/post/${post.slug}`,
      category: post.categoryName || 'Article',
      author: post.author || 'Mayobe Bros',
      readingTime: post.readingTime,
    };

    const BATCH_SIZE = 10;
    const BATCH_DELAY_MS = 300;
    let sentCount = 0;

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (sub) => {
          const unsubUrl = `${siteUrl}/api/newsletter/unsubscribe?token=${sub.unsubscribe_token}`;
          await sendPostDigestEmail(sub.email, unsubUrl, siteUrl, postData, relatedPosts);
        })
      );
      sentCount += results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        console.error(`[NEWSLETTER] ${failed.length} failures in batch ${Math.floor(i / BATCH_SIZE) + 1}`);
      }
      if (i + BATCH_SIZE < subscribers.length) {
        await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
      }
    }

    await supabase
      .from('newsletter_send_log')
      .update({ status: 'sent', subscriber_count: sentCount })
      .eq('id', logEntry.id);

    console.log(`[NEWSLETTER] Dispatched to ${sentCount}/${subscribers.length} for "${post.slug}"`);
  } catch (err: any) {
    console.error('[NEWSLETTER] Dispatch failed:', err);
    await supabase
      .from('newsletter_send_log')
      .update({ status: 'failed', error: err.message || 'Unknown error' })
      .eq('id', logEntry.id);
  }
}
