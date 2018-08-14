let express = require('express');
let Mongo = require('../modules/Mongo');
let Users = require('../modules/Users');

var Bot = require('../modules/Bot');
var Pair = require('../modules/Pair');
var SafeOrder = require('../modules/SafeOrder');
var Martingale = require('../modules/Martingale');
var BotSettings = require('../modules/BotSettings');
var TradingSignals = require('../modules/TradingSignals');
var CONSTANTS = require('../constants');

var router = express.Router();

router.get('/bots/getBotsList', (req, res, next) => {
	//TODO: найти пользователя и вернуть массив всех его ботов
	let user = {name: req.cookies.user.name};
	Mongo.select(user, 'users', (data) => {
		data = data[0];
		console.log(data.bots)
		res.json({
			status: 'ok',
			data: data.bots || []
		});
	});
});

router.post('/bots/add', (req, res, next) => {
	let user = {name: req.cookies.user.name};

	Users.setBot(user, req.body, data => res.json(data));

	// Mongo.select(user, 'users', (data) => {
	// 	data = data[0];
	// 	let bot = new Bot(req.body);
	// 	data.bots.push(bot);
	// 	console.log(data.bots)
	// 	Mongo.update({name: data.name}, data, 'users', (data) => {
	// 		res.json({
	// 			status: 'ok',
	// 			data: bot
	// 		});
	// 	});
	// })
});

router.delete('/bots/delete', (req, res, next) => {
	let user = {name: req.cookies.user.name};

	Users.setBot(user, req.body, data => res.json(data));
})

module.exports = router;