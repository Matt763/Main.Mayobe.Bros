import { supabase } from './supabase';

const SESSION_KEY = 'mb_session_id';
const VISITOR_KEY = 'mb_visitor_id';
const HEARTBEAT_INTERVAL = 25_000;
const GEO_CACHE_KEY = 'mb_geo_cache';
const GEO_CACHE_TTL = 24 * 60 * 60 * 1000;

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let currentPath = '';
let geoPromise: Promise<GeoInfo | null> | null = null;

interface GeoInfo {
  country_code: string;
  country_name: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

function getOrCreate(key: string, factory: () => string): string {
  let val = localStorage.getItem(key);
  if (!val) {
    val = factory();
    localStorage.setItem(key, val);
  }
  return val;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getSessionId(): string {
  let val = sessionStorage.getItem(SESSION_KEY);
  if (!val) {
    val = generateId();
    sessionStorage.setItem(SESSION_KEY, val);
  }
  return val;
}

function getVisitorId(): string {
  return getOrCreate(VISITOR_KEY, generateId);
}

function parseDevice(): string {
  const ua = navigator.userAgent;
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) {
    if (/iPad|Tablet/i.test(ua)) return 'tablet';
    return 'mobile';
  }
  return 'desktop';
}

function parseBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Unknown';
}

function parseOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS')) return 'macOS';
  if (ua.includes('Android')) return 'Android';
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (ua.includes('Linux')) return 'Linux';
  return 'Unknown';
}

async function fetchGeo(): Promise<GeoInfo | null> {
  try {
    const cached = localStorage.getItem(GEO_CACHE_KEY);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < GEO_CACHE_TTL) return data;
    }
  } catch { }

  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error('geo failed');
    const json = await res.json();
    const info: GeoInfo = {
      country_code: json.country_code || '',
      country_name: json.country_name || '',
      city: json.city || '',
      latitude: json.latitude,
      longitude: json.longitude,
    };
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ data: info, ts: Date.now() }));
    return info;
  } catch {
    try {
      const res = await fetch('https://api.country.is/', { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error('geo2 failed');
      const json = await res.json();
      const info: GeoInfo = {
        country_code: json.country || '',
        country_name: json.country || '',
        city: '',
      };
      localStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ data: info, ts: Date.now() }));
      return info;
    } catch {
      return null;
    }
  }
}

function getGeo(): Promise<GeoInfo | null> {
  if (!geoPromise) geoPromise = fetchGeo();
  return geoPromise;
}

async function isUniqueToday(visitorId: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from('page_views')
    .select('id')
    .eq('visitor_id', visitorId)
    .gte('created_at', today.toISOString())
    .limit(1);

  return !data || data.length === 0;
}

export function trackPageView(path: string, title?: string): void {
  currentPath = path;
  (async () => {
    try {
      const visitorId = getVisitorId();
      const sessionId = getSessionId();

      const [geo, unique] = await Promise.all([
        getGeo(),
        isUniqueToday(visitorId),
      ]);

      await supabase.from('page_views').insert({
        session_id: sessionId,
        visitor_id: visitorId,
        page_path: path,
        page_title: title || document.title,
        referrer: document.referrer || null,
        country_code: geo?.country_code || null,
        country_name: geo?.country_name || null,
        city: geo?.city || null,
        latitude: geo?.latitude || null,
        longitude: geo?.longitude || null,
        device_type: parseDevice(),
        browser: parseBrowser(),
        os: parseOS(),
        screen_width: window.screen.width,
        is_unique: unique,
      });

      upsertOnlinePresence(visitorId, sessionId, path, geo);
      startHeartbeat(visitorId, sessionId, geo);
    } catch {
      // silently ignore tracking errors
    }
  })();
}

async function upsertOnlinePresence(
  visitorId: string,
  sessionId: string,
  path: string,
  geo: GeoInfo | null
): Promise<void> {
  try {
    await supabase.from('online_visitors').upsert(
      {
        visitor_id: visitorId,
        session_id: sessionId,
        page_path: path,
        country_name: geo?.country_name || null,
        city: geo?.city || null,
        device_type: parseDevice(),
        last_seen: new Date().toISOString(),
      },
      { onConflict: 'visitor_id,session_id' }
    );
  } catch { }
}

function startHeartbeat(visitorId: string, sessionId: string, geo: GeoInfo | null): void {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(async () => {
    await upsertOnlinePresence(visitorId, sessionId, currentPath, geo);
  }, HEARTBEAT_INTERVAL);
}

export function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

export function updateCurrentPath(path: string): void {
  currentPath = path;
}
