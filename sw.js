/* Puglia-guide service worker — offline caching */
const CACHE = 'puglia-guide-v1';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './data.js',
  './manifest.json',
  './icon-180.png',
  './icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k!==CACHE).map(k => caches.delete(k)))
  ).then(()=>self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // cache-first for app assets; stale-while-revalidate for map tiles
  if(url.includes('tile.openstreetmap.org')){
    e.respondWith(
      caches.open('tiles').then(cache =>
        cache.match(e.request).then(hit => {
          const net = fetch(e.request).then(res => { cache.put(e.request, res.clone()); return res; }).catch(()=>hit);
          return hit || net;
        })
      )
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request))
  );
});
