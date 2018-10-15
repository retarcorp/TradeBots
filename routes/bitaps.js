const express = require('express');
const router = express.Router();
const url = require('url');
const qrs = require('querystring');
const Bitaps = require('../modules/Bitaps');

router.post('/api/bitaps/addBalance', (req, res, next) => {
	const query = qrs.parse(url.parse(req.url).query);

	Bitaps.addBalance(query, req.body, data => res.send(data));
});


module.exports = router;