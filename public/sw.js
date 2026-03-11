const CACHE_NAME = 'mayobebros-v4';
const API_CACHE_NAME = 'mayobebros-api-v4';

const STATIC_ASSETS = [
  '/manifest.json',
];

const API_ROUTES_TO_CACHE = [
  '/api/posts',
  '/api/categories',
  '/api/labels',
  '/api/settings',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;

  if (url.pathname.startsWith('/admin')) return;

  if (url.pathname.startsWith('/api/')) {
    const isPublicRoute = API_ROUTES_TO_CACHE.some(route =>
      url.pathname === route || url.pathname.startsWith(route + '?')
    );

    if (isPublicRoute) {
      event.respondWith(
        caches.open(API_CACHE_NAME).then(async (cache) => {
          try {
            const networkResponse = await fetch(event.request);
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          } catch {
            const cached = await cache.match(event.request);
            if (cached) return cached;
            return new Response(JSON.stringify([]), {
              headers: { 'Content-Type': 'application/json' },
            });
          }
        })
      );
      return;
    }

    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match('/index.html');
        return cached || new Response('Offline', { status: 503 });
      })
    );
    return;
  }
});
