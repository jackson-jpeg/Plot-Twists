// Service Worker for Plot Twists PWA
const CACHE_NAME = 'plot-twists-v2'
const STATIC_ASSETS = [
  '/',
  '/join',
  '/host',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Static assets cached on install
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            // Clean up old cache version
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip WebSocket and API requests
  const url = new URL(event.request.url)
  if (url.protocol === 'ws:' || url.protocol === 'wss:') return
  if (url.pathname.startsWith('/api/')) return

  // Cache-first for content-hashed static assets (immutable)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          return response
        })
      })
    )
    return
  }

  // Skip other _next paths (e.g. _next/data)
  if (url.pathname.startsWith('/_next/')) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before caching
        const responseClone = response.clone()

        // Cache the fetched response
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone)
        })

        return response
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }

          // If not in cache, return a custom offline page (optional)
          if (event.request.destination === 'document') {
            return caches.match('/')
          }
        })
      })
  )
})

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return
  try {
    const data = event.data.json()
    const options = {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: data.data || {},
      vibrate: [200, 100, 200],
    }
    event.waitUntil(self.registration.showNotification(data.title || 'Plot Twists', options))
  } catch {
    // Invalid push payload
  }
})

// Notification click — open/focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const roomCode = event.notification.data?.roomCode
  const urlPath = roomCode ? `/join?code=${roomCode}` : '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
          client.navigate(urlPath)
          return client.focus()
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(urlPath)
    })
  )
})
