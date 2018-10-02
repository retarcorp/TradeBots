const TIMEFRAME = require('../constants').TIMEFRAME;
const TRANSACTION_TERMS = require('../constants').TRANSACTION_TERMS;
const md5 = require('md5')
module.exports = class TradingSignals {
	constructor(
		{
			symbol = '',
			signal = 'Tradingview',
			timeframe = TIMEFRAME.M1,
			checkRating = TRANSACTION_TERMS.BUY
		}, id = md5(symbol + timeframe + checkRating + signal + (Math.random() * (new Date).getMilliseconds())/Math.random())
	) {
		this.signal = signal
		this.symbol = symbol
		this.rating = ''
		this.checkRating = checkRating
		this.timeframe = timeframe
		this.id = id
	}
}