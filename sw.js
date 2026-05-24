const CACHE_NAME = 'fazenda-js-v11';

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './assets/img/icon-192.png',
  './assets/img/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
