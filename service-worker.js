const CACHE_NAME = 'doto-rpg-cache-v1';
const urlsToCache = [
  './', // Isso cacheia o index.html automaticamente
  './index.html', // redundante, mas seguro
  './favicon.svg',
  './icon-192.png',
  './icon-512.png'
];

// Instala o service worker e faz o cache dos recursos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Intercepta requisições e serve do cache se disponível
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se encontrou no cache, retorna
        if (response) {
          return response;
        }
        // Caso contrário, faz a requisição normal (online)
        return fetch(event.request);
      })
  );
});

// Limpa caches antigos quando uma nova versão é ativada
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
