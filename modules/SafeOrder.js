const VOLUME_LIMIT = require('../constants').VOLUME_LIMIT;
module.exports = class SafeOrder {
	constructor(size = VOLUME_LIMIT.BTC.VALUE, amount = 1) {
		this.size = size;
		this.amount = amount;
	}
}
/*
var SafeOrder = {
	Size: number,
	Amount: number
}
*/