let BotSettings = require('./BotSettings');
let Pair = require('./Pair');
let Order = require('./Order');

const CONSTANTS = require('../constants');

module.exports = class Bot {
	constructor({
		title = 'Untitled bot',
		state = CONSTANTS.BOT_STATE.MANUAL,
		status = CONSTANTS.BOT_STATUS.INACTIVE,
		botID = String(Date.now()),
		pair = {},
		currentOrder = null,
		orders = [],
		botSettings = {}
	}) {
		this.title = title;
		this.state = state;
		this.status = status;
		this.pair = new Pair(pair.from, pair.to);
		this.orders = orders;
		this.currentOrder = currentOrder;
		console.log('____________________')
		console.log(botSettings)
		this.botSettings = new BotSettings(botSettings);
		this.botID = botID;
		this.volumeLimit = [CONSTANTS.getVolumeLimit(this.pair.from), CONSTANTS.getVolumeLimit(this.pair.to)];
	}

	changeStatus() {
		this.status = Number(this.status);
		if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) {
			if(this.currentOrder) {

			}
			else {
				this.currentOrder = new Order({
					pair: this.pair,
					price: this.botSettings.initialOrder
				});
				this.orders.push
			}
		}
		else if(this.status === CONSTANTS.BOT_STATUS.INACTIVE) {

		}
		else if(this.status === CONSTANTS.BOT_STATUS.FROZEN) {

		}
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