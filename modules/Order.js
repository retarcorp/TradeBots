let Pair = require('./Pair');
let DateInfo = require('./DateInfo');

const ORDER_STATE = require('../constants').ORDER_STATE;

module.exports = class Order {
	constructor({
		pair = new Pair(),
		state = ORDER_STATE.OPENED,
		amount = 1,
		price = 0,
		total = amount * price,
		dateInfo = new DateInfo(),
		data = 'new order is created',
		id = Math.ceil(Date.now() * price)
	}) {
		this.pair = pair;
		this.state = state;
		this.amount = amount;
		this.price = price;
		this.total = total;
		this.dateInfo = dateInfo;
		this.data = data;
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