/**
 * @file service-worker.js
 * Enhanced service worker with better error handling and caching strategy
 */

const CACHE_NAME = 'adaptive-training-companion-cache-v4';
const STATIC_CACHE_NAME = 'static-cache-v4';
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v4';

// Core files that are essential for the app to function
const CORE_FILES = [
  './',
  './index.html',
  './src/style.css',
  './src/main.js'
];

// Additional files to cache when available
const ADDITIONAL_FILES = [
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
  './src/components/motivational-elements.js'
];

// URLs that should never be cached
const NEVER_CACHE = [
  /\.google\.com/,
  /\.googleapis\.com/,
  /\.gstatic\.com/,
  /accounts\.google\.com/,
  /script\.google\.com/,
  /cdn\.skypack\.dev/,
  /cdn\.jsdelivr\.net/
];

/**
 * Install event - cache core files
 */
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache core files
      caches.open(STATIC_CACHE_NAME).then(cache => {
        console.log('Caching core files...');
        return cacheFilesGracefully(cache, CORE_FILES);
      }),
      
      // Cache additional files
      caches.open(DYNAMIC_CACHE_NAME).then(cache => {
        console.log('Caching additional files...');
        return cacheFilesGracefully(cache, ADDITIONAL_FILES);
      })
    ]).then(() => {
      console.log('Service Worker installation completed');
      return self.skipWaiting();
    }).catch(error => {
      console.error('Service Worker installation failed:', error);
      // Don't fail installation completely
      return self.skipWaiting();
    })
  );
});

/**
 * Cache files with graceful error handling
 */
async function cacheFilesGracefully(cache, urls) {
  const cachePromises = urls.map(async (url) => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        console.log(`Cached: ${url}`);
      } else {
        console.warn(`Failed to cache ${url}: ${response.status}`);
      }
    } catch (error) {
      console.warn(`Error caching ${url}:`, error.message);
    }
  });
  
  await Promise.allSettled(cachePromises);
}

/**
 * Fetch event - serve from cache with network fallback
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip caching for external resources that shouldn't be cached
  if (shouldSkipCaching(url)) {
    return;
  }
  
  // Handle navigation requests specially
  if (event.request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(event.request));
    return;
  }
  
  // Handle other requests with cache-first strategy
  event.respondWith(handleResourceRequest(event.request));
});

/**
 * Check if URL should be skipped from caching
 */
function shouldSkipCaching(url) {
  // Skip external domains that we shouldn't cache
  if (url.origin !== self.location.origin) {
    return NEVER_CACHE.some(pattern => pattern.test(url.href));
  }
  
  // Skip certain file types or API calls
  if (url.pathname.includes('/api/') || url.search.includes('nocache')) {
    return true;
  }
  
  return false;
}

/**
 * Handle navigation requests (page loads)
 */
async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful navigation responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone()).catch(error => {
        console.warn('Failed to cache navigation response:', error);
      });
      return networkResponse;
    }
    
    throw new Error(`Network response not ok: ${networkResponse.status}`);
    
  } catch (networkError) {
    console.log('Network failed for navigation, trying cache:', networkError.message);
    
    // Try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to index.html for SPA routing
    const indexResponse = await caches.match('./index.html');
    if (indexResponse) {
      return indexResponse;
    }
    
    // Last resort: return a basic HTML page
    return new Response(
      createOfflinePage(),
      {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

/**
 * Handle resource requests (CSS, JS, images, etc.)
 */
async function handleResourceRequest(request) {
  try {
    // Try cache first for resources
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log(`Serving from cache: ${request.url}`);
      
      // Update cache in background if it's stale
      updateCacheInBackground(request);
      
      return cachedResponse;
    }
    
    // Not in cache, try network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone()).catch(error => {
        console.warn('Failed to cache resource:', error);
      });
      return networkResponse;
    }
    
    throw new Error(`Network response not ok: ${networkResponse.status}`);
    
  } catch (error) {
    console.log(`Failed to fetch resource ${request.url}:`, error.message);
    
    // For critical resources, return a meaningful error response
    if (request.url.includes('.js') || request.url.includes('.css')) {
      return new Response('/* Resource temporarily unavailable */', {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    // For other resources, return a generic error
    return new Response('Resource not available', {
      status: 404,
      statusText: 'Not Found'
    });
  }
}

/**
 * Update cache in background for stale resources
 */
async function updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      await cache.put(request, networkResponse);
      console.log(`Updated cache in background: ${request.url}`);
    }
  } catch (error) {
    console.log(`Background cache update failed for ${request.url}:`, error.message);
  }
}

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  const validCaches = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!validCaches.includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all pages immediately
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker activation completed');
    }).catch(error => {
      console.error('Service Worker activation failed:', error);
    })
  );
});

/**
 * Message handling for cache management
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      
      case 'CLEAR_CACHE':
        clearCaches().then(() => {
          event.ports[0].postMessage({ success: true });
        }).catch(error => {
          event.ports[0].postMessage({ success: false, error: error.message });
        });
        break;
      
      case 'GET_CACHE_STATUS':
        getCacheStatus().then(status => {
          event.ports[0].postMessage(status);
        });
        break;
    }
  }
});

/**
 * Clear all caches
 */
async function clearCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('All caches cleared');
}

/**
 * Get cache status information
 */
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = keys.length;
  }
  
  return status;
}

/**
 * Create offline page HTML
 */
function createOfflinePage() {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - Progression</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background: linear-gradient(135deg, #1A1A2E 0%, #16213e 50%, #0f1419 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
          }
          .container {
            max-width: 400px;
            padding: 2rem;
          }
          h1 { color: #00D4FF; }
          button {
            background: #00D4FF;
            border: none;
            color: #1A1A2E;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 1rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>💪 Progression</h1>
          <h2>You're Offline</h2>
          <p>No internet connection detected. Please check your connection and try again.</p>
          <button onclick="window.location.reload()">Retry</button>
        </div>
      </body>
    </html>
  `;
}
