var isSubscribed = false;

function prepareNotification() {
    var serviceWorkerRegistration;
    var subscribeParams;
    Notification.requestPermission()
        .then(function (status) {
            if (status === 'denied') {
                console.log('notification denied.');
            } else if (status === 'granted') {
                console.log('notification granted.');
                if ('serviceWorker' in navigator) {
                    console.log('registering serviceWorker...');
                    return navigator.serviceWorker.register('/sw.js');
                }
            }
            return null;
        })
        .then(function(serviceWorker) {
            console.log('Service Worker Registered.', serviceWorker);
            return navigator.serviceWorker.ready;
        })
        .then(function(reg) {
            console.log('reg:', reg);
            serviceWorkerRegistration = reg;
            return fetch('/publicKey');
        })
        .then(function(response) {
            console.log('response:', response);
            return response.text();
        })
        .then(function(text) {
            console.log('publicKey:' + text);
            subscribeParams = {
                userVisibleOnly: true,
                applicationServerKey: urlB64ToUint8Array(text)
            };
            console.log('serviceWorkerRegistration:', serviceWorkerRegistration);
            return serviceWorkerRegistration.pushManager.getSubscription();
        })
        .then(function(subscription) {
            console.log('subscription:', subscription);
            if (subscription) {
                subscription.unsubscribe();
            }
            console.log('serviceWorkerRegistration:', serviceWorkerRegistration);
            return serviceWorkerRegistration.pushManager.subscribe(subscribeParams);
        })
        .then(function (subscription) {
            console.log('subscription:', subscription);
            var endpoint = subscription.endpoint;
            var key = subscription.getKey('p256dh');
            var auth = subscription.getKey('auth');
            sendSubscriptionToServer(endpoint, key, auth);
            isSubscribed = true;
            setButtonState(false);
        })
        .catch(function (e) {
            console.error('Unable to subscribe to push.', e);
        });
}

function setButtonState(state) {
    $('#btnPushNotifications').prop('disabled', !state);
}

function stringToBuffer(src) {
    return (new Uint16Array([].map.call(src, function(c) {
        return c.charCodeAt(0);
    }))).buffer;
}

function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
          .replace(/\-/g, '+')
          .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function sendSubscriptionToServer(endpoint, key, auth) {
    var encodedKey = btoa(String.fromCharCode.apply(null, new Uint8Array(key)));
    var encodedAuth = btoa(String.fromCharCode.apply(null, new Uint8Array(auth)));
    fetch('/subscribe',
          { method: 'POST',
            headers: new Headers({
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify({
                publicKey: encodedKey,
                auth: encodedAuth,
                notificationEndPoint: endpoint
            })
          })
        .then(response => console.log('Subscribed successfully! ', response))
        .catch(error => console.error('Error:', error));
}
