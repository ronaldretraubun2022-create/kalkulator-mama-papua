const CACHE_VERSION = "v6-2026-05-14";
const CACHE_NAME = `kalkulator-mama-papua-${CACHE_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css?v=6",
  "./js/utils.js?v=6",
  "./js/storage.js?v=6",
  "./js/app.js?v=6",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", function (event) {
  console.log("Service Worker Updated");
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return null;
        })
      );
    }).then(function () {
      return self.registration && self.registration.navigationPreload
        ? self.registration.navigationPreload.enable()
        : Promise.resolve();
    })
  );
  clients.claim();
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  const isLocal = requestUrl.origin === self.location.origin;
  const isApiRequest =
    requestUrl.hostname.includes("supabase.co") ||
    requestUrl.pathname.startsWith("/api/");

  if (isApiRequest) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (isLocal && event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then(function (response) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put("./index.html", copy);
          });
          return response;
        })
        .catch(function () {
          return caches.match("./index.html");
        })
    );
    return;
  }

  const isStaticCore =
    isLocal &&
    (requestUrl.pathname.endsWith(".js") ||
      requestUrl.pathname.endsWith(".css") ||
      requestUrl.pathname.endsWith(".json"));

  if (isStaticCore) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then(function (response) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, copy);
          });
          return response;
        })
        .catch(function () {
          return caches.match(event.request);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request);
    })
  );
});
