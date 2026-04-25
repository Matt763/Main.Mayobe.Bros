import { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin } from '../utils/supabase.js';

export interface ReaderUser {
  id: string;
  email: string | null;
  name: string | null;
}

declare module 'express-serve-static-core' {
  interface Request {
    readerUser?: ReaderUser;
  }
}

/**
 * Reader-side auth middleware. Reads `Authorization: Bearer <supabase_token>`
 * from the request, validates it using Supabase admin (service role), and
 * attaches `req.readerUser`. Returns 401 if missing/invalid.
 */
export async function requireReaderAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const supa = getSupabaseAdmin();
    const { data, error } = await supa.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const u = data.user;
    req.readerUser = {
      id: u.id,
      email: u.email ?? null,
      name:
        (u.user_metadata?.full_name as string | undefined) ||
        (u.user_metadata?.name as string | undefined) ||
        (u.email ? u.email.split('@')[0] : null),
    };
    next();
  } catch (err) {
    console.error('[readerAuth] error:', err);
    res.status(500).json({ error: 'Auth verification failed' });
  }
}
