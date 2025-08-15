// Service Worker for BeamShare PWA
const CACHE_NAME = 'beamshare-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/ui/state.js',
  '/src/ui/theme.js',
  '/src/ui/manager.js',
  '/src/webrtc/connection.js',
  '/src/webrtc/signaling.js',
  '/src/webrtc/transfer.js',
  '/src/storage/manager.js',
  '/src/utils/checksum.js',
  '/src/utils/bytes.js',
  '/manifest.webmanifest'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[SW] Failed to cache assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle requests from our origin
  if (url.origin !== location.origin) {
    return;
  }
  
  // Don't cache WebRTC related requests or data
  if (url.pathname.includes('webrtc') || 
      url.pathname.includes('transfer') ||
      url.pathname.includes('api')) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', request.url);
          return cachedResponse;
        }
        
        console.log('[SW] Fetching from network:', request.url);
        return fetch(request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone response to cache
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          
          return response;
        });
      })
      .catch((error) => {
        console.error('[SW] Fetch failed:', error);
        
        // Return offline fallback for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        
        throw error;
      })
  );
});

// Message event - handle updates from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Push event - handle push notifications (future feature)
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received');
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'File transfer notification',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'beamshare-notification',
      requireInteraction: false
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'BeamShare', options)
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // If app is already open, focus it
      for (let client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Background sync (future feature for resumable transfers)
self.addEventListener('sync', (event) => {
  if (event.tag === 'resume-transfer') {
    console.log('[SW] Background sync: resume-transfer');
    // Implementation would go here
  }
});

console.log('[SW] Service worker loaded');