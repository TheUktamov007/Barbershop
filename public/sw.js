// Bravo Barbershop Service Worker — minimal push handler.
// We don't encrypt push payloads (would need ECE). The server sends an empty
// push and we show a generic notification. On click, open the Mini App.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = { title: "Bravo", body: "У вас обновление", url: "/" };
  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      try {
        payload.body = event.data.text();
      } catch {}
    }
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/assets/svc-manicure.jpg",
      badge: "/assets/svc-manicure.jpg",
      tag: payload.tag || "bravo",
      data: { url: payload.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) return c.navigate(target).then(() => c.focus()).catch(() => c.focus());
      }
      return self.clients.openWindow(target);
    }),
  );
});
