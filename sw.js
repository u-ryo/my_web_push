self.addEventListener('push', function(event) {
    console.log('[ServiceWorker] push called.');
    if (!(self.Notification && self.Notification.permission === 'granted')) {
        return;
    }
    var data = {};
    if (event.data) {
        data = event.data.json();
    }
    var title = data.title;
    var message = data.message;
    var icon = 'ic_favorite_black_48dp_2x.png';
    self.clickTarget = data.clickTarget;
    event.waitUntil(self.registration.showNotification(title, {
        body: message,
        tag: 'push-demo',
        icon: icon,
        badge: icon,
        vibrate: [400, 100, 400]
    }));
});

self.addEventListener('notificationclick', function(event) {
    console.log('[Service Worker] Notification click Received.');
    event.notification.close();
    if (clients.openWindow) {
        event.waitUntil(clients.openWindow(self.clickTarget));
    }
});

var cacheName = 'testCache';

self.addEventListener('install', event => {
    console.log('[sw] install called.');
    event.waitUntil(
        caches.open(cacheName).then(cache => {
            console.log('[sw] caches opened.');
            return cache.addAll([
                './',
                './main.js'
            ]).then(() => {
                self.skipWaiting();
            });
        })
    );
});

self.addEventListener('activate', event => {
    console.log('[sw] activate');
});

self.addEventListener('fetch', event => {
    console.log('[sw] fetch called.');
    event.respondWith(
        caches.match(event.request).then(response => {
            console.log('[sw] caches match. response:' + response);
            if (response) {
                return response;
            }
            return fetch(event.request);
        })
    );
});
