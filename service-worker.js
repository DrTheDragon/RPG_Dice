const CACHE_NAME = 'noir-rpg-cache-v' + new Date().getTime();

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Ativa o novo SW imediatamente
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  // Para HTML (navegação), sempre tenta a rede primeiro
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Se conseguiu da rede, atualiza o cache e retorna
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request)) // Se falhou (offline), usa cache
    );
    return;
  }

  // Para outros recursos (JS, CSS, imagens), usa cache com atualização em background
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      const fetchPromise = fetch(request)
        .then(networkResponse => {
          caches.open(CACHE_NAME).then(cache => cache.put(request, networkResponse.clone()));
          return networkResponse;
        })
        .catch(() => cachedResponse);
      return cachedResponse || fetchPromise;
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim()); // Toma controle de todas as abas
  // Remove caches antigos
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
});
