let Pair = require('./Pair');
let DateInfo = require('./DateInfo');
let binanceAPI = require('binance-api-node');

const ORDER_STATE = require('../constants').ORDER_STATE;

module.exports = class Order {
	constructor({
		pair = '',
		state = ORDER_STATE.OPENED,
		amount = 1,
		price = 0,
		total = amount * price,
		dateInfo = new DateInfo(),
		// data = {
		// 	symbol,
		// 	orderId,
		// 	clientOrderId,
		// 	transactTime,
		// 	price,
		// 	origQty,
		// 	executedQty,
		// 	status,
		// 	timeInForce,
		// 	type,
		// 	side,
		// 	time	
		// },
		orderId = 0
	}) {
		this.pair = pair;
		this.state = state;
		this.amount = amount;
		this.price = price;
		this.total = total;
		this.dateInfo = dateInfo;
		// this.data = data;
	}

	openOrder() {	
		
	}
}
/*
{
	pair: Pair,
	state: number,
	amount: number,
	price: number,
	total: number,
	????status: boolean????,
	dateInfo: DateInfo,
	Data: string
}
*/