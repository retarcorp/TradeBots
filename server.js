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

const Core = require('./monitor/modules/core');

const bodyParser = require('body-parser');
const expressSession = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const Mongo = require('./modules/Mongo');
const Users = require('./modules/Users');

let Symbols = require('./modules/Symbols');
let Income = require('./modules/Income');
const CoinMarketCap = require('./modules/CoinMarketCap');
const LoggerViewer = require('./modules/LoggerViewer');
Mongo.init()
	.then(async data => {
		Users.Bots.setBotsArray().then(result => {
			Income.startLiveUpdate();
		})
		await Symbols.initClient();
		Symbols.updateSymbolsPriceFilter();
		// Symbols.updateSymbolsPricesList();
		Symbols.updateSymbolsList();
		CoinMarketCap.dailyUpdatePrices();
		LoggerViewer.syncLogData();
		
		Core.init();
	});

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

app.use(cookieParser());
app.use(expressSession({secret: 'kitty secret'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.disable('x-powered-by');


app.use(routers)
app.use(nuxt.render);

// https.createServer(SSL, app).listen(8072);

app.listen(process.env.PORT || 8072);

