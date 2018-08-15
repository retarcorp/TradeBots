let BotSettings = require('./BotSettings');
let Order = require('./Order');
const Crypto = require('../modules/Crypto');
let binanceAPI = require('binance-api-node').default;

const CONSTANTS = require('../constants');

module.exports = class Bot {
	constructor({
		title = 'Untitled bot',
		state = CONSTANTS.BOT_STATE.MANUAL,
		status = CONSTANTS.BOT_STATUS.INACTIVE,
		botFreeze = CONSTANTS.BOT_FREEZE_STATUS.INACTIVE,
		botID = String(Date.now()),
		pair = '',
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
	}

	async changeStatus(nextStatus, user) {
		this.status = nextStatus;
		if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) {
			console.log('АКТИВ')
			let key = Crypto.decipher(user.binanceAPI.key,  Crypto.getKey(user.regDate, user.name))
			let secret = Crypto.decipher(user.binanceAPI.secret,  Crypto.getKey(user.regDate, user.name))
			this.Client = binanceAPI({
				apiKey: key,
				apiSecret: secret
			})
			if(this.state === CONSTANTS.BOT_STATE.MANUAL) {
				// this.Client.orderTest({
				// 	symbol: this.pair,
				// 	side: 'BUY',
				// 	quantity: Number(this.amount),
				// 	price: Number(this.initialOrder)
				// })
				// .then(data => {
				// 	this.currentOrder = new Order({
				// 		pair: this.pair,
				// 		amount: this.botSettings.amount,
				// 		price: Number(this.botSettings.initialOrder),
				// 		data: data//`new order: ${this.pair} - ${this.botSettings.initialOrder}, amount - ${this.botSettings.amount}, from bot ${this.title}(${this.botID})`
				// 	})
				// 	this.orders.push(this.currentOrder)
				// })
				// .catch(error => console.log(error))
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