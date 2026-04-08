import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import authRoutes from './routes/auth.js';
import postsRoutes from './routes/posts.js';
import pagesRoutes from './routes/pages.js';
import categoriesRoutes from './routes/categories.js';
import labelsRoutes from './routes/labels.js';
import imagesRoutes from './routes/images.js';
import settingsRoutes from './routes/settings.js';
import commentsRoutes from './routes/comments.js';
import reviewsRoutes from './routes/reviews.js';
import contactRoutes from './routes/contact.js';
import githubRoutes from './routes/github.js';
import newsletterRoutes from './routes/newsletter.js';
import sitemapRoutes from './routes/sitemap.js';
import feedRoutes from './routes/feed.js';
import indexingRoutes from './routes/indexing.js';
import trendingRoutes from './routes/trending.js';
import secretCodeRoutes from './routes/secretCodes.js';
import premiumRoutes from './routes/premium.js';
import socialAutomationRoutes from './routes/socialAutomation.js';
import itangoRoutes from './routes/itango.js';
import usersRoutes from './routes/users.js';
import editorAiRoutes from './routes/editor-ai.js';
import videoAnalyticsRoutes from './routes/videoAnalytics.js';
import { securityMonitor, getSecurityLog, unblockIP, getBlockedIPs } from './middleware/securityMonitor.js';
import { serveWithMeta } from './utils/metaInjector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const loginAttempts = new Map<string, { count: number; ts: number }>();

const allowedOrigins = [
  'https://www.mayobebros.com',
  'https://mayobebros.com',
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.VITE_SITE_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

app.use(securityMonitor);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'mayobebros-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  }
}));

app.use('/api/auth/login', (req, res, next) => {
  if (req.method !== 'POST') return next();
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record && now - record.ts < 15 * 60 * 1000) {
    if (record.count >= 10) {
      return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
    }
  } else {
    loginAttempts.set(ip, { count: 0, ts: now });
  }

  const original = res.json.bind(res);
  res.json = (body: any) => {
    const entry = loginAttempts.get(ip) || { count: 0, ts: now };
    if (res.statusCode === 401 || (body && body.error)) {
      loginAttempts.set(ip, { count: entry.count + 1, ts: entry.ts });
    } else {
      loginAttempts.delete(ip);
    }
    return original(body);
  };

  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/labels', labelsRoutes);
app.use('/api/images', imagesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use(sitemapRoutes);
app.use('/feed.xml', feedRoutes);
app.use('/api/indexing', indexingRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/secret-codes', secretCodeRoutes);
app.use('/api/premium', premiumRoutes);
app.use('/api/social', socialAutomationRoutes);
app.use('/api/itango', itangoRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/editor-ai', editorAiRoutes);
app.use('/api/video-analytics', videoAnalyticsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mayobe Bros API Server Running' });
});

// Security dashboard endpoints (CEO only — auth checked via session in itango route)
app.get('/api/itango/security/log', (req, res) => {
  res.json({ events: getSecurityLog(200) });
});
app.get('/api/itango/security/blocked', (req, res) => {
  res.json({ blocked: getBlockedIPs() });
});
app.post('/api/itango/security/unblock', (req, res) => {
  const { ip } = req.body;
  if (ip) unblockIP(ip);
  res.json({ success: true });
});

const distPath = join(__dirname, '../../dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    serveWithMeta(req, res, distPath);
  });
}

app.listen(PORT, () => {
  console.log(`Mayobe Bros API Server running on http://localhost:${PORT}`);
});
