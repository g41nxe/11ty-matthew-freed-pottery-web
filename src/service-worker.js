// Self-destroying service worker.
//
// The site no longer ships a service worker (the PWA/offline layer was
// removed because it served stale pages). This file replaces the old Workbox
// worker at the same URL (/service-worker.js). When a browser that still has
// the old worker registered checks for an update, it fetches this instead,
// which unregisters itself, clears the old caches, and reloads open tabs so
// visitors immediately get fresh, network-served content.
//
// Keep this deployed for a while so returning visitors get cleaned up, then
// it can be deleted along with the passthrough entry in .eleventy.js.

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            await self.registration.unregister();
            const keys = await caches.keys();
            await Promise.all(keys.map((key) => caches.delete(key)));
            const clients = await self.clients.matchAll({ type: "window" });
            clients.forEach((client) => client.navigate(client.url));
        })()
    );
});
