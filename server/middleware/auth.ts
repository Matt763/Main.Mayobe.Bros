import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    email?: string;
  }
}

const ADMIN_TOKEN_SECRET = process.env.SESSION_SECRET || 'mayobebros-secret-key-2026';
const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h

// ─── Stateless signed-cookie admin token ──────────────────────────────────────
// Solves Vercel MemoryStore issue: session data is stored IN the signed cookie,
// not in server memory, so it works across all serverless function instances.

export function createAdminToken(userId: string, email: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, email, exp: Date.now() + TOKEN_MAX_AGE_MS })).toString('base64url');
  const sig = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token: string): { userId: string; email: string } | null {
  try {
    const dot = token.lastIndexOf('.');
    if (dot === -1) return null;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(payload).digest('base64url');
    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!data.exp || Date.now() > data.exp) return null;
    return { userId: data.userId, email: data.email };
  } catch {
    return null;
  }
}

function parseCookies(req: Request): Record<string, string> {
  const raw = req.headers.cookie || '';
  const result: Record<string, string> = {};
  raw.split(';').forEach(part => {
    const eq = part.indexOf('=');
    if (eq === -1) return;
    const key = part.slice(0, eq).trim();
    const val = part.slice(eq + 1).trim();
    if (key) result[key] = decodeURIComponent(val);
  });
  return result;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Fast path: in-memory session (same function instance)
  if (req.session?.userId) return next();

  // Fallback: stateless signed cookie (survives cold starts & instance switches)
  const cookies = parseCookies(req);
  const token = cookies['admin_auth'];
  if (token) {
    const data = verifyAdminToken(token);
    if (data) {
      req.session.userId = data.userId;
      req.session.email = data.email;
      return next();
    }
  }

  return res.status(401).json({ error: 'Unauthorized' });
}

export function setAdminCookie(res: Response, userId: string, email: string): void {
  const token = createAdminToken(userId, email);
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieStr = [
    `admin_auth=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    `Max-Age=${TOKEN_MAX_AGE_MS / 1000}`,
    `SameSite=Lax`,
    isProduction ? 'Secure' : '',
  ].filter(Boolean).join('; ');
  res.setHeader('Set-Cookie', cookieStr);
}

export function clearAdminCookie(res: Response): void {
  res.setHeader('Set-Cookie', 'admin_auth=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax');
}
