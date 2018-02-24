# Web Push with VAPID simple demo

# How to use

1. Start the server `groovy -cp /usr/share/java/servlet-api-3.1.jar webpush.groovy`
1. Open http://localhost:4567/ with Chrome/Chromium/Firefox/Edge
1. Click button "Enable Push Messaging"
1. Send a message using `curl`/`wget` like `curl http://localhost:4567/push --data '{"message":"This is a message.","title":"PUSH MESSAGE","clickTarget":"https://yahoo.jp"}'`
