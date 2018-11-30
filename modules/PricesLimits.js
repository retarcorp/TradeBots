// const Mongo = require('./Mongo');
// const CONSTANTS = require('../constants');

// class PricesLimits {
	
// 	async getPricesLimits(callback = () => {}) {
// 		let prices = await Mongo.syncSelect({ id: 123 }, CONSTANTS.SYMBOLS_PRICES_COLLECTION);
// 		prices = prices.prices;
// 		let symbolsData = await Mongo.syncSelect({ id: 123 }, CONSTANTS.SYMBOLS_PRICE_FILTER_COLLECTION)
// 		symbolsData = symbolsData.symbols;

// 		let pricesLimits = [];

// 		symbolsData.forEach(symbolData => {

// 		});


// 	}

// }

// let _PricesLimits = new PricesLimits();

// module.exports = _PricesLimits;