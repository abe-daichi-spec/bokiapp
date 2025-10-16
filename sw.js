self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('boki-rpg-v1').then(cache => {
    return cache.addAll([
      './','./index.html','./styles.css','./scripts.js',
      './firebase.config.js','./manifest.json','./assets/questions.csv'
    ]);
  }));
});
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});
