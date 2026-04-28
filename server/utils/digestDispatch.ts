import { createClient } from '@supabase/supabase-js';
import { sendFiveDayDigestEmail, type DigestPost } from './resend.js';

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key);
}

function getSiteUrl(): string {
  return process.env.VITE_SITE_URL || 'https://mayobebros.com';
}

const DIGEST_INTERVAL_DAYS = 5;
const SEND_DELAY_MS = 220;
const MAX_POSTS_IN_EMAIL = 8;

export interface DigestResult {
  sent: boolean;
  skipped?: boolean;
  reason?: 'too_soon' | 'no_posts';
  postCount?: number;
  subscriberCount?: number;
}

export async function dispatchFiveDayDigest(): Promise<DigestResult> {
  const supabase = getSupabase();
  const siteUrl = getSiteUrl();
  const now = new Date();

  // Check when last digest was successfully sent
  const { data: lastSent } = await supabase
    .from('digest_send_log')
    .select('sent_at')
    .eq('status', 'sent')
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastSent) {
    const daysSinceLast =
      (now.getTime() - new Date(lastSent.sent_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLast < DIGEST_INTERVAL_DAYS) {
      return { sent: false, skipped: true, reason: 'too_soon' };
    }
  }

  // Window: from the last sent timestamp (or 5 days ago) to now
  const windowStart = lastSent
    ? new Date(lastSent.sent_at)
    : new Date(now.getTime() - DIGEST_INTERVAL_DAYS * 24 * 60 * 60 * 1000);

  // Fetch posts published in the window
  const { data: posts, error: postsErr } = await supabase
    .from('posts')
    .select('id, title, excerpt, featured_image, slug, author, reading_time, published_at, categories(name, slug)')
    .eq('status', 'published')
    .gte('published_at', windowStart.toISOString())
    .lte('published_at', now.toISOString())
    .order('published_at', { ascending: false });

  if (postsErr) throw postsErr;

  if (!posts || posts.length === 0) {
    return { sent: false, skipped: true, reason: 'no_posts' };
  }

  // Create a pending log row
  const { data: logEntry, error: logErr } = await supabase
    .from('digest_send_log')
    .insert({
      period_start: windowStart.toISOString(),
      period_end: now.toISOString(),
      status: 'pending',
    })
    .select('id')
    .single();

  if (logErr) {
    console.error('[DIGEST] Failed to create log entry:', logErr);
    throw logErr;
  }

  try {
    const { data: subscribers, error: subErr } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, unsubscribe_token')
      .eq('is_active', true);

    if (subErr) throw subErr;

    if (!subscribers || subscribers.length === 0) {
      await supabase
        .from('digest_send_log')
        .update({ status: 'sent', post_count: posts.length, subscriber_count: 0 })
        .eq('id', logEntry.id);
      console.log('[DIGEST] No active subscribers — logged as sent with 0 recipients');
      return { sent: true, postCount: posts.length, subscriberCount: 0 };
    }

    // Build post objects for the email (cap at MAX_POSTS_IN_EMAIL most recent)
    const displayPosts: DigestPost[] = posts.slice(0, MAX_POSTS_IN_EMAIL).map((p: any) => {
      const catSlug = p.categories?.slug || '';
      const postPath = catSlug ? `/post/${catSlug}/${p.slug}` : `/post/${p.slug}`;
      return {
        title: p.title,
        excerpt: p.excerpt || 'Read the latest from Mayobe Bros.',
        featuredImage: p.featured_image || undefined,
        url: `${siteUrl}${postPath}`,
        category: p.categories?.name || 'Article',
        author: p.author || 'Mayobe Bros',
        readingTime: p.reading_time || undefined,
        publishedAt: p.published_at,
      };
    });

    const dateRange = { start: windowStart, end: now };
    let sentCount = 0;

    for (let i = 0; i < subscribers.length; i++) {
      const sub = subscribers[i];
      try {
        const unsubUrl = `${siteUrl}/api/newsletter/unsubscribe?token=${sub.unsubscribe_token}`;
        await sendFiveDayDigestEmail(
          sub.email, unsubUrl, siteUrl, displayPosts, dateRange, posts.length
        );
        sentCount++;
      } catch (e: any) {
        console.error(`[DIGEST] Failed to send to ${sub.email}:`, e?.message || e);
      }
      if (i < subscribers.length - 1) {
        await new Promise(r => setTimeout(r, SEND_DELAY_MS));
      }
    }

    await supabase
      .from('digest_send_log')
      .update({ status: 'sent', post_count: posts.length, subscriber_count: sentCount })
      .eq('id', logEntry.id);

    console.log(
      `[DIGEST] Sent to ${sentCount}/${subscribers.length} — ${posts.length} posts ` +
      `(${windowStart.toISOString().slice(0, 10)} → ${now.toISOString().slice(0, 10)})`
    );
    return { sent: true, postCount: posts.length, subscriberCount: sentCount };

  } catch (err: any) {
    console.error('[DIGEST] Dispatch failed:', err);
    await supabase
      .from('digest_send_log')
      .update({ status: 'failed', error: err.message || 'Unknown error' })
      .eq('id', logEntry.id);
    throw err;
  }
}
