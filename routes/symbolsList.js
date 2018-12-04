const express = require('express');
const router = express.Router();
const Mongo = require('../modules/Mongo');
const CONSTANTS = require('../constants');
const Symbols = require('../modules/Symbols');

router.get('/api/symbol/list', (req, res, next) => {
	let date = new Date().getDate();
	if( date === 12 || date === 28) {
	Symbols.updateSymbolsList()
	.then((data) => {
		Mongo.select({}, CONSTANTS.SYMBOLS_LIST_COLLECTION, (data) => {
		data = data[0]
		res.send(JSON.stringify({status: 'ok', data: data}))
		})
	})
	} else {
	Mongo.select({}, CONSTANTS.SYMBOLS_LIST_COLLECTION, (data) => {
		data = data[0]
		res.send({status: 'ok', data: data})
	})
	}
});

module.exports = router;
