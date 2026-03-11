import { Router } from 'express';
import { getSupabaseClient } from '../utils/supabase.js';

const router = Router();

interface TrendingPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  featured_image: string | null;
  author: string;
  published_at: string;
  views: number;
  categories: { slug: string; name: string } | null;
  score?: number;
  views_1h?: number;
  views_24h?: number;
  views_7d?: number;
}

async function computeTrendingScores(supabase: ReturnType<typeof getSupabaseClient>) {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 3600_000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 86400_000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400_000).toISOString();

  const { data: posts } = await supabase
    .from('posts')
    .select('id, slug, views, published_at, categories(slug)')
    .eq('status', 'published');

  if (!posts || posts.length === 0) return;

  const { data: viewEvents } = await supabase
    .from('post_view_events')
    .select('post_id, viewed_at')
    .gte('viewed_at', sevenDaysAgo);

  const eventsByPost = new Map<string, { ts: number }[]>();
  for (const ev of viewEvents || []) {
    const arr = eventsByPost.get(ev.post_id) || [];
    arr.push({ ts: new Date(ev.viewed_at).getTime() });
    eventsByPost.set(ev.post_id, arr);
  }

  const { data: commentCounts } = await supabase
    .from('comments')
    .select('post_id')
    .eq('status', 'approved');

  const commentsByPost = new Map<string, number>();
  for (const c of commentCounts || []) {
    commentsByPost.set(c.post_id, (commentsByPost.get(c.post_id) || 0) + 1);
  }

  const nowMs = now.getTime();
  const oneHourAgoMs = nowMs - 3600_000;
  const oneDayAgoMs = nowMs - 86400_000;

  const scores: {
    post_id: string;
    post_slug: string;
    score: number;
    views_1h: number;
    views_24h: number;
    views_7d: number;
    total_views: number;
    comment_count: number;
    updated_at: string;
  }[] = [];

  for (const post of posts) {
    const events = eventsByPost.get(post.id) || [];
    const views1h = events.filter(e => e.ts >= oneHourAgoMs).length;
    const views24h = events.filter(e => e.ts >= oneDayAgoMs).length;
    const views7d = events.length;
    const commentCount = commentsByPost.get(post.id) || 0;
    const totalViews = post.views || 0;

    const ageHours = Math.max(1, (nowMs - new Date(post.published_at || nowMs).getTime()) / 3600_000);
    const agePenalty = Math.pow(ageHours + 2, 1.5);

    const score = (
      views1h * 10 +
      views24h * 3 +
      views7d * 1 +
      commentCount * 5 +
      Math.log(totalViews + 1) * 2
    ) / agePenalty;

    scores.push({
      post_id: post.id,
      post_slug: post.slug,
      score,
      views_1h: views1h,
      views_24h: views24h,
      views_7d: views7d,
      total_views: totalViews,
      comment_count: commentCount,
      updated_at: now.toISOString(),
    });
  }

  for (const score of scores) {
    await supabase
      .from('trending_scores')
      .upsert(score, { onConflict: 'post_id' });
  }
}

let lastComputedAt = 0;
const COMPUTE_INTERVAL_MS = 5 * 60_000;

router.get('/', async (_req, res) => {
  try {
    const supabase = getSupabaseClient();

    const now = Date.now();
    if (now - lastComputedAt > COMPUTE_INTERVAL_MS) {
      lastComputedAt = now;
      computeTrendingScores(supabase).catch(e =>
        console.error('[TRENDING] Score compute error:', e)
      );
    }

    const { data: scores } = await supabase
      .from('trending_scores')
      .select('post_id, score, views_1h, views_24h, views_7d')
      .order('score', { ascending: false })
      .limit(10);

    if (!scores || scores.length === 0) {
      const { data: fallback } = await supabase
        .from('posts')
        .select('id, slug, title, excerpt, featured_image, author, published_at, views, categories(slug, name)')
        .eq('status', 'published')
        .order('views', { ascending: false })
        .limit(10);
      return res.json((fallback || []).map((p: any) => ({ ...p, score: p.views || 0 })));
    }

    const postIds = scores.map(s => s.post_id);
    const scoreMap = new Map(scores.map(s => [s.post_id, s]));

    const { data: posts } = await supabase
      .from('posts')
      .select('id, slug, title, excerpt, featured_image, author, published_at, views, categories(slug, name)')
      .in('id', postIds)
      .eq('status', 'published');

    const result: TrendingPost[] = (posts || [])
      .map((p: any) => {
        const scoreData = scoreMap.get(p.id);
        return {
          ...p,
          score: scoreData?.score || 0,
          views_1h: scoreData?.views_1h || 0,
          views_24h: scoreData?.views_24h || 0,
          views_7d: scoreData?.views_7d || 0,
        };
      })
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    res.setHeader('Cache-Control', 'public, max-age=180');
    res.json(result);
  } catch (err) {
    console.error('Error fetching trending posts:', err);
    res.status(500).json({ error: 'Failed to fetch trending posts' });
  }
});

router.post('/track-view', async (req, res) => {
  const { postId, postSlug, sessionId } = req.body;
  if (!postId || !postSlug) {
    return res.status(400).json({ error: 'postId and postSlug required' });
  }

  try {
    const supabase = getSupabaseClient();
    await supabase.from('post_view_events').insert({
      post_id: postId,
      post_slug: postSlug,
      session_id: sessionId || null,
      viewed_at: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to track view' });
  }
});

export default router;
