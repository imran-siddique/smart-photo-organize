// Basic Service Worker for Photo Sorter
const CACHE_NAME = 'photo-sorter-v1.0.0'
const STATIC_CACHE_URLS = [
  '/',
  '/src/main.css',
  '/src/styles/theme.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
]

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static resources')
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache static resources:', error)
      })
  )
  self.skipWaiting()
})

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then(networkResponse => {
            // Don't cache if not successful
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse
            }

            // Cache successful responses for static resources
            if (event.request.url.includes('.css') || 
                event.request.url.includes('.js') ||
                event.request.url.includes('fonts.googleapis.com')) {
              const responseToCache = networkResponse.clone()
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache)
                })
            }

            return networkResponse
          })
      })
      .catch(error => {
        console.error('Service Worker: Fetch failed:', error)
        
        // Return a basic offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return new Response(
            '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>Photo Sorter</h1><p>You are currently offline. Please check your connection.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          )
        }
        
        throw error
      })
  )
})

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered')
    // Here you could implement offline functionality like queuing operations
  }
})

// Push notifications (for future features)
self.addEventListener('push', (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [200, 100, 200],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '1'
      },
      actions: [
        {
          action: 'explore',
          title: 'Open App',
          icon: '/images/checkmark.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/images/xmark.png'
        }
      ]
    }
    
    event.waitUntil(
      self.registration.showNotification('Photo Sorter', options)
    )
  }
})