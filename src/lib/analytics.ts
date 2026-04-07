import { supabase } from './supabase';

const SESSION_KEY    = 'mb_session_id';
const VISITOR_KEY    = 'mb_visitor_id';
const GEO_CACHE_KEY  = 'mb_geo_cache';
const GEO_CACHE_TTL  = 24 * 60 * 60 * 1000; // 24 hours
const HEARTBEAT_INTERVAL = 25_000;

// Supabase auth stores the session here — if present, the visitor is an admin
const SUPABASE_AUTH_KEYS = ['sb-auth-token', 'supabase.auth.token'];

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let currentPath = '';
let geoPromise: Promise<GeoInfo | null> | null = null;

// ─── Bot / crawler detection ───────────────────────────────────────────────────
// Extended pattern — covers crawlers, headless browsers, monitoring tools,
// SEO scrapers, and common automation frameworks.
const BOT_PATTERN = /bot|crawl|slurp|spider|mediapartners|google.*feedfetcher|feedburner|pingdom|lighthouse|headlesschrome|headless|prerender|phantomjs|puppet|selenium|cypress|wget|curl|httpunit|nutch|go-http-client|python-requests|python-urllib|libwww|lwp|jakarta|ahrefsbot|semrushbot|dotbot|mj12bot|blexbot|petalbot|rogerbot|uptimerobot|screaming.?frog|googlebot|bingbot|duckduckbot|baiduspider|yandexbot|sogou|exabot|facebot|ia_archiver|archive\.org|wayback|facebookexternalhit|twitterbot|linkedinbot|telegrambot|discordbot|slackbot|applebot|msnbot|adidxbot|bingpreview|zgrab|masscan|nmap|nikto|sqlmap|openvas|dirbuster|gobuster|nuclei|dataforseo|sistrix|majestic|moz\.com|opensiteexplorer|robtex|netcraft|whotracks\.me|statcounter|cloudflare-worker|vercel-edge/i;

function isBot(): boolean {
  if (typeof navigator === 'undefined') return true;
  const ua = navigator.userAgent;
  if (!ua || ua.length < 10) return true;
  return BOT_PATTERN.test(ua);
}

// ─── Admin detection ───────────────────────────────────────────────────────────
// If any Supabase auth key is in localStorage the visitor is a logged-in admin.
// We skip tracking them so admin browsing doesn't inflate the stats.
function isAdminSession(): boolean {
  try {
    for (const key of Object.keys(localStorage)) {
      if (SUPABASE_AUTH_KEYS.some(k => key.includes(k))) return true;
      // Supabase v2 stores session under "sb-<project-ref>-auth-token"
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) return true;
    }
  } catch { /* localStorage blocked */ }
  return false;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface GeoInfo {
  country_code: string;
  country_name: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

// ─── ID helpers ───────────────────────────────────────────────────────────────
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getVisitorId(): string {
  try {
    let val = localStorage.getItem(VISITOR_KEY);
    if (!val) { val = generateId(); localStorage.setItem(VISITOR_KEY, val); }
    return val;
  } catch { return generateId(); }
}

function getSessionId(): string {
  try {
    let val = sessionStorage.getItem(SESSION_KEY);
    if (!val) { val = generateId(); sessionStorage.setItem(SESSION_KEY, val); }
    return val;
  } catch { return generateId(); }
}

// ─── Device / browser / OS detection ─────────────────────────────────────────
function parseDevice(): 'desktop' | 'mobile' | 'tablet' {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return 'mobile';
  return 'desktop';
}

function parseBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg'))     return 'Edge';
  if (ua.includes('OPR') || ua.includes('Opera')) return 'Opera';
  if (ua.includes('SamsungBrowser')) return 'Samsung';
  if (ua.includes('Chrome'))  return 'Chrome';
  if (ua.includes('Safari'))  return 'Safari';
  return 'Unknown';
}

function parseOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS'))  return 'macOS';
  if (ua.includes('Android')) return 'Android';
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (ua.includes('Linux'))   return 'Linux';
  return 'Unknown';
}

// ─── Geolocation ──────────────────────────────────────────────────────────────
async function fetchGeo(): Promise<GeoInfo | null> {
  // Try cache first
  try {
    const cached = localStorage.getItem(GEO_CACHE_KEY);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < GEO_CACHE_TTL) return data as GeoInfo;
    }
  } catch { /* ignore */ }

  // Primary: ipapi.co
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const json = await res.json();
      if (json.error) throw new Error(json.reason || 'rate limited');
      const info: GeoInfo = {
        country_code: json.country_code || '',
        country_name: json.country_name || '',
        city: json.city || '',
        latitude: json.latitude,
        longitude: json.longitude,
      };
      try { localStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ data: info, ts: Date.now() })); } catch { /* ignore */ }
      return info;
    }
  } catch { /* fallthrough */ }

  // Fallback: ip-api.com (no HTTPS on free tier — use http)
  try {
    const res = await fetch('http://ip-api.com/json/?fields=country,countryCode,city,lat,lon', { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const json = await res.json();
      const info: GeoInfo = {
        country_code: json.countryCode || '',
        country_name: json.country || '',
        city: json.city || '',
        latitude: json.lat,
        longitude: json.lon,
      };
      try { localStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ data: info, ts: Date.now() })); } catch { /* ignore */ }
      return info;
    }
  } catch { /* ignore */ }

  // Last resort: country only
  try {
    const res = await fetch('https://api.country.is/', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const json = await res.json();
      const info: GeoInfo = { country_code: json.country || '', country_name: json.country || '', city: '' };
      try { localStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ data: info, ts: Date.now() })); } catch { /* ignore */ }
      return info;
    }
  } catch { /* ignore */ }

  return null;
}

function getGeo(): Promise<GeoInfo | null> {
  if (!geoPromise) geoPromise = fetchGeo();
  return geoPromise;
}

// ─── Unique visitor check ─────────────────────────────────────────────────────
async function isUniqueToday(visitorId: string): Promise<boolean> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from('page_views')
      .select('id')
      .eq('visitor_id', visitorId)
      .gte('created_at', today.toISOString())
      .limit(1);
    return !data || data.length === 0;
  } catch { return false; }
}

// ─── Online presence heartbeat ────────────────────────────────────────────────
async function upsertOnlinePresence(
  visitorId: string,
  sessionId: string,
  path: string,
  geo: GeoInfo | null
): Promise<void> {
  try {
    await supabase.from('online_visitors').upsert(
      {
        visitor_id:   visitorId,
        session_id:   sessionId,
        page_path:    path,
        country_name: geo?.country_name || null,
        city:         geo?.city || null,
        device_type:  parseDevice(),
        last_seen:    new Date().toISOString(),
      },
      { onConflict: 'visitor_id,session_id' }
    );
  } catch { /* silently ignore */ }
}

function startHeartbeat(visitorId: string, sessionId: string, geo: GeoInfo | null): void {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    upsertOnlinePresence(visitorId, sessionId, currentPath, geo);
  }, HEARTBEAT_INTERVAL);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function trackPageView(path: string, title?: string): void {
  // Skip bots entirely
  if (isBot()) return;
  // Skip admin/staff sessions — their browsing should not skew stats
  if (isAdminSession()) return;

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
        session_id:   sessionId,
        visitor_id:   visitorId,
        page_path:    path,
        page_title:   title || document.title,
        referrer:     document.referrer || null,
        country_code: geo?.country_code || null,
        country_name: geo?.country_name || null,
        city:         geo?.city || null,
        latitude:     geo?.latitude ?? null,
        longitude:    geo?.longitude ?? null,
        device_type:  parseDevice(),
        browser:      parseBrowser(),
        os:           parseOS(),
        screen_width: window.screen.width,
        is_unique:    unique,
      });

      upsertOnlinePresence(visitorId, sessionId, path, geo);
      startHeartbeat(visitorId, sessionId, geo);
    } catch { /* silently ignore tracking errors */ }
  })();
}

export function stopHeartbeat(): void {
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
}

export function updateCurrentPath(path: string): void {
  currentPath = path;
}
