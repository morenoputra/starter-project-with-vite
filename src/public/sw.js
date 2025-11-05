import { precacheAndRoute } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener("push", (event) => {
  let payload = {
    title: "New notification",
    body: "You have a new message",
    data: {},
  };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (err) {
      payload = { title: "Notification", body: String(event.data), data: {} };
    }
  }

  const title = payload.title || "Notification";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icons/icon-192.svg",
    badge: payload.badge || "/icons/icon-192.svg",
    data: payload.data || {},
    actions: payload.actions || [],
    tag: payload.tag || undefined,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  notification.close();

  let urlToOpen = null;
  if (
    action &&
    data &&
    data.actions &&
    data.actions[action] &&
    data.actions[action].url
  ) {
    urlToOpen = data.actions[action].url;
  } else if (data && data.url) {
    urlToOpen = data.url;
  }

  const defaultUrl = "/";

  const promiseChain = clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((windowClients) => {
      if (urlToOpen) {
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(urlToOpen);
      }
      if (windowClients.length > 0) return windowClients[0].focus();
      return clients.openWindow(defaultUrl);
    });

  event.waitUntil(promiseChain);
});
