const CACHE_NAME = 'noir-rpg-cache-v' + new Date().getTime();

// Recursos essenciais para funcionamento offline
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  'https://fonts.googleapis.com/css2?family=Special+Elite&display=swap'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Usamos allSettled para não falhar se algum recurso externo (fonte) não for cacheado
      return Promise.allSettled(urlsToCache.map(url => 
        cache.add(url).catch(err => console.warn('Falha ao cachear:', url, err))
      ));
    })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  // Para navegação (HTML), network first com fallback para cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Para outros recursos, cache first
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        // Atualiza o cache em segundo plano (stale-while-revalidate)
        fetch(request).then(networkResponse => {
          caches.open(CACHE_NAME).then(cache => cache.put(request, networkResponse));
        }).catch(() => {});
        return cachedResponse;
      }

      // Se não está no cache, busca da rede e adiciona ao cache se for um recurso que queremos
      return fetch(request).then(networkResponse => {
        // Se for um recurso que pode ser cacheado (ex: fonte, CSS, JS), adiciona
        if (request.url.includes('fonts.googleapis.com') || request.url.includes('favicon') || request.url.includes('.css') || request.url.includes('.js')) {
          caches.open(CACHE_NAME).then(cache => cache.put(request, networkResponse.clone()));
        }
        return networkResponse;
      }).catch(() => {
        // Fallback para recursos que não estão no cache e offline
        if (request.url.includes('.css')) {
          return new Response('', { status: 200, headers: { 'Content-Type': 'text/css' } });
        }
        return new Response('Recurso não disponível offline', { status: 404 });
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
});
