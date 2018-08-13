var express = require('express');
var Mongo = require('../modules/Mongo');

var Bot = require('../modules/Bot');
var Pair = require('../modules/Pair');
var SafeOrder = require('../modules/SafeOrder');
var Martingale = require('../modules/Martingale');
var BotSettings = require('../modules/BotSettings');
var TraidingSignals = require('../modules/TraidingSignals');
var CONSTANTS = require('../constants');

var router = express.Router();

router.get('/bots/getBotsList', (req, res, next) => {
	//TODO: найти пользователя и вернуть массив всех его ботов
	let user = {name: req.cookies.user.name};
	Mongo.select(user, 'users', (data) => {
		console.log(data.bots)
		res.json({
			status: 'ok',
			data: data.bots
		});

	});
});

router.post('/bots/add', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	Mongo.select(user, 'users', (data) => {
		data = data[0];
		let bot = new Bot(req.body);
		data.bots.push(bot);
		Mongo.update({name: data.name}, data, 'users', (data) => {
			res.json({
				status: 'ok',
				data: bot
			});
		});
	})


});

module.exports = router;