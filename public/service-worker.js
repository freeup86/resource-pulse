const CACHE_NAME = 'resource-pulse-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/static/js/main.js',
  '/static/css/main.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
    }).then((cachesToDelete) => {
      return Promise.all(cachesToDelete.map((cacheToDelete) => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first with cache fallback
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (event.request.url.startsWith(self.location.origin)) {
    // API requests - network only
    if (event.request.url.includes('/api/')) {
      event.respondWith(
        fetch(event.request)
          .catch(() => {
            return caches.match('/offline.html');
          })
      );
    } else {
      // Static assets - network first with cache fallback
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            // Cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Fallback to cache if network fails
            return caches.match(event.request)
              .then((response) => {
                if (response) {
                  return response;
                }
                // If both network and cache fail, show offline page
                if (event.request.headers.get('accept').includes('text/html')) {
                  return caches.match('/offline.html');
                }
                return Response.error();
              });
          })
      );
    }
  }
});

// Sync event - handle background syncs
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-resources') {
    event.waitUntil(syncResources());
  }
});

// Example function to sync resources data
async function syncResources() {
  try {
    const storedRequests = await getStoredRequests();
    if (storedRequests.length === 0) return;
    
    // Process each stored request
    await Promise.all(storedRequests.map(async (storedRequest) => {
      const { url, method, data } = storedRequest;
      try {
        await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: data ? JSON.stringify(data) : undefined
        });
        // Remove successful request from queue
        await removeStoredRequest(storedRequest.id);
      } catch (error) {
        console.error('Failed to process queued request:', error);
      }
    }));
  } catch (error) {
    console.error('Error during background sync:', error);
  }
}

// Helper functions for IndexedDB operations (simplified)
async function getStoredRequests() {
  // In a real app, this would retrieve from IndexedDB
  return [];
}

async function removeStoredRequest(id) {
  // In a real app, this would remove from IndexedDB
}