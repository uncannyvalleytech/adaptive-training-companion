/**
 * @file service-worker.js
 * This service worker handles caching of app assets for offline functionality.
 */

const CACHE_NAME = 'adaptive-training-companion-cache-v2'; // Updated cache name

// We explicitly list all files the app needs to function offline.
const urlsToCache = [
  '/',
  '/index.html',
  './src/style.css',
  '/src/main.js',
  '/src/services/api.js',
  '/src/services/google-auth.js',
  '/src/services/workout-engine.js',
  '/src/services/exercise-database.js',
  '/src/components/app-shell.js',
  '/src/components/history-view.js',
  '/src/components/onboarding-flow.js',
  '/src/components/settings-view.js',
  '/src/components/workout-feedback-modal.js',
  '/src/components/workout-session.js',
  '/src/components/workout-templates.js',
  '/src/components/achievements-view.js',
  '/src/components/readiness-modal.js',
];

// The 'install' event is fired when the service worker is first installed.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and adding files...');
        // Add files one by one to handle failures gracefully
        const promises = urlsToCache.map(url => {
          return cache.add(url).catch(err => {
            console.warn(`Failed to cache ${url}:`, err);
          });
        });
        return Promise.all(promises);
      })
      .then(() => {
        console.log('Cache setup completed');
      })
      .catch((error) => {
        console.error('Cache setup failed:', error);
      })
  );
});

// The 'fetch' event is fired for every network request made by the page.
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('script.google.com') || 
      event.request.url.includes('accounts.google.com') ||
      event.request.url.includes('googleapis.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// The 'activate' event is fired when the service worker is activated.
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
