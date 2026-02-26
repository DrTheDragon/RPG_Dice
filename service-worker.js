const CACHE_NAME = 'noir-rpg-cache-v' + new Date().getTime(); // Versão única (timestamp)

// Recursos essenciais para o funcionamento offline (adicione aqui todos os arquivos que seu app precisa)
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
  // Se você tiver outros arquivos (CSS, JS, imagens) que devem estar disponíveis offline, adicione aqui.
  // Mas lembre-se: o próprio service worker vai armazenar em cache tudo que for requisitado durante a navegação.
];

// Instalação: cacheia os recursos essenciais e ativa imediatamente
self.addEventListener('install', event => {
  self.skipWaiting(); // Força a ativação do novo SW sem esperar
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Intercepta as requisições
self.addEventListener('fetch', event => {
  const { request } = event;

  // Para navegação (HTML), usa network first com fallback para cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Se conseguiu da rede, armazena a nova versão no cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request)) // Se falhou (offline), entrega do cache
    );
    return;
  }

  // Para outros recursos (JS, CSS, imagens), usa cache first com atualização em background
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      const fetchPromise = fetch(request)
        .then(networkResponse => {
          // Atualiza o cache com a resposta da rede
          caches.open(CACHE_NAME).then(cache => cache.put(request, networkResponse.clone()));
          return networkResponse;
        })
        .catch(() => cachedResponse); // Se a rede falhar, retorna o cache (se existir)

      // Retorna o cache imediatamente se existir, senão aguarda a rede
      return cachedResponse || fetchPromise;
    })
  );
});

// Ativação: assume o controle imediatamente e limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
});
