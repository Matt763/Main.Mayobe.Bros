import { Router } from 'express';
import { getSupabaseClient } from '../utils/supabase.js';

const router = Router();

const SITE_URL = 'https://mayobebros.com';
const SITE_NAME = 'Mayobe Bros';
const SITE_DESCRIPTION = 'Empowering minds with knowledge, insights, and stories that inspire.';

function escapeXml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

router.get('/', async (_req, res) => {
  try {
    const supabase = getSupabaseClient();

    const { data: posts } = await supabase
      .from('posts')
      .select('slug, title, excerpt, content, author, featured_image, published_at, updated_at, categories(slug, name)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50);

    const now = new Date().toUTCString();

    const items = (posts || []).map((post) => {
      const catSlug = (post.categories as any)?.slug || '';
      const catName = (post.categories as any)?.name || '';
      const url = `${SITE_URL}/post/${catSlug}/${post.slug}`;
      const description = post.excerpt
        ? escapeXml(post.excerpt)
        : escapeXml(stripHtml(post.content || '').slice(0, 300));
      const pubDate = new Date(post.published_at || Date.now()).toUTCString();

      return [
        '    <item>',
        `      <title>${escapeXml(post.title || '')}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <description>${description}</description>`,
        `      <author>${escapeXml(post.author || SITE_NAME)}</author>`,
        `      <category>${escapeXml(catName)}</category>`,
        `      <pubDate>${pubDate}</pubDate>`,
        post.featured_image ? `      <enclosure url="${escapeXml(post.featured_image)}" type="image/jpeg" length="0" />` : '',
        `      <media:content url="${escapeXml(post.featured_image || `${SITE_URL}/mayobebroslogo.png`)}" medium="image" />`,
        '    </item>',
      ].filter(Boolean).join('\n');
    });

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss version="2.0"',
      '  xmlns:atom="http://www.w3.org/2005/Atom"',
      '  xmlns:media="http://search.yahoo.com/mrss/"',
      '  xmlns:content="http://purl.org/rss/1.0/modules/content/">',
      '  <channel>',
      `    <title>${escapeXml(SITE_NAME)}</title>`,
      `    <link>${SITE_URL}</link>`,
      `    <description>${escapeXml(SITE_DESCRIPTION)}</description>`,
      '    <language>en-us</language>',
      `    <lastBuildDate>${now}</lastBuildDate>`,
      `    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />`,
      `    <image>`,
      `      <url>${SITE_URL}/mayobebroslogo.png</url>`,
      `      <title>${escapeXml(SITE_NAME)}</title>`,
      `      <link>${SITE_URL}</link>`,
      `    </image>`,
      ...items,
      '  </channel>',
      '</rss>',
    ].join('\n');

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800');
    res.send(xml);
  } catch (err) {
    console.error('RSS feed error:', err);
    res.status(500).send('<?xml version="1.0"?><error>Failed to generate feed</error>');
  }
});

export default router;
