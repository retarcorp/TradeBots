let Martingale = require('./Martingale');
let SafeOrder = require('./SafeOrder');
let TraidingSignals = require('./TraidingSignals');
const VOLUME_LIMIT = require('../constants').VOLUME_LIMIT;

module.exports = class BotSettings {
	constructor({
		volumeLimit = [VOLUME_LIMIT.BTC, VOLUME_LIMIT.ETH],
		traidingSignals = new TraidingSignals(),
		initialOrder = volumeLimit.VALUE,
		safeOrder = new SafeOrder(initialOrder, 1),
		deviation = 0,
		martingale = new Martingale(),
		maxOpenSafetyOrders = 1,
		takeProffit = 0.5,
		stopLoss = 0.5
	}) {
		this.volumeLimit = volumeLimit;
		this.traidingSignals = traidingSignals;
		this.initialOrder = initialOrder;
		this.safeOrder = safeOrder;
		this.deviation = deviation / 100;
		this.martingale = martingale;
		this.maxOpenSafetyOrders = maxOpenSafetyOrders;
		this.takeProffit = takeProffit / 100;
		this.stopLoss = stopLoss / 100;
	}
};