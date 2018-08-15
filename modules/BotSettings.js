let Martingale = require('./Martingale');
let SafeOrder = require('./SafeOrder');
let TradingSignals = require('./TradingSignals');

module.exports = class BotSettings {
	constructor({
		tradingSignals = [],//new TraidingSignals(),
		initialOrder = null, //volumeLimit.VALUE,
		amount = '1',
		dailyVolumeBTC = null,
		safeOrder = null, //new SafeOrder(initialOrder, 1),
		deviation = null,
		martingale = null, //new Martingale(),
		maxOpenSafetyOrders = null,
		takeProffit = null,
		stopLoss = null
	}) {
		this.tradingSignals = tradingSignals;
		this.initialOrder = initialOrder;
		if(safeOrder) 
			this.safeOrder = new SafeOrder(safeOrder.size, safeOrder.amount);
		this.deviation = deviation;
		if(martingale)
			this.martingale = new Martingale(martingale.value, martingale.active);
		this.maxOpenSafetyOrders = maxOpenSafetyOrders;
		this.takeProffit = takeProffit;
		this.stopLoss = stopLoss;
		this.dailyVolumeBTC = dailyVolumeBTC;
		this.initialAmount = amount;
	}
};