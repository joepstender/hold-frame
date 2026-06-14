/* Hold Frame service worker — offline app shell + durable install.
   Bump CACHE when you change shell files to push an update to installed clients. */
const CACHE = "hold-frame-v1";
const RUNTIME = "hold-frame-runtime-v1";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-180.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const keep = [CACHE, RUNTIME];
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => keep.indexOf(k) === -1).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Navigations: network-first so updates show, fall back to cached shell offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Same-origin shell: cache-first.
  if (url.origin === location.origin) {
    event.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
    return;
  }

  // Cross-origin (e.g. Google Fonts): cache-first runtime; if offline & uncached, let it fail
  // and the system-font fallback in the CSS takes over.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(RUNTIME).then((c) => c.put(req, copy));
        return res;
      });
    })
  );
});
