/* Only the offline document and app icons are stored. Shopping data is never cached. */
const CACHE = 'zoppini-offline-v1';
const ASSETS = [
  '/offline.html',
  '/pwa/icon-192.png',
  '/pwa/icon-512.png',
  '/pwa/icon-maskable-512.png',
  '/pwa/apple-touch-icon.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key.startsWith('zoppini-offline-') && key !== CACHE)
            .map(key => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Never intercept transactional, account, authentication, API or Next data requests.
  if (
    /^\/(?:api|privacy|checkout|cart|basket|dashboard|admin|login|login-with-pass|forgot-pass|register|signup|sign-up|auth|payment|_next)(?:\/|$)/i.test(
      url.pathname,
    )
  )
    return;
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html')),
    );
  } else if (ASSETS.includes(url.pathname) && !url.search) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request)),
    );
  }
});
