var fs = require('fs');
var express = require('express');
var { Nuxt } = require('nuxt');
var resolve = require('path').resolve;

var rootDir = resolve('.');
var nuxtConfigFile = resolve(rootDir, 'nuxt.config.js');

var app = express();
var bots = require('./routes/bots');

var https = require('https');
var SSL = {
  cert: fs.readFileSync("./SSL/td-cert.pem"),
  key: fs.readFileSync("./SSL/td-key.pem")
};

const bodyParser = require('body-parser');
const url = require('url');
const qrs = require('querystring');
const expressSession = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const Mongo = require('./modules/Mongo');
const Users = require('./modules/Users');
const Statistics = require('./modules/Statistics');
const Income = require('./modules/Income');
let Symbols = require('./modules/Symbols')
Mongo.init()
.then(data => {
  Users.Bots.setBotsArray();
  Income.startLiveUpdate();
  // Statistics.updateUsersStatistic();
  // Income.liveUpdateOrders();
	Symbols.initClient();
	Symbols.updateSymbolsPriceFilter();
});
// const Users = require('./modules/Users');
// const Crypto = require('./modules/Crypto');
// const Binance = require('./modules/Binance');
let binanceAPI = require('binance-api-node').default;

//Routers
var routers = require('./routes/routes')

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


app.use(routers)

app.get('/test', (req, res, next) => {
  let user = {name: req.cookies.user.name}
  res.send('test')
  // Mongo.update(user, {bots: []},'users', data => res.send(data))
})

app.use(nuxt.render);

// https.createServer(SSL, app).listen(8072);

app.listen(process.env.PORT || 8072);
