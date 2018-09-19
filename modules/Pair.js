const VOLUME_LIMIT = require('../constants').VOLUME_LIMIT;

module.exports = class Pair {
	constructor(
		from = VOLUME_LIMIT.BTC.NAME,
		to = VOLUME_LIMIT.ETH.NAME,
		requested = []
	) {
		this.from = from;
		this.to = to;
		this.requested = [...new Set(requested)]
	}
}