/**
 * Shared in-memory sitemap cache.
 * Imported by both sitemap.ts (reads/writes) and posts.ts (invalidates).
 * No circular dependencies since neither imports the other.
 */

export interface SitemapCacheEntry {
  xml: string;
  generatedAt: number;
  urlCount: number;
  ttlMs: number;
}

export const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
export const URLS_PER_SITEMAP = 200;

const cache = new Map<string, SitemapCacheEntry>();

// Track last ping time to avoid spamming search engines
let lastPingAt = 0;
const MIN_PING_INTERVAL_MS = 60 * 60 * 1000; // max 1 ping per hour

// ── Read ─────────────────────────────────────────────────────────────────────

export function fromCache(key: string): string | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.generatedAt > entry.ttlMs) {
    cache.delete(key);
    return null;
  }
  return entry.xml;
}

// ── Write ─────────────────────────────────────────────────────────────────────

export function toCache(key: string, xml: string, urlCount = 0, ttlMs = CACHE_TTL_MS): void {
  cache.set(key, { xml, generatedAt: Date.now(), urlCount, ttlMs });
}

// ── Invalidate ────────────────────────────────────────────────────────────────

/**
 * Invalidate cache entries by type prefix.
 * - Pass 'all' or omit to clear everything.
 * - Pass 'posts' to clear posts-* and the index.
 * - Pass 'category' to clear category-* and the index.
 */
export function invalidateSitemapCache(types?: ('posts' | 'category' | 'image' | 'video' | 'authoritative' | 'news' | 'index' | 'all')[]): void {
  if (!types || types.includes('all')) {
    cache.clear();
    console.log('[SitemapCache] Full cache cleared');
    return;
  }

  const shouldClearIndex = types.some(t => t !== 'index');

  for (const [key] of cache) {
    const shouldDelete = types.some(t => key.startsWith(t)) ||
      (shouldClearIndex && key === 'index');
    if (shouldDelete) {
      cache.delete(key);
    }
  }

  console.log(`[SitemapCache] Cleared: ${types.join(', ')}`);
}

// ── Cache info (for /sitemap-status) ─────────────────────────────────────────

export function getCacheEntries(): { key: string; ageSeconds: number; urlCount: number; sizeBytes: number; expiresInSeconds: number }[] {
  const now = Date.now();
  return Array.from(cache.entries()).map(([key, val]) => ({
    key,
    ageSeconds:       Math.round((now - val.generatedAt) / 1000),
    urlCount:         val.urlCount,
    sizeBytes:        val.xml.length,
    expiresInSeconds: Math.max(0, Math.round((val.ttlMs - (now - val.generatedAt)) / 1000)),
  }));
}

// ── Ping throttle ─────────────────────────────────────────────────────────────

export function canPing(): boolean {
  return Date.now() - lastPingAt > MIN_PING_INTERVAL_MS;
}

export function recordPing(): void {
  lastPingAt = Date.now();
}
