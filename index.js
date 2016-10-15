// Example express application adding the parse-server module to expose Parse
// compatible API routes.


var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');

var braintree = require("braintree");
var gateway = braintree.connect({
    environment: braintree.Environment.Sandbox,
    merchantId: "bt9cmxxgmv9smhng",
    publicKey: "5rsr9yzrgp7ztmbz",
    privateKey: "31e804049ca424d8c0ffcf31cf2a86e5"
});


var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
	databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
   
   
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'myAppId',
  masterKey: process.env.MASTER_KEY || 'test', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://tooliotest.herokuapp.com',  // Don't forget to change to https if needed  //serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',  // 
  liveQuery: {
    classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
  },
  push: {
      android: {
        senderId: '396448347452',
        apiKey: 'AIzaSyBFOOgUxGnlB0CIwTxDwycw0wHD3jM2RS0'
      }//,
      //ios: {
      //    pfx: '', // The filename of private key and certificate in PFX or PKCS12 format from disk  
      //    passphrase: '', // optional password to your p12
      //    cert: '', // If not using the .p12 format, the path to the certificate PEM to load from disk
      //    key: '', // If not using the .p12 format, the path to the private key PEM to load from disk
      //    bundleId: 'co.toolio.app', // The bundle identifier associate with your app
      //    production: false // Specifies which environment to connect to: Production (if true) or Sandbox
      //}
    }
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});

app.get('/me', function (req, res) {
    res.status(200).send('Awesome!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

app.get('/clienttoken', function (req, res) {
    //gateway.clientToken.generate({}, function (err, response) {
    //    res.send(response.clientToken);
    //});
    res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});
//app.post("/checkout", function (req, res) {
//    var nonceFromTheClient = req.body.payment_method_nonce;
    // Use payment method nonce here
//});


var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
