import { Router } from 'express';
import { getSupabaseClient } from '../utils/supabase.js';

const router = Router();

const SITE_URL = 'https://www.mayobebros.com';
const SITE_NAME = 'Mayobe Bros';
const SITE_DESCRIPTION = 'Empowering minds with knowledge, insights, and stories that inspire.';
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;
const FEED_URL = `${SITE_URL}/feed.xml`;

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

/** Wrap HTML in CDATA — no escaping needed inside CDATA */
function cdataWrap(html: string): string {
  // Sanitise any CDATA-closing sequences inside the content
  return `<![CDATA[${(html || '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseClient();

    const { data: posts } = await supabase
      .from('posts')
      .select('slug, title, excerpt, content, author, featured_image, published_at, updated_at, created_at, categories(slug, name)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50);

    const latestPost = posts?.[0];
    const lastBuildDate = new Date(
      latestPost?.updated_at || latestPost?.published_at || Date.now()
    ).toUTCString();

    const items = (posts || []).map((post) => {
      const catSlug = (post.categories as any)?.slug || '';
      const catName = (post.categories as any)?.name || '';
      const url = `${SITE_URL}/post/${catSlug}/${post.slug}`;

      const description = post.excerpt
        ? escapeXml(post.excerpt)
        : escapeXml(stripHtml(post.content || '').slice(0, 300));

      // Use published_at → created_at → now for pubDate
      const pubDate = new Date(
        post.published_at || post.created_at || Date.now()
      ).toUTCString();

      // Use updated_at → published_at → now for <atom:updated>
      const updatedDate = new Date(
        post.updated_at || post.published_at || post.created_at || Date.now()
      ).toISOString();

      // Full content for feed readers (CDATA preserves HTML safely)
      const fullContent = post.content
        ? cdataWrap(post.content)
        : cdataWrap(`<p>${post.excerpt || ''}</p>`);

      const imageUrl = post.featured_image || `${SITE_URL}/mayobebroslogo.png`;

      return [
        '    <item>',
        `      <title>${escapeXml(post.title || '')}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <description>${description}</description>`,
        `      <content:encoded>${fullContent}</content:encoded>`,
        `      <author>${escapeXml(post.author || SITE_NAME)}</author>`,
        catName ? `      <category>${escapeXml(catName)}</category>` : '',
        `      <pubDate>${pubDate}</pubDate>`,
        `      <atom:updated>${updatedDate}</atom:updated>`,
        post.featured_image
          ? `      <enclosure url="${escapeXml(post.featured_image)}" type="image/jpeg" length="0" />`
          : '',
        `      <media:content url="${escapeXml(imageUrl)}" medium="image" />`,
        '    </item>',
      ].filter(Boolean).join('\n');
    });

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<?xml-stylesheet type="text/xsl" href="/feed.xsl"?>',
      '<rss version="2.0"',
      '  xmlns:atom="http://www.w3.org/2005/Atom"',
      '  xmlns:media="http://search.yahoo.com/mrss/"',
      '  xmlns:content="http://purl.org/rss/1.0/modules/content/"',
      '  xmlns:sy="http://purl.org/rss/1.0/modules/syndication/">',
      '  <channel>',
      `    <title>${escapeXml(SITE_NAME)}</title>`,
      `    <link>${SITE_URL}</link>`,
      `    <description>${escapeXml(SITE_DESCRIPTION)}</description>`,
      '    <language>en-us</language>',
      `    <lastBuildDate>${lastBuildDate}</lastBuildDate>`,
      '    <ttl>60</ttl>',
      '    <sy:updatePeriod>hourly</sy:updatePeriod>',
      '    <sy:updateFrequency>1</sy:updateFrequency>',
      `    <atom:link href="${FEED_URL}" rel="self" type="application/rss+xml" />`,
      `    <atom:link href="${SITEMAP_URL}" rel="related" type="application/xml" title="XML Sitemap" />`,
      `    <image>`,
      `      <url>${SITE_URL}/mayobebroslogo.png</url>`,
      `      <title>${escapeXml(SITE_NAME)}</title>`,
      `      <link>${SITE_URL}</link>`,
      `      <width>144</width>`,
      `      <height>144</height>`,
      `    </image>`,
      ...items,
      '  </channel>',
      '</rss>',
    ].join('\n');

    res
      .setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
      .setHeader('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600')
      .setHeader('X-Sitemap', SITEMAP_URL)
      .send(xml);
  } catch (err) {
    console.error('RSS feed error:', err);
    res.status(500).send('<?xml version="1.0"?><error>Failed to generate feed</error>');
  }
});

export default router;
