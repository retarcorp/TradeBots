const express = require('express');
const router = express.Router();
const CoinMarketCap = require('../modules/CoinMarketCap');
const PricesLimits = require('../modules/PricesLimits');


router.get('/api/data/getUSDPrices', (req, res, next) => {
	CoinMarketCap.getUSDPrices(data => res.json(data));
});

router.get('/api/data/getSymbolsInfo', (req, res, next) => {
	PricesLimits.getPricesLimits(data => res.json(data));
});

module.exports = router;