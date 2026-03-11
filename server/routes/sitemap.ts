import { Router } from 'express';
import { getSupabaseClient } from '../utils/supabase.js';

const router = Router();

const SITE_URL = 'https://mayobebros.com';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc: string, lastmod?: string, changefreq?: string, priority?: string, image?: { loc: string; title: string }): string {
  const lines: string[] = [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod.slice(0, 10)}</lastmod>` : '',
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : '',
    priority ? `    <priority>${priority}</priority>` : '',
  ];

  if (image) {
    lines.push(
      '    <image:image>',
      `      <image:loc>${escapeXml(image.loc)}</image:loc>`,
      `      <image:title>${escapeXml(image.title)}</image:title>`,
      '    </image:image>',
    );
  }

  lines.push('  </url>');
  return lines.filter(Boolean).join('\n');
}

router.get('/', async (_req, res) => {
  try {
    const supabase = getSupabaseClient();

    const [
      { data: posts },
      { data: categories },
      { data: labels },
      { data: pages },
    ] = await Promise.all([
      supabase
        .from('posts')
        .select('slug, category_id, updated_at, published_at, title, featured_image, categories(slug, name), labels(slug)')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(5000),
      supabase.from('categories').select('slug, name, updated_at').order('name'),
      supabase.from('labels').select('slug, name, category_id, categories(slug)').order('name'),
      supabase.from('static_pages').select('slug, updated_at, show_in_menu').eq('status', 'published').limit(100),
    ]);

    const staticPages = [
      { path: '/', changefreq: 'daily', priority: '1.0' },
      { path: '/about', changefreq: 'monthly', priority: '0.8' },
      { path: '/contact', changefreq: 'monthly', priority: '0.7' },
      { path: '/popular', changefreq: 'daily', priority: '0.8' },
      { path: '/category', changefreq: 'weekly', priority: '0.7' },
      { path: '/post', changefreq: 'daily', priority: '0.6' },
      { path: '/advertise', changefreq: 'monthly', priority: '0.5' },
      { path: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
      { path: '/terms-of-service', changefreq: 'yearly', priority: '0.3' },
      { path: '/cookie-policy', changefreq: 'yearly', priority: '0.3' },
    ];

    const now = new Date().toISOString().slice(0, 10);
    const entries: string[] = [];

    for (const page of staticPages) {
      entries.push(urlEntry(`${SITE_URL}${page.path}`, now, page.changefreq, page.priority));
    }

    for (const cat of categories || []) {
      entries.push(urlEntry(
        `${SITE_URL}/category/${cat.slug}`,
        cat.updated_at || now,
        'weekly',
        '0.8',
      ));
    }

    const seenLabelSlugs = new Set<string>();
    for (const label of labels || []) {
      const catSlug = (label.categories as any)?.slug;
      if (!catSlug) continue;
      const key = `${catSlug}/${label.slug}`;
      if (seenLabelSlugs.has(key)) continue;
      seenLabelSlugs.add(key);
      entries.push(urlEntry(
        `${SITE_URL}/category/${catSlug}/${label.slug}`,
        now,
        'weekly',
        '0.7',
      ));
    }

    for (const post of posts || []) {
      const catSlug = (post.categories as any)?.slug;
      const labelSlug = (post.labels as any)?.slug;
      if (!catSlug) continue;

      const loc = labelSlug
        ? `${SITE_URL}/post/${catSlug}/${labelSlug}/${post.slug}`
        : `${SITE_URL}/post/${catSlug}/${post.slug}`;

      const lastmod = post.updated_at || post.published_at || now;
      const imageEntry = post.featured_image
        ? { loc: post.featured_image, title: post.title }
        : undefined;

      entries.push(urlEntry(loc, lastmod, 'monthly', '0.9', imageEntry));
    }

    for (const page of pages || []) {
      entries.push(urlEntry(
        `${SITE_URL}/page/${page.slug}`,
        page.updated_at || now,
        'monthly',
        '0.6',
      ));
    }

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
      ...entries,
      '</urlset>',
    ].join('\n');

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Robots-Tag', 'noindex');
    res.send(xml);
  } catch (err) {
    console.error('Sitemap error:', err);
    res.status(500).send('<?xml version="1.0"?><error>Failed to generate sitemap</error>');
  }
});

export default router;
