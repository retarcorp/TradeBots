const Mongo = require('./Mongo');
const CONSTANTS = require('../constants');
const binanceAPI = require('binance-api-node').default

module.exports = {
  updateSymbolsList : () => {
    let client = binanceAPI({
  	apiKey: 'UR86Pb7vTMdqZraNTg4yVGojzLeKRcEGVR5x4TR1uA043pY3wdKTrVr2c0omIxA4',
  	apiSecret: 'hfH8xnJ7TtJVfTsCvuHbTSz3Xcx93HZU6tLg6yiB2al7EcxG87K0G6Aen8vKWoVf'
		})
		return new Promise( (resolve, reject) => {
			client.prices().then(data => {
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
				Mongo.update({},obj,CONSTANTS.SYMBOLS_LIST_COLLECTION, (data, err) => {
					if(err) reject(err)
					resolve(data)
				})
			})
		})
  }
}
