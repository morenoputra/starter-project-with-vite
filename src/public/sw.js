const CACHE_NAME = 'storymap-static-v1';
const RUNTIME_CACHE = 'storymap-runtime-v1';
const API_CACHE = 'storymap-api-v1';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/styles/styles.css',
  '/scripts/index.js',
  '/scripts/pages/app.js',
  '/images/logo.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = { title: 'New notification', body: 'You have a new message', data: {} };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (err) {
      payload = { title: 'Notification', body: String(event.data), data: {} };
    }
  }

  const title = payload.title || 'Notification';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/images/notification-icon.png',
    badge: payload.badge || '/images/notification-badge.png',
    data: payload.data || {},
    actions: payload.actions || [],
    tag: payload.tag || undefined,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  notification.close();

  let urlToOpen = null;
  if (action && data && data.actions && data.actions[action] && data.actions[action].url) {
    urlToOpen = data.actions[action].url;
  } else if (data && data.url) {
    urlToOpen = data.url;
  }

  const promiseChain = clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
    if (urlToOpen) {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    }
    if (windowClients.length > 0) return windowClients[0].focus();
    return clients.openWindow('/');
  });

  event.waitUntil(promiseChain);
});

// Cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cache static scripts from our origin (cache-first)
  if (url.origin === self.location.origin && url.pathname.startsWith('/scripts')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        return caches.open(RUNTIME_CACHE).then((cache) => {
          try { cache.put(request, res.clone()); } catch (e) { /* ignore cache errors */ }
          return res;
        });
      }).catch(() => cached))
    );
    return;
  }

  // Dynamic API: stories (stale-while-revalidate)
  if (request.method === 'GET' && request.url.includes('/stories')) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cached = await cache.match(request);

        // Start network fetch in background to update cache
        const fetchAndUpdate = fetch(request).then(async (response) => {
          try {
            const contentType = response.headers.get('content-type') || '';
            // Only cache JSON responses to avoid saving HTML error pages
            if (response && response.ok && /application\/json/i.test(contentType)) {
              try { await cache.put(request, response.clone()); } catch (e) { /* ignore */ }
            }
          } catch (e) {
            // ignore header/put errors
          }
          return response;
        }).catch(() => null);

        if (cached) {
          // Serve cached immediately and update in background
          event.waitUntil(fetchAndUpdate);
          return cached;
        }

        // No cached copy — wait for network, fall back to cache if network fails
        const netResp = await fetchAndUpdate;
        if (netResp) return netResp;
        const fallback = await cache.match(request);
        return fallback || new Response(null, { status: 503, statusText: 'Service Unavailable' });
      })
    );
    return;
  }

  // Default: try cache first, then network, else cached fallback
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).catch(() => cached))
  );
});
