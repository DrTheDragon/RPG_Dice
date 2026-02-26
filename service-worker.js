const CACHE_NAME = 'noir-rpg-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  // Adicione outros assets se necessário (CSS, JS, imagens)
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Força a ativação imediata do novo service worker
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // Estratégia: network first para HTML, cache first para outros
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});

self.addEventListener('activate', event => {
  // Toma controle imediatamente
  event.waitUntil(clients.claim());
  // Limpa caches antigos
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});
