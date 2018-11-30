const Mongo = require('./Mongo');
const CONSTANTS = require('../constants');

class PricesLimits {
	constructor() {
		this.PRICE_FILTER = 'PRICE_FILTER';
	}
	
	async getPricesLimits(callback = () => {}) {
		Mongo.init().then(async () => {

			let prices = await Mongo.syncSelect({ id: 123 }, CONSTANTS.SYMBOLS_PRICES_COLLECTION);
			prices = prices[0].prices;
			let symbolsData = await Mongo.syncSelect({ id: 123 }, CONSTANTS.SYMBOLS_PRICE_FILTER_COLLECTION);

			symbolsData = symbolsData[0].symbols;
			let pricesLimits = [];
	
			symbolsData.forEach(symbolData => {
				let symbol = symbolData.symbol,
					price = Number(prices[symbol]);
				
				
				let filter = symbolData.filters.find(elem => elem.filterType === this.PRICE_FILTER);
				let tickSize = Number(filter.tickSize) / 1.9999;
	
				let limit = (((price + tickSize) / price - 1) * 100).toFixed(1);
				price = price.toFixed(8);
				tickSize = tickSize.toFixed(8);
				
				// console.log(symbol + '\t' + (price + tickSize).toFixed(8) + '\t' + price.toFixed(8) + '\t' + tickSize.toFixed(8) + '\t' + limit);

				pricesLimits.push({ symbol, price, tickSize, limit})
			} )
			callback({
				status: 'ok',
				data: pricesLimits
			});

		});

	}	

}

let _PricesLimits = new PricesLimits();
_PricesLimits.getPricesLimits(console.log);

module.exports = _PricesLimits;