let BotSettings = require('./BotSettings');
let Pair = require('./Pair');
let Order = require('./Order');
let binanceAPI = require('binance-api-node');

const CONSTANTS = require('../constants');

module.exports = class Bot {
	constructor({
		title = 'Untitled bot',
		state = CONSTANTS.BOT_STATE.MANUAL,
		status = CONSTANTS.BOT_STATUS.INACTIVE,
		botFreeze = CONSTANTS.BOT_FREEZE_STATUS.INACTIVE,
		botID = String(Date.now()),
		pair = {},
		currentOrder = null,
		orders = [],
		botSettings = {}
	}) {
		this.title = title;
		this.state = state;
		this.status = status;
		this.botFreeze = botFreeze;
		this.pair = pair;//new Pair(pair.from, pair.to);
		this.orders = orders;
		this.currentOrder = currentOrder;
		this.botSettings = new BotSettings(botSettings);
		this.botID = botID;
		this.volumeLimit = [CONSTANTS.getVolumeLimit(this.pair.from), CONSTANTS.getVolumeLimit(this.pair.to)];
	}

	changeStatus(nextStatus) {
		this.status = nextStatus;
		if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) {
			console.log('АКТИВ')
			console.log(typeof CONSTANTS.BOT_STATE.MANUAL, typeof this.state, typeof CONSTANTS.BOT_STATE.MANUAL)
			if(this.state === CONSTANTS.BOT_STATE.MANUAL) {
				console.log('initialamount = ',this.botSettings.initialAmount)
				this.currentOrder = new Order({
					pair: this.pair,
					amount: this.botSettings.initialAmount,
					price: Number(this.botSettings.initialOrder),
					data: `new order: ${this.pair} - ${this.botSettings.initialOrder}, amount - ${this.botSettings.initialAmount}, from bot ${this.title}(${this.botID})`
				})
				console.log(this.currentOrder)
			}
			else if(this.state === CONSTANTS.BOT_STATE.AUTO) {

			}
			else {
				console.log('ЧТО-ТО ПОШЛО НЕ ТАК, ВЫКЛ')
				this.status = CONSTANTS.BOT_STATUS.INACTIVE
			}
		}
		else if(this.status === CONSTANTS.BOT_STATUS.INACTIVE) {
			console.log('ИНАКТИВ')
			this.currentOrder = null;
		}
		else {
			console.log('ЧТО-ТО НЕ ТО, ВЫКЛЮЧЕНИЕ')
			this.status = CONSTANTS.BOT_STATUS.INACTIVE;
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