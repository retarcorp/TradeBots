const TIMEFRAME = require('../constants').TIMEFRAME;
const TRANSACTION_TERMS = require('../constants').TRANSACTION_TERMS;
module.exports = class TraidingSignals {
	constructor(
		symbol = '',
		transactionTerms = TRANSACTION_TERMS.BUY, 
		timeframe = TIMEFRAME.M1
	) {
		this.symbol = symbol
		this.transactionTerms = transactionTerms
		this.timeframe = timeframe
	}
}