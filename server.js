var fs = require('fs');
var express = require('express');
var { Nuxt, Builder } = require('nuxt');
var resolve = require('path').resolve;
var http = require('http');

var rootDir = resolve('.');
var nuxtConfigFile = resolve(rootDir, 'nuxt.config.js');

var app = express();
var bots = require('./routes/bots');

const bodyParser = require('body-parser');
const expressSession = require('express-session');
const cookieParser = require('cookie-parser');

const Mongo = require('./modules/Mongo').init();
const Users = require('./modules/Users');
const Crypto = require('./modules/Crypto');
const Binance = require('./modules/Binance');
let binanceAPI = require('binance-api-node').default;

//Routers
var signin = require('./routes/signin');
var signup = require('./routes/signup');
var bots = require('./routes/bots');
var account = require('./routes/account');
var index = require('./routes/index');
var incomes = require('./routes/incomes');
var statistics = require('./routes/statistics');

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
//app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.disable('x-powered-by');

// app.get('/', index)

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

//app.get('/incomes', incomes)
app.get('/bots/getBotsList', bots)
app.get('/statistics', statistics)

app.use(nuxt.render);


app.listen(process.env.PORT || 8072);

//new Builder(nuxt).build();
//nuxt.listen(process.env.PORT);

/*new nuxt.Server(nuxt)
  .listen(
    process.env.PORT || process.env.npm_package_config_nuxt_port,
    process.env.HOST || process.env.npm_package_config_nuxt_host
)*/