let express = require('express');
let Mongo = require('../modules/Mongo');
let Users = require('../modules/Users');
var router = express.Router();

router.get('/bots/getBotsList', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.getBotList(user, data => res.json(data))
})

router.get('/bots/get', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.get(user, req.body.botID, data => res.json(data))
})

router.post('/bots/add', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.setBot(user, req.body, data => res.json(data))
})

router.post('/bots/delete', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.setBot(user, req.body.botID, data => res.json(data))
})

router.post('/bots/update', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.updateBot(user, req.body, data => res.json(data))
})

router.post('/bots/setStatus', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.setStatus(user, req.body, data => res.json(data))
})

router.post('/bots/orders/cancel', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.cancelOrder(user, req.body, data => res.json(data))
	//отменить ордер
	//botID и orderId
})

router.post('/bots/orders/cancelAll', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.Bots.cancelAllOrders(user, req.body, data => res.json(data))
	//отменить ордер
	//botID
})

module.exports = router;