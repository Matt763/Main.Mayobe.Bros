import { getSupabaseClient } from './supabase.js';

interface ApiKeys {
  claudeKey: string;
  openaiKey: string;
  geminiKey: string;
}

let _cache: ApiKeys | null = null;
let _cacheTs = 0;
const CACHE_TTL = 60_000; // 60 seconds

/** Read AI API keys from DB settings, with a 60-second in-memory cache. */
export async function getApiKeys(): Promise<ApiKeys> {
  const now = Date.now();
  if (_cache && now - _cacheTs < CACHE_TTL) return _cache;

  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'site_config')
      .maybeSingle();

    if (data?.value) {
      const cfg = JSON.parse(data.value);
      _cache = {
        claudeKey: cfg.aiKeys?.claudeKey || '',
        openaiKey: cfg.aiKeys?.openaiKey || '',
        geminiKey: cfg.aiKeys?.geminiKey || '',
      };
      _cacheTs = now;
      return _cache;
    }
  } catch {
    // Fall through to empty keys on DB error
  }

  return { claudeKey: '', openaiKey: '', geminiKey: '' };
}

/** Invalidate the in-memory cache (call after saving new keys to DB). */
export function invalidateApiKeyCache() {
  _cache = null;
  _cacheTs = 0;
}
