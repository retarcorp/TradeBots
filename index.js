var express = require('express');
var bodyParser = require('body-parser');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser');

//Modules
const Mongo = require('./modules/Mongo').init();
const Users = require('./modules/Users');
const Crypto = require('./modules/Crypto');
const Binance = require('./modules/Binance');
const Bot = require('./modules/Bot');
const binanceAPI = require('node-binance-api');

//Routers
var authorization = require('./routes/authorization');
var registration = require('./routes/registration');
var bots = require('./routes/bots');
var account = require('./routes/account');
var index = require('./routes/index');
var incomes = require('./routes/incomes');
var statistics = require('./routes/statistics');

var app = express();

app.use(cookieParser());
app.use(expressSession({secret: 'kitty secret'}));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.disable('x-powered-by');

app.set('port', process.env.PORT || 8072);

app.get('/test', (req, res, next) => {
	// let b = binanceAPI().options({
	// 	APIKEY: 'asd',
	// 	APISECRET: 'zc',
	// 	useServerTime: true, 
	// 	test: true
	// })
	// let a = b;
	// //new Binance('name', 'UmPrRZJ6MRIRAwKqChcSpC4dkm1MMlX19a2S9tfipEW2Efmos7jzCvxIDUgFUTyw', 'EbbvZhDI8TuOs1nJqQzqtoSDSzCuCrPmeMfMlTtiZiQdxTYV0vtKgr9phylXdkH8');
	// a.prices('BNBBTC', (error, ticker) => {
	// 	console.log("Price of BNB: ", ticker.BNBBTC);
	// });
	let user = {name: req.cookies.user.name};
	Mongo.select(user, 'users', data => {
		data = data[0];
		var a = Crypto.decipher(data.binanceAPI.key,  Crypto.getKey(data.regDate, data.name));
		var b = Crypto.decipher(data.binanceAPI.secret,  Crypto.getKey(data.regDate, data.name));
		let binance = binanceAPI().options({
			APIKEY: a,
			APISECRET: b,
			useServerTime: true, 
 			test: true
		})

		// bin.prices('BNBBTC', (error, ticker) => {
		// 	console.log("Price of BNB: ", ticker.BNBBTC);
		// });
		// binance.trades("SNMBTC", (error, trades, symbol) => {
		// 	console.log(symbol+" trade history", trades);
		// });
		var quantity = 1;
		binance.prices(function(error, ticker) {
			console.log("prices()", ticker);
			console.log("Price of BNB: ", ticker.BNBBTC);
		});

		res.send(data);
	})
});

app.get('/', index);
app.get('/bots', bots);
app.post('/bots-add', bots);
app.get('/account', account);
app.post('/account/api', account);
app.delete('/account/api', account);
app.get('/authorization', authorization);
app.get('/logout', authorization);
app.post('/authorization', authorization);
app.get('/registration', registration);
app.get('/incomes', incomes);
app.get('/statistics', statistics);



// пользовательская страница 404 
app.use(function(req, res){        
	res.status(404);        
	res.sendFile('404.html', {root: 'public/'}); 
});

// пользовательская страница 500 
app.use(function(err, req, res, next){        
	console.error(err.stack);        
	res.status(500);        
	res.sendFile('500.html', {root: 'public/'});  
}); 

app.listen(app.get('port'), () => {
	console.log(`server start at port ::${app.get('port')}`);
});