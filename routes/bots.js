let express = require('express');
let Users = require('../modules/Users');
let HistoryLog = require('../modules/HistoryLog');
var router = express.Router();
const url = require('url');
const qrs = require('querystring');

let log = (data) => HistoryLog._log(data);

router.get('/api/bots/getBotsList', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.getBotList(user, data => {
		// log(data);
		res.json(data);
	});
});

router.get('/api/bots/get', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.get(user, req.body.botID, data => {
		// log(data);
		res.json(data);
	});
});

router.post('/api/bots/add', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.setBot(user, req.body, data => {
		log(data);
		res.json(data);
	});
});

router.post('/api/bots/delete', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.setBot(user, req.body.botID, data => {
		log(data);
		res.json(data);
	});
});

router.post('/api/bots/update', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.updateBot(user, req.body, data => {
		log(data);
		res.json(data);
	});
});

router.post('/api/bots/setStatus', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.setStatus(user, req.body, data => {
		log(data);
		res.json(data);
	});
});

router.post('/api/bots/orders/cancel', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.cancelOrder(user, req.body, data => {
		log(data);
		res.json(data);
	});
});

router.post('/api/bots/orders/cancelAll', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.cancelAllOrders(user, req.body, data => {
		log(data);
		res.json(data);
	});
});

router.post('/api/bots/orders/cancelAllOrders', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.cancelAllOrdersWithoutSell(user, req.body, data => {
		log(data);
		res.json(data);
	});
});

router.post('/api/bots/setFreeze', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.freezeBot(user, req.body, data => {
		log(data);
		res.json(data);
	});
});

router.post('/api/bots/getBotLog', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	Users.Bots.getBotLog(user, req.body, data => {
		res.send(data);
	});
})

module.exports = router;