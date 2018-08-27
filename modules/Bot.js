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

	startAuto(user) {
		console.log('startAuto')
	}

	getQuantity(price) {
		return Math.ceil( (Number(this.botSettings.currentOrder) / price) * 100 ) /100
	}
	
	getPair() {
		return this.pair.from + this.pair.to
	}

	getDecimal(price) {
		return String(price).length - 2
	}

	getDeviation() {
		return Number(this.botSettings.deviation) / 100
	}

	getAmount() {
		return Number(this.botSettings.safeOrder.amount)
	}

	getTakeProfit() {
		return (Number(this.botSettings.takeProfit) + CONSTANTS.BINANCE_FEE) / 100
	}

	getProfitPrice(price) {
		price = Number(price)
		let takeProfit = this.getTakeProfit(),
			decimal = this.getDecimal(price),
			profitPrice = price + price * takeProfit
		return this.toDecimal(profitPrice, decimal)
	}
	
	getStopLoss() {
		return Number(this.botSettings.stopLoss) / 100
	}

	getStopPrice() {
		let stopLoss = this.getStopLoss(),
			price = this.botSettings.firstBuyPrice,
			decimal = this.getDecimal(price),
			stopPrice = price - price * stopLoss
		return this.toDecimal(stopPrice, decimal)
	}

	toDecimal(value, decimal) {
		return Number(Number(value).toFixed(decimal))
	}

	async getLastPrice() {
		let pair = this.getPair(),
			// price = await this.Client.allBookTickers()
			price = await this.Client.prices()
		return Number(price[pair])
	}

	async newBuyOrder(price, quantity = 0, type = CONSTANTS.ORDER_TYPE.LIMIT) {
		console.log(`new BUY order (${price})...`)
		quantity = quantity ? Number(quantity) : this.getQuantity(price)
		let pair = this.getPair(),
			newOrderParams = {}
		console.log(`quantity is ${quantity}`)
		if(type === CONSTANTS.ORDER_TYPE.LIMIT)	{
			newOrderParams = {
				symbol: pair,
				quantity: quantity,
				side: CONSTANTS.ORDER_SIDE.BUY,
				price: price
			}
		}
		else {
			newOrderParams = {
				symbol: pair,
				quantity: quantity,
				type: type,
				side: CONSTANTS.ORDER_SIDE.BUY,
			}
		}
		try{
			let newBuyOrder = await this.Client.order(newOrderParams)
			if(type === CONSTANTS.ORDER_TYPE.MARKET) console.log(`market price is ${newBuyOrder.fills[0].price}`)
			return new Order(newBuyOrder)
		}
		catch(error) {
			console.log(error)
		}
	}

	async newSellOrder(price, quantity = 0, type = CONSTANTS.ORDER_TYPE.LIMIT) {
		console.log(`new SELL order (${price})...`)
		quantity = quantity ? Number(quantity) : this.getQuantity(price)
		let pair = this.getPair(),
			newOrderParams = {}
		console.log(`quantity is ${quantity}`)
		if(type === CONSTANTS.ORDER_TYPE.LIMIT)	{
			newOrderParams = {
				symbol: pair,
				quantity: quantity,
				side: CONSTANTS.ORDER_SIDE.SELL,
				price: price 	
			}
		}
		else {
			newOrderParams = {
				symbol: pair,
				quantity: quantity,
				type: type,
				side: CONSTANTS.ORDER_SIDE.SELL,
			}
		}	
		try{
			let newSellOrder = await this.Client.order(newOrderParams)
			if(type === CONSTANTS.ORDER_TYPE.MARKET) console.log(`market price is ${newSellOrder.fills[0].price}`)
			return new Order(newSellOrder)
		}
		catch(error) {
			console.log(error)
		}
	}

	async createSafeOrders(price) {
		console.log(`create safe orders (amount - ${this.getAmount()})`)
		let deviation = this.getDeviation(),
			amout = this.getAmount(),
			safeOrders = [],
			decimal = this.getDecimal(price)
		for(let i = 0; i < amout; i++) {
			price -=  price * deviation
			price = this.toDecimal(price, decimal)
			console.log(`safe order (${price}), deviation is ${deviation}`)
			let newOrder = await this.newBuyOrder(price)
			safeOrders.unshift(newOrder)
		}
		return safeOrders
	}

	async startTrade(user) {
		console.log('startTrade')
		//TODO 
		//1. создание ордера по начальным параметрам
		//2. выставить ордер на продажу так, чтобы выйти в профит по takeProffit
		//3. создание страховочных ордеров
		//4. запуск цикла проверки статуса цены валюты 
		//5. проверка и описание решений исходов
		//end

		//1. создание ордера по начальным параметрам
		let price = await this.getLastPrice(),
			newBuyOrder = await this.newBuyOrder(price, null, CONSTANTS.ORDER_TYPE.MARKET)
		this.orders.unshift(newBuyOrder)

		//2. выставить ордер на продажу так, чтобы выйти в профит по takeProffit
		price = Number(newBuyOrder.fills[0].price)
		let quantity = Number(newBuyOrder.origQty)
		this.botSettings.firstBuyPrice = price
		let profitPrice = this.getProfitPrice(price)
		let newSellOrder = await this.newSellOrder(profitPrice, quantity)	

		this.currentOrder = newSellOrder
		this.orders.unshift(newSellOrder)

		//3. создание страховочных ордеров
		let safeOrders = await this.createSafeOrders(price)
		console.log(`кол-во страховочных ордеров - ${safeOrders.length}`)
		this.safeOrders.unshift(...safeOrders)
		this.orders.unshift(...safeOrders)

		//4. запуск цикла проверки статуса цены валюты 
		this.trade(user)
		.catch(err => {
			console.log(err)
		})
	}

	async trade(user) {
		console.log('___________________________')
		console.log('trade is going...')
		this.currentOrder = await this.getOrder(this.currentOrder.orderId)
		
		if(this.checkFilling(this.currentOrder.status)) {
			await this.disableBot('ЗАВЕРШЕНО')
		}
		else if(this.checkFailing(this.currentOrder.status)) {
			await this.disableBot('ОШИБКА')	
		}
		else {
			console.log('В ПРОЦЕССЕ')
			console.log(`current order qty - ${this.botSettings.currentOrder}`)
			await this.isProcess()
			await this.updateOrders(this.orders)
			if(this.status === CONSTANTS.BOT_STATUS.ACTIVE)
			setTimeout(() => this.trade(user), 5000)
		}
		this.updateBot(user)
	}

	async isProcess() {
		let orders = this.safeOrders,
			length = orders.length
		if(length) {
			let nextSafeOrders = []
			console.log(`stopPrice - ${this.getStopPrice()}`)
			console.log('проверяем страховочные ордера...')
			for(let i = 0; i < length; i++) {
				try {
					let order = await this.getOrder(orders[i].orderId)
					if(this.checkFilling(order.status)) {
						console.log('найдет заюзаный страховочный, пересчет...')
						this.canselOrder(this.currentOrder.orderId)
						this.recountInitialOrder()
						let newProfitPrice = this.recountProfitPrice(order)
						let newSellOrder = await this.newSellOrder(newProfitPrice)
						// this.safeOrders.splice(i, 1)//ПРИДУМАТЬ ДРУГОЕ УДАЛЕНИЕ ИЗ МАССИВА!
						this.currentOrder = newSellOrder
						this.orders.unshift(this.currentOrder)
					}
					else {
						nextSafeOrders.push(order)
					}
				}
				catch(error) {
					console.log('error in find safe orders')
					console.log(error)
				}
			}
			this.safeOrders = nextSafeOrders
		}
		else {
			console.log('страховочных нету, чекаем стоплосс...')
			let price = await this.getLastPrice(),
				stopPrice = this.getStopPrice()
			console.log(`price - ${price}`)
			console.log(`stopPrice - ${stopPrice}`)
			if(stopPrice > price) {
				console.log('стоплосс пройдет')
				await this.canselOrder(this.currentOrder.orderId)
				await this.newSellOrder(price, CONSTANTS.ORDER_TYPE.MARKET)
				await this.disableBot('Все распродано по рынку, бот выключен')
			}
		}
	}

	recountInitialOrder() {
		this.botSettings.currentOrder = String(Number(this.botSettings.currentOrder) + Number(this.botSettings.safeOrder.size))
	}

	recountProfitPrice(nextOrder) {
		let prevProfitPrice = Number(this.currentOrder.price),
			nextProfitPrice = Number(this.getProfitPrice(nextOrder.price)),
			decimal = this.getDecimal(prevProfitPrice),
			averagePrice = (prevProfitPrice + nextProfitPrice) / 2,
			newProfitPrice = this.toDecimal(averagePrice, decimal)
			console.log(`new profit price = 0.5*(${prevProfitPrice} + ${nextProfitPrice}) = ${newProfitPrice}`)
		return newProfitPrice
	}

	checkFailing(status) {
		return status === CONSTANTS.ORDER_STATUS.CANCELED || 
			status === CONSTANTS.ORDER_STATUS.PENDING_CANCEL ||
			status === CONSTANTS.ORDER_STATUS.REJECTED || 
			status === CONSTANTS.ORDER_STATUS.EXPIRED
	}

	checkFilling(status) {
		return status === CONSTANTS.ORDER_STATUS.FILLED
	}

	async getOrder(orderId) {
		try{
			let pair = this.getPair(),
			order = await this.Client.getOrder({
				symbol: pair,
				orderId: orderId
			})
			return new Order(order)
		}
		catch(error) {
			console.log(orderId)
			console.log(error)
		}
	}

	async canselOrder(orderId) {
		try {
			let pair = this.getPair()
			console.log(`close order(${orderId})`)
			return await this.Client.cancelOrder({
				symbol: pair,
				orderId: orderId
			})
		}
		catch(error) {
			console.log(orderId)
			console.log(error)
		}
	}

	async updateOrders(orders) {
		console.log('круг почета')
		let pair = this.pair.from + this.pair.to
		for(let i = 0; i < orders.length; i++) {
			try{
				let orderData = await this.Client.getOrder({
					symbol: pair,
					orderId: orders[i].orderId
				})
				orders[i] = new Order(orderData)
			}
			catch(error) {
				//in order - ${orders[i].orderId}
				console.log(`error (code ${error.code})`)
				// console.log(error)
			}
		}
		console.log('конец почета')
	}

	async canselOrders(orders) {
		console.log('закрываю ордера...')
		for(let i = 0; i < orders.length; i++) {
			await this.canselOrder(orders[i].orderId)
		}
		console.log('закрыл')
	}

	async disableBot(message) {
		console.log(`disableBot start...(${message})`)
		await this.canselOrders(this.safeOrders)
		this.safeOrders = []
		this.currentOrder = null
		await this.updateOrders(this.orders)
		this.status = CONSTANTS.BOT_STATUS.INACTIVE
		console.log('disableBot end')
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
			Mongo.update({name: data.name}, data, 'users')
		})
	}
}


/*
 symbol: 'ETHBTC',
  orderId: 196648474,
  clientOrderId: 'MRh2w8ynxSoqvMMVDSO44E',
  price: '0.04220000',
  origQty: '0.03000000',
  executedQty: '0.00000000',
  cummulativeQuoteQty: '0.00000000',
  status: 'NEW',
  timeInForce: 'GTC',
  type: 'TAKE_PROFIT_LIMIT',
  side: 'SELL',
  stopPrice: '0.04220000',
  icebergQty: '0.00000000',
  time: 1535100548933,
  updateTime: 1535100548933,
  isWorking: false }
*/