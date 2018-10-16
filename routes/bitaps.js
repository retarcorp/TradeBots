const express = require('express');
const router = express.Router();
const url = require('url');
const qrs = require('querystring');
const Bitaps = require('../modules/Bitaps');
const Balance = require('../modules/Balance');
const HistoryLog = require('../modules/HistoryLog');
const log = (data) => HistoryLog._log(data);

router.post('/api/bitaps/addBalance', (req, res, next) => {
	const query = qrs.parse(url.parse(req.url).query);
	Balance.confirmPayment(query, req.body, data => {
		res.send(data);
		log({
			query: query,
			reqbody: req.body,
			data: data
		});
	});
});

module.exports = router;