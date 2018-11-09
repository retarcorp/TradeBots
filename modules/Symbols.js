const Mongo = require('./Mongo');
const CONSTANTS = require('../constants');
const binanceAPI = require('binance-api-node').default;
const HistoryLog = require('./HistoryLog');
const _log = (data) => HistoryLog._log(data);

var Symbols = {
	Client: null,

	initClient: function() {
		this.Client = binanceAPI({
			apiKey: '',
			apiSecret: ''
		})
	},

  updateSymbolsList: function() {
		return new Promise( (resolve, reject) => {
			this.Client.prices()
			.then(data => {
				let obj = {
					BNB:[],
					BTC:[],
					ETH:[],
					USDT:[]
				}
				for(let key in data) {
					key.match(/ETH$/) ? obj.ETH.push(key.slice(0,-3)) : null;
					key.match(/BTC$/) ? obj.BTC.push(key.slice(0,-3)) : null;
					key.match(/BNB$/) ? obj.BNB.push(key.slice(0,-3)) : null;
					key.match(/USDT$/) ? obj.USDT.push(key.slice(0,-4)) : null
				}
				Mongo.update({}, obj, CONSTANTS.SYMBOLS_LIST_COLLECTION, (data, err) => {
					if(err) reject(err)
					resolve(data)
				})
			})
		})
	},

	getSymbolsPriceFilter: function() {
		return new Promise( (resolve, reject) => {
			Mongo.select({}, CONSTANTS.SYMBOLS_PRICE_FILTER_COLLECTION, (data, err) => {
				if(err) reject(err)
				resolve(data[0].symbols)
			}) 
		})
	},

	updateSymbolsPricesList: function() {
		console.log('update SymbolsPriceList');
		return new Promise( (resolve, reject) => {

			this.Client.prices()
				.then(prices => {
					Mongo.update({}, { prices , id: 123 }, CONSTANTS.SYMBOLS_PRICES_COLLECTION);
				})
				.catch(error => {
					_log({ name: 'updateSymbolsPricesList', error: error});
				})
			setTimeout( () => {
				this.updateSymbolsPricesList();
			}, CONSTANTS.UPDATE_DAYLY);
		});
	},
	
	updateSymbolsPriceFilter: function() {
		console.log('update SymbolsPriceFilter')
		return new Promise( (resolve, reject) => {
			this.Client.exchangeInfo()
			.then(data => {
				Mongo.update({}, {symbols: data.symbols, id: 123}, CONSTANTS.SYMBOLS_PRICE_FILTER_COLLECTION, (data, err) => {
					if(err) reject(err)
					resolve(data) 
				})
			})
		})
	},

	getLotSize: async function(_symbol) {
		if(_symbol.length > 4) {
			let symbols = await this.getSymbolsPriceFilter(),
				symbol = symbols.find(elem => elem.symbol === _symbol),
				lotSize = symbol.filters.find(elem => elem.filterType === CONSTANTS.SYMBOLS_FILTERS.LOT_SIZE)
			return Number(lotSize.minQty)
		}
		else {
			return 0.001
		}
	},

	getTickSize: async function(_symbol) {
		let symbols = await this.getSymbolsPriceFilter(),
			symbol = symbols.find(elem => elem.symbol === _symbol),
			lotSize = symbol.filters.find(elem => elem.filterType === CONSTANTS.SYMBOLS_FILTERS.PRICE_FILTER)
		return Number(lotSize.tickSize);
	},

	getMinNotional: async function(_symbol) {
		if(_symbol.length > 4) {
			let symbols = await this.getSymbolsPriceFilter(),
				symbol = symbols.find(elem => elem.symbol === _symbol),
				minNotional = symbol.filters.find(elem => elem.filterType === CONSTANTS.SYMBOLS_FILTERS.MIN_NOTIONAL)

			return Number(minNotional.minNotional)
		}
		else {
			return 0.001
		}
	}
}


module.exports = Symbols
