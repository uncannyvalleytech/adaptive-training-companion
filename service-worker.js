/**
 * @file service-worker.js
 * This service worker handles caching of app assets for offline functionality.
 */

const CACHE_NAME = 'adaptive-training-companion-cache-v1';

// We explicitly list all files the app needs to function offline.
// The list includes HTML, CSS, JavaScript, and any other static assets.
const urlsToCache = [
  '/',
  '/index.html',
  './src/style.css',
  '/src/main.js',
  '/src/services/api.js',
  '/src/services/google-auth.js',
  '/src/components/app-shell.js',
  '/src/components/history-view.js',
  '/src/components/onboarding-flow.js',
  '/src/components/settings-view.js',
  '/src/components/workout-feedback-modal.js',
  '/src/components/workout-session.js',
  '/src/components/workout-templates.js',
  '/src/components/achievements-view.js', // NEW
];

// The 'install' event is fired when the service worker is first installed.
// We use it to open a cache and add all the necessary files to it.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and adding files...');
        return cache.addAll(urlsToCache);
      })
  );
});

// The 'fetch' event is fired for every network request made by the page.
// We intercept these requests to serve cached content if available.
self.addEventListener('fetch', (event) => {
  // We don't cache requests to the Google Apps Script backend.
  if (event.request.url.includes('script.google.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If a response is found in the cache, we return it.
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }
        
        // If the file is not in the cache, we fetch it from the network.
        console.log('Fetching from network:', event.request.url);
        return fetch(event.request);
      })
  );
});

// The 'activate' event is fired when the service worker is activated.
// We use it to clean up old caches to save disk space.
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
