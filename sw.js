const CACHE_VERSION = 4;
const CACHE_NAME = `raffle-system-v${CACHE_VERSION}`;
const ASSETS_TO_CACHE = [
  '/',
  '/config.js',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install service worker and skip waiting
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Fetch resources with network-first strategy for HTML and API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Network-first for HTML and API calls
  if (request.method === 'GET' && 
      (request.headers.get('accept').includes('text/html') || 
       url.pathname.startsWith('/api/'))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
  } else {
    // Cache-first for other resources (CSS, JS, images)
    event.respondWith(
      caches.match(request)
        .then((response) => {
          return response || fetch(request).then((fetchResponse) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, fetchResponse.clone());
              return fetchResponse;
            });
          });
        })
    );
  }
});

// Activate and clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated and claiming clients');
        return self.clients.claim(); // Take control immediately
      })
  );
});