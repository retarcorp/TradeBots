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
	res.send({status: 'ok'})
	// res.sendFile('bots.html', { root: 'public/'});
});

router.post('/bots/add', (req, res, next) => {
	// console.log(req.body);
	let user = {name: req.cookies.user.name};
	let botParams = {};
	let rb = req.body;
	// TODO: обработать тип бота( авто, ручной),
	// создать объект бота и заполнить его поля,
	// сохранить в бд пользователя
	/*****************************************************************/
	// обработка типа бота
	let pairP = new Pair(rb.pair.from, rb.pair.to);
	
	let volLim = CONSTANTS.VOLUME_LIMIT;
	let vlf, vls;
	Object.keys(volLim).find((currency) => {
		if(volLim[currency].NAME === pairP.from) {
			vlf = volLim[currency];
			return true;
		}
	});
	Object.keys(volLim).forEach((currency) => {
		if(volLim[currency].NAME === pairP.to) {
			vls = volLim[currency];
			return true
		}
	});
	if(rb.state) { // hand bot
		botParams = {
			title: rb.title,
			state: rb.state,
			pair: pairP,
			botSettings: new BotSettings({
				volumeLimit: [vlf, vls],
				initialOrder: rb.initialOrder,
				safeOrder: new SafeOrder(rb.safeOrder.size, rb.safeOrder.amount),
				deviation: rb.deviation,
				maxOpenSafetyOrders: rb.maxOpenSafetyOrders,
				martingale: new Martingale(rb.martingale.value, rb.martingale.active),
				takeProffit: rb.takeProffit,
				stopLoss: rb.stopLoss
			})
		}
	}
	else {         // auto bot
		traidingSignals = rb.traidingSignals.map(elem => {
			return new TraidingSignals(elem.termsOfATransaction, elem.timeframe)
		})
		botParams = {
			title: rb.title,
			state: rb.state,
			pair: pairP,
			botSettings: new BotSettings({
				volumeLimit: [vlf, vls],
				traidingSignals: traidingSignals,
				dailyVolumeBTC: rb.dailyVolumeBTC
			})
		}
	}

	Mongo.select(user, 'users', (data) => {
		data = data[0];
		let bot = new Bot(botParams);
		data.bots.push(bot);
		Mongo.update({name: data.name}, data, 'users', (data) => {
			res.json(bot);
		});
	})

	
});

module.exports = router;