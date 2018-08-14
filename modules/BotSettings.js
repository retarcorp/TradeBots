let Martingale = require('./Martingale');
let SafeOrder = require('./SafeOrder');
let TradingSignals = require('./TradingSignals');

module.exports = class BotSettings {
	constructor({
		tradingSignals = [],//new TraidingSignals(),
		initialOrder = null, //volumeLimit.VALUE,
		dailyVolumeBTC = null,
		safeOrder = null, //new SafeOrder(initialOrder, 1),
		deviation = null,
		martingale = null, //new Martingale(),
		maxOpenSafetyOrders = null,
		takeProffit = null,
		stopLoss = null
	}) {
		this.tradngSignals = tradingSignals;
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