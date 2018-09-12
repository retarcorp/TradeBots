const Mongo = require('./Mongo');
const CONSTANTS = require('../constants');

module.exports = {
  updateSymbolsList : () => {
    let client = binanceAPI({
  	apiKey: 'UR86Pb7vTMdqZraNTg4yVGojzLeKRcEGVR5x4TR1uA043pY3wdKTrVr2c0omIxA4',
  	apiSecret: 'hfH8xnJ7TtJVfTsCvuHbTSz3Xcx93HZU6tLg6yiB2al7EcxG87K0G6Aen8vKWoVf'
  	})
  	client.prices().then(data => {
  		let obj = {
  			bnb:[],
  			btc:[],
  			eth:[],
  			usdt:[]
  		}
  		for(let key in data) {
  			key.match(/ETH$/) ? obj.eth.push(key.slice(0,-3)) : null;
  			key.match(/BTC$/) ? obj.btc.push(key.slice(0,-3)) : null;
  			key.match(/BNB$/) ? obj.bnb.push(key.slice(0,-3)) : null;
  			key.match(/USDT$/) ? obj.usdt.push(key.slice(0,-4)) : null
  		}
  		Mongo.update({},obj,CONSTANTS.SYMBOLS_LIST_COLLECTION,)
  	})
  }
}
