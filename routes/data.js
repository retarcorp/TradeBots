var express = require('express');
var router = express.Router();
var CoinMarketCap = require('../modules/CoinMarketCap');

router.get('/api/data/getUSDPrices', (req, res, next) => {
	CoinMarketCap.getUSDPrices(data => res.json(data));
});

module.exports = router;