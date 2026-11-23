/* Service worker opcional: permite abrir la app SIN SEÑAL.
 * Súbalo junto a index.html. Al cambiar index.html, suba VERSION. */
const VERSION = 'v1.1.0';
const CACHE = 'levantamiento-' + VERSION;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) =>
    Promise.all(['./', './index.html'].map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => null)))));
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('levantamiento-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('message', (e) => {
  const d = e.data || {};
  if (d.type === 'SKIP_WAITING') self.skipWaiting();
  if (d.type === 'CACHE_URLS') e.waitUntil(caches.open(CACHE).then((c) => c.addAll(d.urls)).catch(() => null));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true })
      || (req.mode === 'navigate' && (await caches.match('./index.html') || await caches.match('./')));
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  })());
});
