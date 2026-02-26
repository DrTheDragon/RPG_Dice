const CACHE_NAME = 'noir-rpg-cache-v' + new Date().getTime(); // Versão única por timestamp
const urlsToCache = [
  '/',
  '/index.html'
  // Adicione outros assets (CSS, imagens) se necessário
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Ativa imediatamente
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // Estratégia: network first para HTML, stale-while-revalidate para outros
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Atualiza o cache com a nova resposta
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match(event.request)) // Fallback para cache
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          const fetchPromise = fetch(event.request)
            .then(networkResponse => {
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
              return networkResponse;
            });
          return response || fetchPromise;
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
