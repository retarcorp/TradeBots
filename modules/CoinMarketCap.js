const CoinMarketCapAPI = require('coinmarketcap-api');
const Mongo = require('./Mongo');
const { coinmarketcap } = require('../config/config');
const M = require('./Message');
const DAY = require('../constants').UPDATE_DAYLY;

// client.getTickers().then(data => {
// 	data.data.forEach(t => {
// 		console.log(t);
// 	})
// }).catch(console.error);

class CoinMarketCap {
	constructor() {
		this.Client = new CoinMarketCapAPI(coinmarketcap.apiKey);
	}

	async dailyUpdatePrices() {
		let tickers = await this.Client.getTickers();	
		if(!tickers.status.error_code) {
			tickers = tickers.data;
			
			let change = {
				id: 123,
				tickers: []
			};

			tickers.forEach(tick => {
				let ps = {
					symbol: tick.symbol,
					USDPrice: tick.quote.USD.price
				}
				change.tickers.push(ps);
			});

			Mongo.update({ id: 123 }, change, coinmarketcap.bd_collection);

		} else {
			console.log(tickers.status);
		}
		setTimeout( () => {
			this.dailyUpdatePrices();
		}, DAY);
	}

	async getUSDPrices(callback = () => {}) {
		let prices = await Mongo.syncSelect({ id: 123 }, coinmarketcap.bd_collection);
		prices = prices[0].tickers;
		callback(M.getSuccessfullyMessage({ data: prices }));
	}
}

/*
{ id: 52,
  name: 'XRP',
  symbol: 'XRP',
  slug: 'ripple',
  circulating_supply: 40205508733,
  total_supply: 99991792688,
  max_supply: 100000000000,
  date_added: '2013-08-04T00:00:00.000Z',
  num_market_pairs: 262,
  cmc_rank: 3,
  last_updated: '2018-11-13T15:03:38.000Z',
  quote:
   { USD:
      { price: 0.52008448925,
        volume_24h: 621883928.657502,
        percent_change_1h: 0.00563836,
        percent_change_24h: 0.332838,
        percent_change_7d: -2.25412,
        market_cap: 20910261474.438717,
        last_updated: '2018-11-13T15:03:38.000Z' } } }
*/

const ret = new CoinMarketCap();

module.exports = ret;