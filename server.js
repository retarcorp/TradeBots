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
const cors = require('cors');

const Mongo = require('./modules/Mongo')
const Users = require('./modules/Users')
let Symbols = require('./modules/Symbols')
Mongo.init()
.then(data => {
	Users.Bots.setBotsArray()
	Symbols.initClient()
	Symbols.updateSymbolsPriceFilter()
})
// const Users = require('./modules/Users');
// const Crypto = require('./modules/Crypto');
// const Binance = require('./modules/Binance');
let binanceAPI = require('binance-api-node').default;


//Routers
var signin = require('./routes/signin')
var signup = require('./routes/signup')
var bots = require('./routes/bots')
var account = require('./routes/account')
var statistics = require('./routes/statistics')
var tradeSignals = require('./routes/tradeSignals')
var symbolList = require('./routes/symbolsList')


var options = {};
if (fs.existsSync(nuxtConfigFile)) {
  options = require(nuxtConfigFile);
}
if (typeof options.rootDir !== 'string') {
  options.rootDir = rootDir;
}
options.dev = false; // Force production mode (no webpack middleware called)

var nuxt = new Nuxt(options);
app.use(cors({
  origin: 'chrome-extension://pmjpmhnebaljfhlbhdmpdekpddpimjbh',
  credentials: true
  }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'chrome-extension://pmjpmhnebaljfhlbhdmpdekpddpimjbh');
  res.header('Access-Control-Allow-Credentials', 'true')
  next();
})

app.use(cookieParser());
app.use(expressSession({secret: 'kitty secret'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.disable('x-powered-by');

app.use(bots)
app.use(account)
app.use(signin)
app.use(signup)
app.use(statistics)
app.use(tradeSignals)
app.use(symbolList)

app.get('/test', (req, res, next) => {
	Symbols.updateSymbolsPriceFilter().then(data => res.send(data))
})

app.use(nuxt.render);
app.listen(process.env.PORT || 8072);
