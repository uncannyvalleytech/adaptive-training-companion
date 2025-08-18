/**
 * @file service-worker.js
 * This service worker handles caching of app assets for offline functionality.
 */

const CACHE_NAME = 'adaptive-training-companion-cache-v3'; // Updated cache name

// We explicitly list all files the app needs to function offline.
const urlsToCache = [
  './',
  './index.html',
  './src/style.css',
  './src/main.js',
  './src/services/api.js',
  './src/services/google-auth.js',
  './src/services/workout-engine.js',
  './src/services/exercise-database.js',
  './src/components/app-shell.js',
  './src/components/history-view.js',
  './src/components/onboarding-flow.js',
  './src/components/settings-view.js',
  './src/components/workout-feedback-modal.js',
  './src/components/workout-session.js',
  './src/components/workout-templates.js',
  './src/components/achievements-view.js',
  './src/components/readiness-modal.js',
];

// The 'install' event is fired when the service worker is first installed.
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Add files one by one to handle failures gracefully
        const cachePromises = urlsToCache.map(url => {
          return cache.add(url).catch(err => {
            console.warn(`Failed to cache ${url}:`, err.message);
            // Don't fail the entire installation if one file fails
            return Promise.resolve();
          });
        });
        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('Cache setup completed');
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Cache setup failed:', error);
      })
  );
});

// The 'fetch' event is fired for every network request made by the page.
self.addEventListener('fetch', (event) => {
  // Skip caching for external resources
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip caching for Google services
  if (event.request.url.includes('google.com') || 
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('script.google.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }
        
        // Clone the request because it's a stream and can only be consumed once
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response because it's a stream and can only be consumed once
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(() => {
          // If fetch fails, try to return a cached version for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// The 'activate' event is fired when the service worker is activated.
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
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
    }).then(() => {
      // Ensure the new service worker takes control immediately
      return self.clients.claim();
    })
  );
});
