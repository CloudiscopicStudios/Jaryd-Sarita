const CACHE = 'wedding-cam-v3';
const BASE = '/Jaryd-Sarita';
const SHELL = `${BASE}/index.html`;

self.addEventListener('install', (e) => {
  // Pre-cache the app shell so we can serve it offline for any route
  e.waitUntil(
    caches.open(CACHE).then(c => c.add(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // For full-page navigations, always serve index.html so React Router
  // can handle the URL — this is what makes /camera work when installed as PWA
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          // GitHub Pages returns 404 status for SPA routes — serve shell instead
          if (!res.ok) return caches.match(SHELL).then(r => r || fetch(SHELL));
          return res;
        })
        .catch(() => caches.match(SHELL).then(r => r || fetch(SHELL)))
    );
    return;
  }

  // Assets: network first, cache fallback
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
