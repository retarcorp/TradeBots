let BotSettings = require('./BotSettings');
let Order = require('./Order');
const Crypto = require('../modules/Crypto');
let binanceAPI = require('binance-api-node').default;
const WSS = require('./WSS');

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

	async changeStatus(nextStatus, userID, user) {
		this.status = nextStatus;
		if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) {
			this.startManual(userID, user)
		}
		else if(this.status === CONSTANTS.BOT_STATUS.INACTIVE) {
			console.log('ИНАКТИВ')
			this.currentOrder = null
		}
		else {
			console.log('ЧТО-ТО НЕ ТО, ВЫКЛЮЧЕНИЕ')
			this.status = CONSTANTS.BOT_STATUS.INACTIVE
		}
	}

	startManual(userID, user) {
		console.log('АКТИВ')
		let key = Crypto.decipher(user.binanceAPI.key,  Crypto.getKey(user.regDate, user.name))
		let secret = Crypto.decipher(user.binanceAPI.secret,  Crypto.getKey(user.regDate, user.name))
		this.Client = binanceAPI({
			apiKey: key,
			apiSecret: secret
		})
		if(this.state === CONSTANTS.BOT_STATE.MANUAL) {
			WSS.users[userID].send('хер ' + userID)
			this.currentOrder = {}
			this.startTrade()
			// this.Client.orderTest({
			// 	symbol: this.pair,
			// 	side: 'BUY',
			// 	quantity: Number(this.botSettings.amount),
			// 	price: Number(this.botSettings.initialOrder)
			// })
			// .then((data) => {
			// 	console.log('это then')
			// 	console.log(data)
			// 	this.currentOrder = new Order({
			// 		pair: this.pair,
			// 		amount: this.botSettings.amount,
			// 		price: this.botSettings.initialOrder	
			// 	})
			// 	this.orders.push(this.currentOrder)
			// })
			.catch((err) => console.log(err))
		}
		else if(this.state === CONSTANTS.BOT_STATE.AUTO) {

		}
		else {
			console.log('ЧТО-ТО ПОШЛО НЕ ТАК, ВЫКЛ')
			this.status = CONSTANTS.BOT_STATUS.INACTIVE
		}
	}

	async startTrade() {
		//TODO 
		//1. создание ордера по начальным параметрам
		//2. создание страховочных ордеров
		//3. запуск цикла проверки статуса цены валюты 
		//4. проверка и описание решений исходов
		//end

		//1
		let price = await this.Client.allBookTickers()
		price = Number(price[this.pair].bidPrice)
		let newOrderParams = {
			symbol: this.pair,
			quantity: Math.ceil( ((Number(this.botSettings.initialOrder) / price)*100)/100 ), //Number(this.botSettings.amount),
			side: 'BUY',
			price: price
		}
		console.log('-----')
		console.log(newOrderParams)
		let newOrder = await this.Client.orderTest(newOrderParams)
		console.log('-----')
		console.log(newOrder)
		console.log('-----')
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