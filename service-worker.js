// service-worker.js (basic for PWA offline)
const CACHE_NAME = 'casino-gumball-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/assets/coin.png',
    '/assets/handle.svg',
    '/assets/clink.mp3',
    '/assets/crank.ogg',
    '/assets/bounce.mp3',
    '/assets/fanfare.mp3',
    '/assets/casino-lounge.mp3'
    // Add more assets
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request);
            })
    );
});
