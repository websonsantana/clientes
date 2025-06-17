self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('fetch', function(event) {
  // Padrão: não faz cache offline, mas pode ser expandido
}); 