import fs from 'fs';
import path from 'path';
import { getSupabaseClient } from './supabase.js';

const SITE_NAME = 'Mayobe Bros';
const SITE_URL = 'https://mayobebros.com';
const DEFAULT_IMAGE = 'https://images.pexels.com/photos/1591062/pexels-photo-1591062.jpeg?auto=compress&cs=tinysrgb&w=1200';
const DEFAULT_DESCRIPTION = 'Your trusted source for quality content across education, business, technology, gaming, history, and career opportunities.';

interface MetaTags {
  title: string;
  description: string;
  image: string;
  url: string;
  type: string;
  siteName: string;
  publishedTime?: string;
  author?: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildMetaHtml(tags: MetaTags): string {
  const t = escapeHtml(tags.title);
  const d = escapeHtml(tags.description.slice(0, 160));
  const i = escapeHtml(tags.image);
  const u = escapeHtml(tags.url);
  const s = escapeHtml(tags.siteName);

  const articleTags = tags.type === 'article' ? `
    <meta property="article:published_time" content="${tags.publishedTime || ''}" />
    <meta property="article:author" content="${escapeHtml(tags.author || SITE_NAME)}" />
    <meta property="article:section" content="Blog" />` : '';

  return `
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <link rel="canonical" href="${u}" />

    <meta property="og:type" content="${tags.type}" />
    <meta property="og:url" content="${u}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:image" content="${i}" />
    <meta property="og:image:secure_url" content="${i}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${t}" />
    <meta property="og:site_name" content="${s}" />
    <meta property="og:locale" content="en_US" />${articleTags}

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@mayobebros" />
    <meta name="twitter:url" content="${u}" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${i}" />
    <meta name="twitter:image:alt" content="${t}" />`;
}

function injectMeta(html: string, tags: MetaTags): string {
  const metaHtml = buildMetaHtml(tags);

  const cleaned = html
    .replace(/<title>[^<]*<\/title>/gi, '')
    .replace(/<meta\s+name="description"[^>]*>/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>/gi, '')
    .replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, '')
    .replace(/<meta\s+property="article:[^"]*"[^>]*>/gi, '')
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, '')
    .replace(/<meta\s+property="twitter:[^"]*"[^>]*>/gi, '');

  return cleaned.replace('</head>', `${metaHtml}\n  </head>`);
}

async function resolveMetaTags(urlPath: string): Promise<MetaTags | null> {
  const supabase = getSupabaseClient();

  if (urlPath.startsWith('/post/')) {
    // Grab the last URL segment as the slug (handles /post/cat/slug AND /post/cat/label/slug)
    const slug = urlPath.split('/').filter(Boolean).pop() || '';
    const { data } = await supabase
      .from('posts')
      .select('title, excerpt, content, featured_image, meta_title, meta_description, slug, published_at, author, category_id, categories(slug)')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (data) {
      // Use clean post title for og:title (no site name suffix — keeps social cards clean)
      const title = data.meta_title || data.title;
      const rawDesc = data.meta_description || data.excerpt || stripHtml(data.content || '');
      const description = rawDesc.slice(0, 160);
      const rawImage = data.featured_image || DEFAULT_IMAGE;
      const image = (rawImage.startsWith('http') ? rawImage : `${SITE_URL}${rawImage}`).replace(/^http:\/\//, 'https://');
      const catSlug = (data.categories as any)?.slug || '';
      const postUrl = catSlug
        ? `${SITE_URL}/post/${catSlug}/${data.slug}`
        : `${SITE_URL}/post/${data.slug}`;
      return {
        title,
        description,
        image,
        url: postUrl,
        type: 'article',
        siteName: SITE_NAME,
        publishedTime: data.published_at || undefined,
        author: data.author || undefined,
      };
    }
  }

  const categoryMatch = urlPath.match(/^\/category\/([^/?#]+)/);
  if (categoryMatch) {
    const slug = categoryMatch[1];
    const { data } = await supabase
      .from('categories')
      .select('name, description, featured_image, meta_title, meta_description, slug')
      .eq('slug', slug)
      .maybeSingle();

    if (data) {
      const title = data.meta_title || `${data.name} Articles | ${SITE_NAME}`;
      const description = data.meta_description || data.description
        || `Browse the latest ${data.name} articles, guides and insights on ${SITE_NAME}.`;
      const rawImage = data.featured_image || DEFAULT_IMAGE;
      const image = (rawImage.startsWith('http') ? rawImage : `${SITE_URL}${rawImage}`).replace(/^http:\/\//, 'https://');
      return {
        title,
        description: description.slice(0, 160),
        image,
        url: `${SITE_URL}/category/${data.slug}`,
        type: 'website',
        siteName: SITE_NAME,
      };
    }
  }

  const pageMatch = urlPath.match(/^\/page\/([^/?#]+)/);
  if (pageMatch) {
    const slug = pageMatch[1];
    const { data } = await supabase
      .from('static_pages')
      .select('title, content, meta_title, meta_description, featured_image, slug')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();

    if (data) {
      const title = data.meta_title || `${data.title} | ${SITE_NAME}`;
      const rawDesc = data.meta_description || stripHtml(data.content || '');
      const description = rawDesc.slice(0, 160);
      const rawImage = (data as any).featured_image || DEFAULT_IMAGE;
      const image = (rawImage.startsWith('http') ? rawImage : `${SITE_URL}${rawImage}`).replace(/^http:\/\//, 'https://');
      return {
        title,
        description,
        image,
        url: `${SITE_URL}/page/${data.slug}`,
        type: 'website',
        siteName: SITE_NAME,
      };
    }
  }

  return null;
}

export async function serveWithMeta(
  req: { path: string },
  res: { setHeader: (k: string, v: string) => void; status: (code: number) => { send: (body: string) => void }; send: (body: string) => void },
  distPath: string
): Promise<void> {
  const indexPath = path.join(distPath, 'index.html');
  let html: string;

  try {
    html = fs.readFileSync(indexPath, 'utf-8');
  } catch {
    (res as any).status(500).send('index.html not found');
    return;
  }

  try {
    const tags = await resolveMetaTags(req.path);
    if (tags) {
      html = injectMeta(html, tags);
    }
  } catch (err) {
    console.error('[metaInjector] error resolving meta:', err);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  res.send(html);
}
