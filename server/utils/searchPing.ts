import { getSupabaseClient } from './supabase.js';

const SITE_URL = 'https://mayobebros.com';
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

interface PingResult {
  engine: string;
  url: string;
  status: 'success' | 'error';
  statusCode?: number;
  message?: string;
}

async function pingUrl(engine: string, url: string): Promise<PingResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'User-Agent': 'MayobeBros-SEO-Bot/1.0' },
    });

    clearTimeout(timeout);

    return {
      engine,
      url,
      status: response.ok ? 'success' : 'error',
      statusCode: response.status,
      message: response.ok ? 'Ping accepted' : `HTTP ${response.status}`,
    };
  } catch (err: any) {
    return {
      engine,
      url,
      status: 'error',
      message: err?.name === 'AbortError' ? 'Timeout' : (err?.message || 'Unknown error'),
    };
  }
}

export async function pingSearchEngines(postUrl: string, postSlug: string): Promise<PingResult[]> {
  const encodedSitemap = encodeURIComponent(SITEMAP_URL);
  const encodedPostUrl = encodeURIComponent(postUrl);

  const pingTargets = [
    {
      engine: 'Bing',
      url: `https://www.bing.com/ping?sitemap=${encodedSitemap}`,
    },
    {
      engine: 'Google (sitemap)',
      url: `https://www.google.com/ping?sitemap=${encodedSitemap}`,
    },
    {
      engine: 'IndexNow (Bing)',
      url: `https://www.bing.com/indexnow?url=${encodedPostUrl}&key=mayobebros`,
    },
  ];

  const results = await Promise.allSettled(
    pingTargets.map(({ engine, url }) => pingUrl(engine, url))
  );

  const pingData = results.map((r, i) => {
    const target = pingTargets[i];
    if (r.status === 'fulfilled') return r.value;
    return {
      engine: target.engine,
      url: target.url,
      status: 'error' as const,
      message: 'Promise rejected',
    };
  });

  try {
    const supabase = getSupabaseClient();
    await supabase.from('indexing_events').insert({
      post_url: postUrl,
      post_slug: postSlug,
      event_type: 'publish_ping',
      ping_results: pingData,
      pinged_at: new Date().toISOString(),
    });
  } catch (dbErr) {
    console.error('[PING] Failed to save ping results:', dbErr);
  }

  for (const result of pingData) {
    const icon = result.status === 'success' ? '✓' : '✗';
    console.log(`[PING] ${icon} ${result.engine}: ${result.status} (${result.message || result.statusCode})`);
  }

  return pingData;
}

export async function requestGoogleIndexing(postUrl: string, postSlug: string): Promise<void> {
  const googleIndexingApiKey = process.env.GOOGLE_INDEXING_API_KEY;

  if (!googleIndexingApiKey) {
    console.log('[INDEXING] Google Indexing API key not configured, skipping');
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `https://indexing.googleapis.com/v3/urlNotifications:publish`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${googleIndexingApiKey}`,
        },
        body: JSON.stringify({
          url: postUrl,
          type: 'URL_UPDATED',
        }),
      }
    );

    clearTimeout(timeout);

    const supabase = getSupabaseClient();
    await supabase.from('indexing_events').insert({
      post_url: postUrl,
      post_slug: postSlug,
      event_type: 'google_indexing_api',
      ping_results: [{ engine: 'Google Indexing API', status: response.ok ? 'success' : 'error', statusCode: response.status }],
      pinged_at: new Date().toISOString(),
    });

    console.log(`[INDEXING] Google Indexing API: HTTP ${response.status} for ${postUrl}`);
  } catch (err: any) {
    console.error('[INDEXING] Google Indexing API error:', err?.message);
  }
}

export async function notifySearchEngines(params: {
  postUrl: string;
  postSlug: string;
}): Promise<void> {
  const { postUrl, postSlug } = params;

  pingSearchEngines(postUrl, postSlug).catch(e =>
    console.error('[PING] Search engine ping error:', e)
  );

  requestGoogleIndexing(postUrl, postSlug).catch(e =>
    console.error('[INDEXING] Google indexing error:', e)
  );
}
