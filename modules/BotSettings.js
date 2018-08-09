let Martingale = require('./Martingale');
let SafeOrder = require('./SafeOrder');
let TraidingSignals = require('./TraidingSignals');
const VOLUME_LIMIT = require('../constants').VOLUME_LIMIT;

module.exports = class BotSettings {
	constructor({
		volumeLimit = [VOLUME_LIMIT.BTC, VOLUME_LIMIT.ETH],
		traidingSignals = [],//new TraidingSignals(),
		initialOrder = null, //volumeLimit.VALUE,
		dailyVolumeBTC = null,
		safeOrder = null, //new SafeOrder(initialOrder, 1),
		deviation = null,
		martingale = null, //new Martingale(),
		maxOpenSafetyOrders = null,
		takeProffit = null,
		stopLoss = null
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
		this.dailyVolumeBTC = dailyVolumeBTC;
	}
};