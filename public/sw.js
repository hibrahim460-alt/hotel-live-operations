// Basic service worker setup layer to validate browser application design layouts
const CACHE_NAME = 'wh-hotel-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Let web pipelines pass dynamically to keep socket layers alive
  e.respondWith(fetch(e.request));
});
