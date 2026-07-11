// Cambia este número cada vez que subas cambios importantes: fuerza a los móviles
// a darse cuenta de que hay una versión nueva del service worker y a limpiar la caché vieja.
const CACHE_NAME = "cuentas-casa-v2";
const ASSETS = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
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

// Red primero, caché como respaldo solo si no hay conexión.
// Así cualquier actualización que subas a GitHub se ve en cuanto el móvil tiene internet,
// y la app solo tira de la copia guardada cuando está realmente sin cobertura/wifi.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Nunca cachear llamadas a Firebase o a la CDN de pdf.js — siempre red para esas
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return resp;
      })
      .catch(() => caches.match(event.request))
  );
});
