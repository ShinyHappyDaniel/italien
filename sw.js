/* Puglia-guide service worker — v3
   Strategi: nätverk-först för app-filer (så uppdateringar alltid syns när du har nät),
   cache som reserv offline. Kart-rutor: stale-while-revalidate. */
const CACHE = 'puglia-guide-v3';
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
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k!==CACHE && k!=='tiles').map(k => caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Kart-rutor: visa cache direkt, uppdatera i bakgrunden
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

  // App-filer + allt annat: nätverk först, cache som reserv (offline)
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // spara en färsk kopia i cachen
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
