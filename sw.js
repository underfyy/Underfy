/* Underfy — service worker.
   Sempre busca a versão nova na rede; o cache só entra quando não há internet.
   Assim, toda atualização que você subir no GitHub aparece na hora. */
const CACHE = "underfy-v2";
const SHELL = ["./", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;   // YouTube, Firebase e fontes passam direto
  // áudio e clipes vão direto ao servidor: são grandes e o navegador pede em pedaços (Range)
  if (r.headers.has("range") || /\.(mp3|m4a|aac|wav|ogg|flac|mp4|m4v|webm)$/i.test(u.pathname)) return;
  e.respondWith(
    fetch(r)
      .then(res => {
        if (res && res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(r, copia)); }
        return res;
      })
      .catch(() => caches.match(r).then(m => m || caches.match("./")))
  );
});
