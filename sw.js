// sw.js - Service Worker untuk AFQAmeer POS (offline cache)
const CACHE = 'afqameer-pos-v7';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/store.js',
  './js/catalog.js',
  './js/cart.js',
  './js/app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

// Stale-while-revalidate: pakai cache dulu, fetch baru background
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(network => {
        if (network && network.status === 200) {
          const clone = network.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return network;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
