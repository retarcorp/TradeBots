let Martingale = require('./Martingale');
let SafeOrder = require('./SafeOrder');
let TraidingSignals = require('./TraidingSignals');

module.exports = class BotSettings {
	constructor({
		traidingSignals = [],//new TraidingSignals(),
		initialOrder = null, //volumeLimit.VALUE,
		dailyVolumeBTC = null,
		safeOrder = null, //new SafeOrder(initialOrder, 1),
		deviation = null,
		martingale = null, //new Martingale(),
		maxOpenSafetyOrders = null,
		takeProffit = null,
		stopLoss = null
	}, isObj) {
		this.traidingSignals = traidingSignals;
		this.initialOrder = initialOrder;
		this.safeOrder = new SafeOrder(safeOrder.size, safeOrder.amount);
		this.deviation = deviation / 100;
		this.martingale = new Martingale(martingale.value, martingale.active);
		this.maxOpenSafetyOrders = maxOpenSafetyOrders;
		this.takeProffit = takeProffit / 100;
		this.stopLoss = stopLoss / 100;
		this.dailyVolumeBTC = dailyVolumeBTC;
	}
};