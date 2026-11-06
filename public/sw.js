// Guarda todos os arquivos do app no aparelho para funcionar sem internet.
const CACHE = 'hanzi-192748129df5';
const FILES = ["./","css/app.css","data/strokes.json","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","js/lessons-data.js","js/main.js","js/session.js","js/srs.js","js/store.js","js/ui.js","js/views/common.js","js/views/dictation.js","js/views/draw.js","js/views/flash.js","js/views/home.js","js/vocab.js","manifest.webmanifest","vendor/ARPHICPL.txt","vendor/hanzi-writer-LICENSE.txt","vendor/hanzi-writer.min.js"];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(FILES.map((url) => new Request(url, { cache: 'reload' })));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name.startsWith('hanzi-') && name !== CACHE).map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const key = request.mode === 'navigate' ? './' : request;
      const hit = await cache.match(key, { ignoreSearch: true });
      return hit ?? fetch(request);
    })(),
  );
});
