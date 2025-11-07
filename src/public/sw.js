const CACHE_NAME = 'storymap-v1.0.2';
const BASE_PATH = '/starter-project-with-vite';
const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/styles/styles.css`,
  `${BASE_PATH}/scripts/index.js`,
  `${BASE_PATH}/scripts/pages/app.js`,
  `${BASE_PATH}/scripts/data/api.js`,
  `${BASE_PATH}/scripts/utils/idb.js`,
  `${BASE_PATH}/favicon.png`,
  `${BASE_PATH}/manifest.json`
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        if (cached) return cached;
        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') return response;
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            return response;
          })
          .catch(() => {
            if (event.request.destination === 'document') {
              return caches.match(`${BASE_PATH}/`);
            }
          });
      })
  );
});

self.addEventListener('push', (event) => {
  let payload = {
    title: 'StoryMap - New Story!',
    body: 'A new journey has been shared on StoryMap.',
    icon: `${BASE_PATH}/favicon.png`,
    badge: `${BASE_PATH}/favicon.png`,
    data: { url: `${BASE_PATH}/#/map` }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      payload = { ...payload, ...data };
    } catch {
      try {
        const textData = event.data.text();
        if (textData) payload.body = textData;
      } catch {}
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon,
    badge: payload.badge,
    data: payload.data,
    actions: [
      { action: 'view', title: 'View Map', icon: payload.icon },
      { action: 'close', title: 'Close', icon: payload.icon }
    ],
    tag: 'storymap-notification',
    vibrate: [200, 100, 200],
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const urlToOpen = event.notification.data?.url || `${BASE_PATH}/#/map`;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if (client.url.includes(self.location.origin)) {
          client.postMessage({ type: 'NAVIGATE_TO', path: urlToOpen });
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'TRIGGER_PUSH') {
    const { title, body, icon, url } = event.data;
    const options = {
      body: body || 'This is a test notification from StoryMap',
      icon: icon || `${BASE_PATH}/favicon.png`,
      badge: `${BASE_PATH}/favicon.png`,
      data: { url: url || `${BASE_PATH}/#/map` },
      actions: [{ action: 'view', title: 'View Map', icon: icon || `${BASE_PATH}/favicon.png` }],
      vibrate: [200, 100, 200],
      tag: 'test-notification'
    };
    event.waitUntil(
      self.registration.showNotification(title || 'StoryMap - Test Notification', options)
    );
  }

  if (event.data?.type === 'NEW_STORY') {
    const { title, body, icon, url, lat, lon } = event.data;
    const options = {
      body,
      icon: icon || `${BASE_PATH}/favicon.png`,
      badge: `${BASE_PATH}/favicon.png`,
      data: { url: url || `${BASE_PATH}/#/map`, lat, lon, type: 'new_story' },
      actions: [
        { action: 'view_map', title: 'View on Map', icon: icon || `${BASE_PATH}/favicon.png` },
        { action: 'view_stories', title: 'View Stories', icon: icon || `${BASE_PATH}/favicon.png` }
      ],
      vibrate: [200, 100, 200, 100, 200],
      tag: `story-${Date.now()}`,
      requireInteraction: false,
      timestamp: Date.now()
    };
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});
