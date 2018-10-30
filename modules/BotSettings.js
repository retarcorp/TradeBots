let Martingale = require('./Martingale')
let SafeOrder = require('./SafeOrder')
let TradingSignals = require('./TradingSignals')
const Symbols = require('./Symbols')

module.exports = class BotSettings {
	constructor({
		tradingSignals = [],//new TraidingSignals(),
		curTradingSignals = [],
		initialOrder = 0, //volumeLimit.VALUE,
		dailyVolumeBTC = 0,
		safeOrder = {}, //new SafeOrder(initialOrder, 1),
		deviation = 0,
		martingale = null, //new Martingale(),
		maxOpenSafetyOrders = 0,
		quantityOfUsedSafeOrders = 0,
		quantityOfActiveSafeOrders = 0,
		takeProfit = 0,
		stopLoss = 0,
		currentOrder = initialOrder,
		maxAmountPairsUsed = 0,
		amountPairsUsed = 0,
		lastSafeOrderPrice = 0,
		firstBuyPrice = 0,
		quantity = 0,
		decimalQty = 0
	}) {
		this.tradingSignals = tradingSignals.map(elem => new TradingSignals(elem));
		this.curTradingSignals = curTradingSignals;
		this.initialOrder = initialOrder;
		this.lastSafeOrderPrice = lastSafeOrderPrice;
		if(safeOrder) 
			this.safeOrder = new SafeOrder(safeOrder.size, safeOrder.amount);
		this.deviation = deviation;
		if(martingale)
			this.martingale = new Martingale(martingale.value, martingale.active);
		this.maxOpenSafetyOrders = maxOpenSafetyOrders;
		this.takeProfit = takeProfit;
		this.stopLoss = stopLoss;
		this.dailyVolumeBTC = dailyVolumeBTC;
		this.currentOrder = currentOrder;
		this.firstBuyPrice = firstBuyPrice;
		this.quantity = quantity; // количество монет
		this.quantityOfUsedSafeOrders = quantityOfUsedSafeOrders;
		this.quantityOfActiveSafeOrders = quantityOfActiveSafeOrders;
		this.decimalQty = decimalQty;
		this.maxAmountPairsUsed = maxAmountPairsUsed;
		this.amountPairsUsed = amountPairsUsed;
	}
}