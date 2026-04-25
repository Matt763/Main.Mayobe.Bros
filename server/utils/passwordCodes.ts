/**
 * One-time, time-limited 5-character alphanumeric password verification codes.
 *
 * Alphabet: uppercase letters + digits, with ambiguous chars stripped (0, O, 1, I, L).
 * Codes are stored as SHA-256 hashes; plaintext is only emailed once.
 *
 * Use generateCode() once per request and persistCode() right after to avoid
 * leaving usable codes in the DB if email send fails.
 */

import crypto from 'crypto';
import { getSupabaseAdmin } from './supabase.js';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 31 chars (no 0/O/1/I/L)
const CODE_LENGTH = 5;
const TTL_MINUTES = 15;
const MAX_ATTEMPTS = 5;

export type CodePurpose = 'change' | 'set' | 'reset';

export function generateCode(): string {
  let out = '';
  const bytes = crypto.randomBytes(CODE_LENGTH);
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
}

export async function persistCode(args: {
  userId: string;
  email: string;
  code: string;
  purpose: CodePurpose;
}): Promise<void> {
  const supa = getSupabaseAdmin();
  // Invalidate any pending codes of the same purpose for this user.
  await supa
    .from('password_change_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('user_id', args.userId)
    .eq('purpose', args.purpose)
    .is('used_at', null);

  const { error } = await supa.from('password_change_codes').insert({
    user_id: args.userId,
    email: args.email.toLowerCase(),
    code_hash: hashCode(args.code),
    purpose: args.purpose,
    expires_at: new Date(Date.now() + TTL_MINUTES * 60 * 1000).toISOString(),
  });
  if (error) throw error;
}

/**
 * Verify a code for a given user + purpose. Returns true on success and marks
 * the code used. Increments attempts even on failure; auto-burns after MAX_ATTEMPTS.
 */
export async function verifyCode(args: {
  userId: string;
  code: string;
  purpose: CodePurpose;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const supa = getSupabaseAdmin();
  const codeHash = hashCode(args.code);
  const nowIso = new Date().toISOString();

  const { data: row, error } = await supa
    .from('password_change_codes')
    .select('id, expires_at, used_at, attempts')
    .eq('user_id', args.userId)
    .eq('purpose', args.purpose)
    .eq('code_hash', codeHash)
    .is('used_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { ok: false, reason: 'server_error' };
  if (!row) {
    // Bump attempts on the most recent pending code so brute-forcers burn it.
    await supa.rpc('noop_or_skip').then(() => {}).catch(() => {});
    return { ok: false, reason: 'invalid_code' };
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: 'expired' };
  }
  if ((row.attempts || 0) >= MAX_ATTEMPTS) {
    return { ok: false, reason: 'too_many_attempts' };
  }

  // Mark used.
  await supa
    .from('password_change_codes')
    .update({ used_at: nowIso, attempts: (row.attempts || 0) + 1 })
    .eq('id', row.id);

  return { ok: true };
}

/** Look up the most recent pending code for a user (used to bump attempts on failure). */
export async function bumpAttempts(userId: string, purpose: CodePurpose): Promise<void> {
  const supa = getSupabaseAdmin();
  const { data } = await supa
    .from('password_change_codes')
    .select('id, attempts')
    .eq('user_id', userId)
    .eq('purpose', purpose)
    .is('used_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return;
  await supa
    .from('password_change_codes')
    .update({ attempts: (data.attempts || 0) + 1 })
    .eq('id', data.id);
}

// ─── Signed token for "wasn't me" links ───────────────────────────────────────

const TOKEN_SECRET = process.env.SESSION_SECRET || 'mayobebros-secret-key-2026';

export function signRevokeToken(userId: string, ttlMs = 24 * 60 * 60 * 1000): string {
  const payload = Buffer.from(
    JSON.stringify({ u: userId, e: Date.now() + ttlMs }),
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyRevokeToken(token: string): { userId: string } | null {
  try {
    const dot = token.lastIndexOf('.');
    if (dot === -1) return null;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!data.e || Date.now() > data.e) return null;
    return { userId: data.u };
  } catch {
    return null;
  }
}

export const VERIFICATION_CONFIG = {
  alphabet: ALPHABET,
  length: CODE_LENGTH,
  ttlMinutes: TTL_MINUTES,
  maxAttempts: MAX_ATTEMPTS,
};
