const submissionTimestamps = new Map<string, number[]>();
const recentContent = new Map<string, { hash: string; ts: number }[]>();
const usedTokens = new Map<string, number>();

const SPAM_KEYWORDS = [
  'casino', 'poker', 'bet365', 'betway', 'gambling', 'slots', 'jackpot',
  'viagra', 'cialis', 'pharmacy', 'cheap meds', 'buy meds',
  'porn', 'xxx', 'nude', 'sex video', 'adult video',
  'make money fast', 'work from home', 'earn $', 'free money', 'click here to win',
  'bitcoin investment', 'crypto investment', 'double your money',
  'seo service', 'buy followers', 'buy likes', 'buy traffic',
  'payday loan', 'instant loan',
];

function hashContent(text: string): string {
  let hash = 0;
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return String(hash);
}

function cleanOldEntries() {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  const oneHour = 60 * 60 * 1000;

  for (const [key, timestamps] of submissionTimestamps.entries()) {
    const fresh = timestamps.filter(ts => now - ts < fiveMinutes);
    if (fresh.length === 0) submissionTimestamps.delete(key);
    else submissionTimestamps.set(key, fresh);
  }

  for (const [key, entries] of recentContent.entries()) {
    const fresh = entries.filter(e => now - e.ts < fiveMinutes);
    if (fresh.length === 0) recentContent.delete(key);
    else recentContent.set(key, fresh);
  }

  for (const [token, ts] of usedTokens.entries()) {
    if (now - ts > oneHour) usedTokens.delete(token);
  }
}

export function checkRateLimit(ip: string, type: 'comment' | 'review'): { allowed: boolean; message?: string } {
  cleanOldEntries();
  const now = Date.now();
  const windowMs = type === 'comment' ? 30_000 : 60_000;
  const key = `${type}:${ip}`;

  const timestamps = submissionTimestamps.get(key) || [];
  const recent = timestamps.filter(ts => now - ts < windowMs);

  if (recent.length >= 1) {
    const waitMs = windowMs - (now - recent[recent.length - 1]);
    const waitSec = Math.ceil(waitMs / 1000);
    return {
      allowed: false,
      message: `Please wait ${waitSec} seconds before submitting again.`,
    };
  }

  recent.push(now);
  submissionTimestamps.set(key, recent);
  return { allowed: true };
}

export function checkDuplicate(ip: string, type: string, content: string): { isDuplicate: boolean } {
  cleanOldEntries();
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const key = `dup:${type}:${ip}`;
  const hash = hashContent(content);

  const entries = recentContent.get(key) || [];
  const recent = entries.filter(e => now - e.ts < windowMs);

  if (recent.some(e => e.hash === hash)) {
    return { isDuplicate: true };
  }

  recent.push({ hash, ts: now });
  recentContent.set(key, recent);
  return { isDuplicate: false };
}

export function checkSpamKeywords(text: string): { isSpam: boolean; keyword?: string } {
  const lower = text.toLowerCase();
  for (const keyword of SPAM_KEYWORDS) {
    if (lower.includes(keyword)) {
      return { isSpam: true, keyword };
    }
  }
  return { isSpam: false };
}

export function checkIdempotency(token: string): { isDuplicate: boolean } {
  if (!token) return { isDuplicate: false };
  if (usedTokens.has(token)) {
    return { isDuplicate: true };
  }
  usedTokens.set(token, Date.now());
  return { isDuplicate: false };
}

export function getClientIp(req: any): string {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
}

export function checkHoneypot(body: any): { isBot: boolean } {
  if (body.website || body.phone_number || body.fax || body.company_name_field) {
    return { isBot: true };
  }
  return { isBot: false };
}

export function sanitizeText(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}
