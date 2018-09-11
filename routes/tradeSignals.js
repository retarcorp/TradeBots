let express = require('express');
let Mongo = require('../modules/Mongo');
const CONSTANTS = require('../constants')
var router = express.Router();

router.get('/api/tradeSignals/getData', (req, res, next) => {
	console.log('/api/tradeSignals/getData')
	Mongo.select({}, CONSTANTS.TRADING_SIGNALS_COLLECTION, data => {
		setTimeout(() => { res.send(data) }, 5000)
	})
})

router.post('/api/tradeSignals/postData', (req, res, next) => {
	console.log('/api/tradeSignals/postData')
	let data = req.body
	Mongo.updateMany({}, data, CONSTANTS.TRADING_SIGNALS_COLLECTION, data => {
		setTimeout(() => {
			res.send({
				status: 'ok',
				data: data
			})
		}, 5000)
	})
})
module.exports = router;