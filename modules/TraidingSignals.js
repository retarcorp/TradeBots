const TIMEFRAME = require('../constants').TIMEFRAME;
const TRANSACTION_TERMS = require('../constants').TRANSACTION_TERMS;
module.exports = class TraidingSignals {
	constructor(
		termsOfATransaction = TRANSACTION_TERMS.BUY, 
		timeframe = TIMEFRAME.M1
	) {
		this.termsOfATransaction = termsOfATransaction;
		this.timeframe = timeframe;
	}
};

/*
var TraidingSignals = {
	TermsOfATransaction: number,
	Timeframe: string
}
*/