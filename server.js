var fs = require('fs');
var express = require('express');
var { Nuxt } = require('nuxt');
var resolve = require('path').resolve;

var rootDir = resolve('.');
var nuxtConfigFile = resolve(rootDir, 'nuxt.config.js');

var app = express();
var bots = require('./routes/bots');

const bodyParser = require('body-parser');
const expressSession = require('express-session');
const cookieParser = require('cookie-parser');

const Mongo = require('./modules/Mongo')
const Users = require('./modules/Users')
Mongo.init()
.then(data => {
	Users.Bots.setBotsArray()
})
// const Users = require('./modules/Users');
// const Crypto = require('./modules/Crypto');
// const Binance = require('./modules/Binance');
// let binanceAPI = require('binance-api-node').default;	

//Routers
var signin = require('./routes/signin');
var signup = require('./routes/signup');
var bots = require('./routes/bots');
var account = require('./routes/account');
var statistics = require('./routes/statistics');

var parse = require('./routes/parse');

var options = {};
if (fs.existsSync(nuxtConfigFile)) {
  options = require(nuxtConfigFile);
}
if (typeof options.rootDir !== 'string') {
  options.rootDir = rootDir;
}
options.dev = false; // Force production mode (no webpack middleware called)

var nuxt = new Nuxt(options);

app.use(cookieParser());
app.use(expressSession({secret: 'kitty secret'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.disable('x-powered-by');

<<<<<<< HEAD
app.use(bots)
app.use(account)
app.use(signin)
app.use(signup)
app.use(statistics)
=======
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', 'http://localhost:8072');
	res.header('Access-Control-Allow-Credentials', 'true')
	next();
})

app.post('/parse', parse)
app.get('/bots/getBotsList', bots)
app.post('/bots/add', bots)
app.post('/bots/delete', bots)
app.post('/bots/update', bots)
app.post('/bots/setStatus', bots)
app.post('/bots/orders/cancel', bots)
app.post('/bots/orders/cancelAll', bots)

app.get('/account/api', account)
app.post('/account/api', account)
app.delete('/account/api', account)

app.get('/signin', signin)
app.post('/signin', signin)
app.get('/signout', signin)
app.post('/signup', signup)

app.get('/bots/getBotsList', bots)
app.get('/statistics', statistics)

app.get('/test', (req, res, next) => {
	let c = binanceAPI({
		apiKey: 'pMK15sHEO3jS9RE9x4KA5zFfdxCKcxk9gDgyf4BhvGrhvEUn3wiZMTYcuqLEAkNh',
		apiSecret: 'A7pvWxoe0JzHfM1rvF7D2ymM3ZFUvdlOyLRmjeZ7m4gfCWaTOmLBwHcwMUSw3Znp'
	})
	c.exchangeInfo().then( data => console.log(data.rateLimits))
	res.send('lol')
})
>>>>>>> parse

app.use(nuxt.render);
app.listen(process.env.PORT || 8072);
