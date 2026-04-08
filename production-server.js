import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

import authRoutes from './server/routes/auth.js';
import postsRoutes from './server/routes/posts.js';
import pagesRoutes from './server/routes/pages.js';
import categoriesRoutes from './server/routes/categories.js';
import labelsRoutes from './server/routes/labels.js';
import imagesRoutes from './server/routes/images.js';
import settingsRoutes from './server/routes/settings.js';
import commentsRoutes from './server/routes/comments.js';
import reviewsRoutes from './server/routes/reviews.js';
import itangoRoutes from './server/routes/itango.js';
import editorAiRoutes from './server/routes/editor-ai.js';
import videoAnalyticsRoutes from './server/routes/videoAnalytics.js';
import contactRoutes from './server/routes/contact.js';
import newsletterRoutes from './server/routes/newsletter.js';
import premiumRoutes from './server/routes/premium.js';
import socialAutomationRoutes from './server/routes/socialAutomation.js';
import trendingRoutes from './server/routes/trending.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_NAME = 'Mayobe Bros';
const SITE_URL = 'https://mayobebros.com';
const DEFAULT_IMAGE = `${SITE_URL}/mayobebrosfavicon.png`;
const DEFAULT_DESCRIPTION = 'Your trusted source for quality content across education, business, technology, gaming, history, and career opportunities.';

let _supabase = null;
function getSupabase() {
  if (_supabase) return _supabase;
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _supabase = createClient(url, key, { auth: { persistSession: false } });
  return _supabase;
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildMetaHtml(title, description, image, url, type) {
  const t = escapeHtml(title);
  const d = escapeHtml(description.slice(0, 160));
  const i = escapeHtml(image);
  const u = escapeHtml(url);
  const s = escapeHtml(SITE_NAME);
  return `
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <link rel="canonical" href="${u}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:url" content="${u}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:image" content="${i}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="${s}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${u}" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${i}" />`;
}

function injectMeta(html, title, description, image, url, type) {
  const metaHtml = buildMetaHtml(title, description, image, url, type);
  const cleaned = html
    .replace(/<title>[^<]*<\/title>/gi, '')
    .replace(/<meta\s+name="description"[^>]*>/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>/gi, '')
    .replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, '')
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, '')
    .replace(/<meta\s+property="twitter:[^"]*"[^>]*>/gi, '');
  return cleaned.replace('</head>', `${metaHtml}\n  </head>`);
}

async function resolveAndServe(reqPath, res, indexHtml) {
  const supabase = getSupabase();
  let html = indexHtml;

  if (supabase) {
    try {
      const postMatch = reqPath.match(/^\/post\/([^/?#]+)/);
      const categoryMatch = reqPath.match(/^\/category\/([^/?#]+)/);
      const pageMatch = reqPath.match(/^\/page\/([^/?#]+)/);

      if (postMatch) {
        const { data } = await supabase
          .from('posts')
          .select('title, excerpt, content, featured_image, meta_title, meta_description, slug')
          .eq('slug', postMatch[1])
          .eq('status', 'published')
          .maybeSingle();
        if (data) {
          const title = data.meta_title || `${data.title} | ${SITE_NAME}`;
          const desc = (data.meta_description || data.excerpt || stripHtml(data.content || '')).slice(0, 160);
          const image = data.featured_image || DEFAULT_IMAGE;
          html = injectMeta(html, title, desc, image, `${SITE_URL}/post/${data.slug}`, 'article');
        }
      } else if (categoryMatch) {
        const { data } = await supabase
          .from('categories')
          .select('name, description, featured_image, meta_title, meta_description, slug')
          .eq('slug', categoryMatch[1])
          .maybeSingle();
        if (data) {
          const title = data.meta_title || `${data.name} Articles | ${SITE_NAME}`;
          const desc = (data.meta_description || data.description || `Browse the latest ${data.name} articles on ${SITE_NAME}.`).slice(0, 160);
          const image = data.featured_image || DEFAULT_IMAGE;
          html = injectMeta(html, title, desc, image, `${SITE_URL}/category/${data.slug}`, 'website');
        }
      } else if (pageMatch) {
        const { data } = await supabase
          .from('static_pages')
          .select('title, content, meta_title, meta_description, featured_image, slug')
          .eq('slug', pageMatch[1])
          .eq('published', true)
          .maybeSingle();
        if (data) {
          const title = data.meta_title || `${data.title} | ${SITE_NAME}`;
          const desc = (data.meta_description || stripHtml(data.content || '')).slice(0, 160);
          const image = data.featured_image || DEFAULT_IMAGE;
          html = injectMeta(html, title, desc, image, `${SITE_URL}/page/${data.slug}`, 'website');
        }
      }
    } catch (err) {
      console.error('[meta] error:', err);
    }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  res.send(html);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://www.mayobebros.com',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'mayobebros-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use('/data/images', express.static(path.join(__dirname, 'data/images')));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/labels', labelsRoutes);
app.use('/api/images', imagesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/itango', itangoRoutes);
app.use('/api/editor-ai', editorAiRoutes);
app.use('/api/video-analytics', videoAnalyticsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/premium', premiumRoutes);
app.use('/api/social', socialAutomationRoutes);
app.use('/api/trending', trendingRoutes);

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', async (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/data')) return;

  const indexPath = path.join(__dirname, 'dist', 'index.html');
  let indexHtml;
  try {
    indexHtml = fs.readFileSync(indexPath, 'utf-8');
  } catch {
    return res.status(500).send('App not built');
  }

  await resolveAndServe(req.path, res, indexHtml);
});

app.listen(PORT, () => {
  console.log(`Mayobe Bros running on port ${PORT}`);
});
