// ════════════════════════════════════════════════════════════
//  SERVICE WORKER — dashboard PWA + push notifications
//
//  v12 — ships the missing icon PNGs (2026-07-08):
//   - adds ./icon-192.png (192x192, RGBA) and ./icon-512.png (512x512, RGBA)
//     to fix cache.addAll() install failure. The PNGs were referenced in
//     both this ASSETS array and manifest.json but never committed, so
//     install rejected, skipWaiting() never ran, the SW died at 'redundant',
//     and navigator.serviceWorker.ready hung forever on iOS PWA.
//   - activates the existing logic that drops any old CACHE on mismatch,
//     so prior half-installed (redundant) v11 SWs are pruned automatically.
//
//  v11 — adds Web Push support (Priority 2, 2026-07-08):
//   - push event handler reads JSON payload {title, body, url}
//     and shows a notification via self.registration.showNotification
//   - notificationclick handler closes the notification and
//     focuses the app if open, otherwise opens url
//   - cache version bumped v10 → v11; the activate handler
//     already deletes any old caches that don't match CACHE
//
//  iOS 16.4+ requirement: the page must be added to Home Screen
//  from Safari before Notification.requestPermission() will
//  resolve. The "Enable meal reminders" button in stack.html
//  detects this case and shows platform-aware install instructions
//  instead of silently failing.
// ════════════════════════════════════════════════════════════

const CACHE = 'dashboard-pwa-v13';
const ASSETS = [
  './', './index.html', './manifest.json', './icon.svg',
  './icon-192.png', './icon-512.png',
  './topbar.js', './tabs.js', './stack.html', './nutrition.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// ════════════════════════════════════════════════════════════
//  PUSH — receive a push event and display a notification
// ════════════════════════════════════════════════════════════
self.addEventListener('push', (event) => {
  // Default payload in case the push came in without data
  let data = {
    title: 'Jarvis',
    body:  'You have a new reminder.',
    url:   '/',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      // If the payload isn't JSON, fall back to text
      try { data.body = event.data.text(); } catch (_) {}
    }
  }

  const options = {
    body: data.body,
    icon: data.icon  || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    data: { url: data.url || '/' },
    vibrate: [100, 50, 100],
    tag: data.tag || 'jarvis-reminder',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ════════════════════════════════════════════════════════════
//  NOTIFICATION CLICK — focus the app or open it
// ════════════════════════════════════════════════════════════
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If any tab is already open to the app, focus it.
      for (const client of clientList) {
        try {
          if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
            return client.focus();
          }
        } catch (_) { /* ignore malformed client.url */ }
      }
      // Otherwise open a new window/tab to the target URL.
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
