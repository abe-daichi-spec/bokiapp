// Service Worker (Hotfix) — cache version bump to avoid 古いキャッシュ
const CACHE = 'boki-rpg-v2';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll([
    './','./index.html','./styles.css','./scripts.js',
    './firebase.config.js','./manifest.json','./assets/questions.csv'
  ])));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
});
self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});