// v2 : la v1 mettait en cache n'importe quelle reponse, y compris une erreur
// renvoyee pendant un redemarrage ou un deploiement, puis la resservait a vie
// (page sans mise en forme). Changer le nom purge ces caches empoisonnes.
const CACHE_NAME = "deviso-v2";

// Pages servies hors ligne en dernier recours.
const STATIC_ASSETS = ["/", "/login", "/signup"];

// Ne garde que les reponses saines du site lui-meme.
const cachable = (res) => res && res.ok && res.type === "basic";

function mettreEnCache(request, res) {
  if (!cachable(res)) return;
  const clone = res.clone();
  caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Supprime les anciens caches
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Ne pas intercepter les appels API, Supabase ni les autres domaines
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  // Fichiers de build : nom unique par contenu, donc immuables. Cache d'abord.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            mettreEnCache(request, res);
            return res;
          })
      )
    );
    return;
  }

  // Pages et autres ressources : reseau d'abord, cache seulement hors ligne.
  if (request.destination === "document" || ["style", "script", "image", "font"].includes(request.destination)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          mettreEnCache(request, res);
          return res;
        })
        .catch(() => caches.match(request))
    );
  }
});
