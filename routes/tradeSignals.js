let express = require('express');
let Mongo = require('../modules/Mongo');
const CONSTANTS = require('../constants')
var router = express.Router();

router.get('/api/tradeSignals/getData', (req, res, next) => {
	console.log('get')
	Mongo.select({}, CONSTANTS.TRADING_SIGNALS_COLLECTION, data => {
		setTimeout(() => { res.send(data) }, 1000)
	})
})

router.post('/api/tradeSignals/postData', (req, res, next) => {
	let data = req.body
	Mongo.updateMany({}, data, CONSTANTS.TRADING_SIGNALS_COLLECTION, data => {
		res.send({
			status: 'ok',
			data: data
		})
	})
})
/*
setTimeout(() => {res.send({
			status: 'ok',
			data: data
		})}, 10000)
		*/

module.exports = router;