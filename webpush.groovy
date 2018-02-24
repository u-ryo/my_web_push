@Grab('nl.martijndwars:web-push:3.0.2')
@Grab('com.sparkjava:spark-core:2.7.1')
@Grab('org.slf4j:slf4j-simple:1.8.0-beta1')
@Grab('org.bouncycastle:bcprov-jdk15on:1.59')


import groovy.json.JsonSlurper
import java.nio.file.Paths
import java.security.*
import nl.martijndwars.webpush.*
import nl.martijndwars.webpush.Utils
import static nl.martijndwars.webpush.Utils.*
import org.bouncycastle.jce.ECNamedCurveTable
import org.bouncycastle.jce.interfaces.*
import org.bouncycastle.jce.provider.BouncyCastleProvider
import org.bouncycastle.jce.spec.ECNamedCurveParameterSpec
import static org.bouncycastle.jce.provider.BouncyCastleProvider.PROVIDER_NAME
// only for Groovy 2.5.0+
// import static org.codehaus.groovy.runtime.EncodingGroovyMethods.encodeBase64Url
import org.slf4j.*
import static spark.Spark.*
import spark.*

log = LoggerFactory.getLogger('webpush')
client = null

def encodeBase64Url = { b ->
  b.encodeBase64().toString().tr('+/', '-_').replaceAll('=', '')
}
def getKeyPair = {
  keyPairGenerator = KeyPairGenerator.getInstance('ECDH', 'BC')
  keyPairGenerator.initialize(ECNamedCurveTable.getParameterSpec('prime256v1'));
  keyPairGenerator.generateKeyPair()
}

Security.addProvider(new BouncyCastleProvider())
// publicKey = 'BEP_ZoQru9-tANXmoIr2CngcSiynw6QusQDAMCXvo9IJFI6mwV4SPNp2aWZu3gG1pEQ2yWzAFGQLLitT_6VrNkg'
// privateKey = '-JzcZu0jSgUeW2rv6cyfWh4q_OXr_DhF7-rDRXNEmgk'

keyPair = getKeyPair()
publicKey = encodeBase64Url(Utils.savePublicKey((ECPublicKey) keyPair.getPublic()))
privateKey = encodeBase64Url(Utils.savePrivateKey((ECPrivateKey) keyPair.getPrivate()))
println("publicKey:${publicKey}, privateKey:${privateKey}")

staticFiles.externalLocation(Paths.get('.').toRealPath().toString())
get('/publicKey', { req, res ->
  log.info('called getPublicKey:{}', publicKey)
  publicKey
    });
post('/subscribe', { req, res ->
  client = new JsonSlurper().parseText(req.body())
  log.info('endpoint:{},key:{},auth:{}',
           client.notificationEndPoint, client.publicKey, client.auth)
  res.status(204)
  ''
     });
post('/push', { req, res ->
  push = new PushService(publicKey, privateKey, "http://localhost")
  response = push.send(
    new Notification(client.notificationEndPoint, client.publicKey, client.auth,
                     req.body().bytes))
  log.info('response:{}', response)
  return response.toString()
     });
