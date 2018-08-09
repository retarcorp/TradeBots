let BotSettings = require('./BotSettings');
let Pair = require('./Pair');
let Order = require('./Order');

const CONSTANTS = require('../constants');

module.exports = class Bot {
	constructor({
		title = 'New Trade Bot',
		state = CONSTANTS.BOT_STATE.HAND,
		status = CONSTANTS.BOT_STATUS.INACTIVE,
		pair = new Pair(),
		currentOrder = {},
		orders = [],
		botSettings = new BotSettings({})
	}) {
		this.title = title;
		this.state = state;
		this.status = status;
		this.pair = pair;
		this.orders = orders;
		this.currentOrder = currentOrder;
		this.botSettings = botSettings;
		this.botID = Date.now();
	}
}
/*
{
	title: string,
	state: number[0,1],
	status: number[0,1,2],
	pair: Pair,
	orders: [Order],
	currentOrder: Order,
	settings: BotSettings
}
*/