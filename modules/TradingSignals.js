const TIMEFRAME = require('../constants').TIMEFRAME;
const TRANSACTION_TERMS = require('../constants').TRANSACTION_TERMS;
module.exports = class TraidingSignals {
	constructor(
		transactionTerm = TRANSACTION_TERMS.BUY, 
		timeframe = TIMEFRAME.M1
	) {
		this.transactionTerm = transactionTerm;
		this.timeframe = timeframe;
	}
};

/*
var TraidingSignals = {
	TermsOfATransaction: number,
	Timeframe: string
}
*/