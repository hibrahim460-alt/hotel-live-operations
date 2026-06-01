const CACHE_NAME = 'wh-hotel-v1';
self.addEventListener('install', (e) => {
  self.skipWaiting();
});
self.addEventListener('fetch', (e) => {
  // Pass-through strategy to ensure real-time WebSockets operate dynamically
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
