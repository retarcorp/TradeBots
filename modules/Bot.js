let BotSettings = require('./BotSettings')
let Order = require('./Order')
let Pair = require('./Pair')
const Crypto = require('../modules/Crypto')
let binanceAPI = require('binance-api-node').default
const WSS = require('./WSS')
let Mongo = require('./Mongo')

const CONSTANTS = require('../constants')

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
		this.title = title
		this.state = state
		this.status = status
		this.botFreeze = botFreeze
		this.pair = new Pair(pair.from, pair.to)
		this.orders = orders
		this.currentOrder = currentOrder
		this.safeOrders = []
		this.botSettings = new BotSettings(botSettings)
		this.botID = botID
	}

	async changeStatus(nextStatus, user) {
		this.status = nextStatus;
		if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) {
			console.log('АКТИВ')
			if(this.state === CONSTANTS.BOT_STATE.MANUAL) {
				this.startManual(user)
			}
			else if(this.state === CONSTANTS.BOT_STATE.AUTO) {
				this.startAuto(user)
			}
			else {
				console.log('ЧТО-ТО ПОШЛО НЕ ТАК, ВЫКЛ')
				this.status = CONSTANTS.BOT_STATUS.INACTIVE
			}
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

	startManual(user) {
		console.log('startManual')
		let key = Crypto.decipher(user.binanceAPI.key,  Crypto.getKey(user.regDate, user.name))
		let secret = Crypto.decipher(user.binanceAPI.secret,  Crypto.getKey(user.regDate, user.name))
		this.Client = binanceAPI({
			apiKey: key,
			apiSecret: secret
		})
		this.currentOrder = {}
		this.startTrade(user)
		.catch((err) => console.log(err))
		
	}

	startAuto(userUD, user) {
		console.log('startAuto')
	}

	async startTrade(user) {
		console.log('startTrade')
		let pair = this.pair.from + this.pair.to
		//TODO 
		//1. создание ордера по начальным параметрам
		//2. создание страховочных ордеров
		//3. выставить ордер на продажу так, чтобы выйти в профит по takeProffit
		//4. запуск цикла проверки статуса цены валюты 
		//5. проверка и описание решений исходов
		//end

		//1. создание ордера по начальным параметрам
		let price = await this.Client.allBookTickers()
		price = Number(price[pair].bidPrice)
		console.log(price)
		let quantity = Math.ceil((Number(this.botSettings.initialOrder) / price)*100) /100
		let newOrderParams = {
			symbol: pair,
			quantity: quantity,
			type: CONSTANTS.ORDER_TYPE.MARKET,
			side: 'BUY'
			// price: price
		}
		console.log('-----')
		let newBuyOrder = await this.Client.order(newOrderParams)
		console.log(newBuyOrder)
		this.orders.push(new Order(newBuyOrder))
		//2. создание страховочных ордеров
		let deviation = Number(this.botSettings.deviation) / 100,
			amout = Number(this.botSettings.safeOrder.amount),
			currentPrice = price,
			safeOrders = [],
			decimal = String(price).length - 2
		// for(let i = 0; i < amout; i++) {
		// 	currentPrice -=  currentPrice * deviation
		// 	currentPrice = Number(currentPrice.toFixed(decimal))
		// 	let orderParams = {
		// 		symbol: pair,
		// 		quantity: quantity,
		// 		side: 'BUY',
		// 		price: currentPrice
		// 	}
		// 	console.log('---')
		// 	console.log(orderParams)
		// 	let newOrder = await this.Client.orderTest(orderParams)
		// 	console.log(newOrder)
		// 	safeOrders.push(orderParams)
		// }
		// this.safeOrders.push(...safeOrders)
		// this.orders.push(...safeOrders)
		/*
			тут нужно добавить создание new Order и запихнть в базу данных массив safeOrders
		*/

		//3. выставить ордер на продажу так, чтобы выйти в профит по takeProffit

		let takeProfit = (Number(this.botSettings.takeProfit) + CONSTANTS.BINANCE_FEE) / 100,
			profitPrice = Number((price + price * takeProfit).toFixed(decimal)),
			orderParams = {
				symbol: pair,
				quantity: quantity,
				side: 'SELL',
				price: profitPrice,
				type: 'TAKE_PROFIT_LIMIT',
				stopPrice: profitPrice
			}
		console.log('---')
		console.log(orderParams)
		let newSellOrder = await this.Client.order(orderParams)
		this.currentOrder = new Order(newSellOrder)
		this.orders.push(this.currentOrder)
		console.log(newSellOrder)


		//4. запуск цикла проверки статуса цены валюты 
		// Сделать интервал, сохранить его куда нибудь для возможности выключения
		// или сделать рекурсивную функцию
		// значит, далее нужно .. хм.. чекать статусы ордера на продажу и страховочных
		// если 1 - ордер на продажу завершен - закрыть все страховочные ордера и начать все сначала
		// если 2 - ордер на продажу не завершен и сработал один из страховочных:
		// пересчитать quantity, так как была еще куплена валюта
		// пересчитать еще ченить 
		// пересоздать takeProfit ордер и начать продолжить слежку

		this.trade(user)
		.catch(err => {
			console.log(err)
		})

		/*!!! при любых изменениях сохранять в бд и отсылать юзеру измененную инфу !!!*/
	}

	async trade(user) {
		console.log('trade is going')
		let pair = this.pair.from + this.pair.to,
			currentSellOrder = await this.Client.getOrder({
				symbol: pair,
				orderId: this.currentOrder.orderId
			})
		console.log(currentSellOrder)
		// ордер завершен
		if(currentSellOrder.status === CONSTANTS.ORDER_STATUS.FILLED) {
			console.log('ЗАВЕРШЕНО')
			// for(let i = 0; i < this.safeOrders.length; i++) {
			// 	let order = this.safeOrders[i]
			// 	let Order = await this.Client.getOrder({
			// 		symbol: pair,
			// 		orderId: order.orderId
			// 	})
			// 	// if(Order.side === CONSTANTS.ORDER_SIDE.BUY) {
			// 	console.log(this.Client.cancelOrder({
			// 		symbol: pair,
			// 		orderId: Order.orderId
			// 	})
			// 	.catch(err => {
			// 		this.status = CONSTANTS.BOT_STATUS.INACTIVE
			// 	}))
			// 	// }	
			// }

			this.status = CONSTANTS.BOT_STATUS.INACTIVE
			this.updateBot(user)
		}
		else if( // ошибка ордера
			currentSellOrder.status === CONSTANTS.ORDER_STATUS.CANCELED || 
			currentSellOrder.status === CONSTANTS.ORDER_STATUS.PENDING_CANCEL ||
			currentSellOrder.status === CONSTANTS.ORDER_STATUS.REJECTED || 
			currentSellOrder.status === CONSTANTS.ORDER_STATUS.EXPIRED
		) {
			console.log('ОШИБКА')
			this.status = CONSTANTS.BOT_STATUS.INACTIVE
			this.updateBot(user)
		}
		else { // ордер в процессе
			console.log('В ПРОЦЕССЕ')
			let price = await this.Client.allBookTickers()
			price = Number(price[pair].bidPrice)
			// let firstSafeOrder = this.orders[0]
			// for(let i = 0; i < this.safeOrders.length; i++) {
			// 	let order = this.safeOrders[i],
			// 		Order = await this.Client.getOrder({
			// 			symbol: pair,
			// 			orderId: order[i].orderId
			// 		})
			// 	if(
			// 		(Number(Order.price) >= price && 
			// 		Order.side === CONSTANTS.ORDER_SIDE.BUY) || 
			// 		Order.status === CONSTANTS.ORDER_STATUS.FILLED
			// 	) {
			// 		//Пересчитать 
			// 		break
			// 	}
			// }
			this.updateBot(user)
			let t = this
			setTimeout(() => t.trade(user), 10000)
			
		}
	}

	updateBot(user) {
		user = { name: user.name }
		Mongo.select(user, 'users', (data) => {
			data = data[0]
			let tempBot = new Bot(this)
			const index = data.bots.findIndex(bot => {
				return bot.botID === tempBot.botID
			})
			data.bots[index] = tempBot
			Mongo.update({name: data.name}, data, 'users', data => console.log(data))
		})
	}
}