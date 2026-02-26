const CACHE_NAME = 'noir-rpg-cache-v' + new Date().getTime(); // Versão única

// Recursos essenciais para funcionamento offline
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
  // Adicione outros assets se necessário (ex: imagens, fontes)
];


self.addEventListener('install', event => {
  self.skipWaiting(); // Ativa imediatamente
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  // Estratégia: network first para HTML, stale-while-revalidate para outros
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Atualiza o cache com a nova resposta
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request)) // Fallback para cache
    );
  } else {
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
  }
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim()); // Toma controle imediatamente
  // Remove caches antigos
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
});
