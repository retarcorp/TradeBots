let express = require('express');
let Users = require('../modules/Users');
let HistoryLog = require('../modules/HistoryLog');
var router = express.Router();

let log = (data) => HistoryLog._log(data);

router.get('/bots/getBotsList', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.getBotList(user, data => {
		// log(data);
		res.json(data);
	});
});

router.get('/bots/get', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.get(user, req.body.botID, data => {
		// log(data);
		res.json(data);
	});
});

router.post('/bots/add', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.setBot(user, req.body, data => {
		log(data);
		res.json(data);
	});
});

router.post('/bots/delete', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.setBot(user, req.body.botID, data => {
		log(data);
		res.json(data);
	});
});

router.post('/bots/update', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.updateBot(user, req.body, data => {
		log(data);
		res.json(data);
	});
});

router.post('/bots/setStatus', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.setStatus(user, req.body, data => {
		log(data);
		res.json(data);
	});
});

router.post('/bots/orders/cancel', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.cancelOrder(user, req.body, data => {
		log(data);
		res.json(data);
	});
});

router.post('/bots/orders/cancelAll', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.cancelAllOrders(user, req.body, data => {
		log(data);
		res.json(data);
	});
});

router.post('/bots/orders/cancelAllOrders', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.cancelAllOrdersWithoutSell(user, req.body, data => {
		log(data);
		res.json(data);
	});
});

router.post('/bots/setFreeze', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.freezeBot(user, req.body, data => {
		log(data);
		res.json(data);
	});
});

module.exports = router;