// Our Closet — service worker for offline support.
// Bump CACHE_VERSION when you push a new version of the app.
var CACHE_VERSION = 'our-closet-v0.9';
var CACHED_FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      return cache.addAll(CACHED_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  // Remove old caches when a new version is deployed
  e.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (n) { return n !== CACHE_VERSION; })
             .map(function (n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      // Serve from cache first, then try network (and update cache)
      var fetchPromise = fetch(e.request).then(function (response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_VERSION).then(function (cache) { cache.put(e.request, clone); });
        }
        return response;
      }).catch(function () { return cached; });
      return cached || fetchPromise;
    })
  );
});
