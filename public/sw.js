/**
 * MV Habits Service Worker
 * Handles: Web Push notifications.
 *
 * NOTE: the `fetch` handler below is intentionally a no-op. Chrome requires a
 * registered fetch handler for PWA install eligibility, but an earlier version
 * that actually intercepted same-origin GETs for an "offline shell" broke the
 * Next.js App Router: it corrupted RSC payloads (so client-side tab navigation
 * fell back to hard reloads) and truncated streamed SSR documents on larger
 * pages (e.g. /trip/expenses rendered blank). For an auth-gated, network-bound
 * app the offline shell added little value and lots of breakage, so navigation
 * and document requests are left entirely to the browser. Push remains.
 */

const CACHE_NAME = 'mv-habits-v3';

// ── Install: activate immediately ─────────────────────────────────────────
self.addEventListener('install', () => {
  self.skipWaiting();
});

// ── Activate: drop any caches left by older versions, take control ────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// ── Fetch: network fetch handler for PWA compliance ───────────────────────
self.addEventListener('fetch', (event) => {
  // Pass-through fetch handler for Android PWA install eligibility
  // Leaves document navigation and streaming RSC requests to browser network layer.
});


// ── Push: show notification ───────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {
    title: 'MV Habits',
    body: "Time to check in on today's habits!",
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    url: '/dashboard',
    tag: 'mv-habits-reminder',
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    // If JSON parse fails, use defaults
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      renotify: true,
      data: { url: data.url },
      actions: [
        { action: 'open', title: 'Check in now' },
        { action: 'dismiss', title: 'Later' },
      ],
    })
  );
});

// ── Notification click: open dashboard ───────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url ?? '/dashboard';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Focus existing tab if already open
        const existing = clients.find(
          (c) => new URL(c.url).pathname === new URL(targetUrl, self.location.origin).pathname
        );
        if (existing) return existing.focus();
        return self.clients.openWindow(targetUrl);
      })
  );
});
