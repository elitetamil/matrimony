// public/sw.js
// ── Elite Tamil Matrimony — Service Worker ─────────────────────────────────
// Activated only when user accepts cookie consent in production.
// Caches the app shell, static assets, and key pages for offline/fast loading.

const CACHE_NAME = "etm-v3";

// Assets to pre-cache on install
const PRECACHE_URLS = [
  "/",
  "/logo-transparent.png",
  "/manifest.json",
];

// Runtime cache: cache-first for static assets, network-first for pages
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Don't intercept non-GET requests, API calls, localhost development, or unsupported schemes
  if (
    event.request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    !url.protocol.startsWith("http") ||
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1"
  ) {
    return;
  }

  // For static assets — cache-first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|svg|woff2?|ico)$/) ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((res) => {
            if (res && res.ok) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return res;
          })
      )
    );
    return;
  }

  // For HTML pages and RSC payloads — network-first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
