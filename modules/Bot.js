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
	}, user) {
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
		if(user) this.setClient(user)
	}

	setClient(user) {
		let key = Crypto.decipher(user.binanceAPI.key,  Crypto.getKey(user.regDate, user.name))
		let secret = Crypto.decipher(user.binanceAPI.secret,  Crypto.getKey(user.regDate, user.name))
		this.Client = binanceAPI({
			apiKey: key,
			apiSecret: secret
		})
	}

	checkForActivate(nextStatus) {
		let bot_status = CONSTANTS.BOT_STATUS
		return (this.status === bot_status.INACTIVE && nextStatus === bot_status.ACTIVE && this.currentOrder === null)
	}

	checkForDeactivate(nextStatus) {
		let bot_status = CONSTANTS.BOT_STATUS
		return (this.status === bot_status.ACTIVE && nextStatus === bot_status.INACTIVE)
	}

	async changeStatus(nextStatus, user) {
		let message = ''
		if(this.checkForActivate(nextStatus)) {
			this.status = nextStatus
			console.log('АКТИВ')
			if(this.state === CONSTANTS.BOT_STATE.MANUAL) {
				message = 'bot is starting trade (type MANUAL)'
				this.startManual(user)
			}
			else if(this.state === CONSTANTS.BOT_STATE.AUTO) {
				message = 'bot is starting trade (type AUTO)'
				this.startAuto(user)
			}
			else {
				message = "bot isn't starting (incorrect type)"
				this.status = CONSTANTS.BOT_STATUS.INACTIVE
			}
		}
		else if(this.checkForDeactivate(nextStatus)) {
			this.status = nextStatus
			message = "bot is deactivated (wait for the end)"
			console.log('ИНАКТИВ')
			this.updateBot(user)
		}
		else {
			message = "error (perhaps you are trying to disable the bot before it completes its previous cycle)"
		}
		return {
			status: this.status,
			message: message
		}
	}

	startManual(user) {
		console.log('startManual')
		this.setClient(user)
		this.currentOrder = {}
		this.startTrade(user)
		.catch((err) => console.log(err))
		
	}

	startAuto(user) {
		console.log('startAuto')
	}

	setQuantity(price) {
		price = Number(price)
		this.botSettings.quantity = {
			current: Math.ceil( (Number(this.botSettings.currentOrder) / price) * 100 ) /100,
			size: Math.ceil( (Number(this.botSettings.currentOrder) / price) * 100 ) /100
		}
		return Number(this.botSettings.quantity.current)
	}

	getQuantity() {
		return Number(this.botSettings.quantity.current)
	}
	
	recountQuantity(time = 0) {
		time = Number(time)
		let current = Number(this.botSettings.quantity.current),
			size = Number(this.botSettings.quantity.size)
		current += time * size
		this.botSettings.quantity.current = current
		return current
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

	async newBuyOrder(price = 0, type = CONSTANTS.ORDER_TYPE.LIMIT, quantity = this.getQuantity()) {
		console.log(`new BUY order (${price}) ${quantity}...`)
		let pair = this.getPair(),
			newOrderParams = {
				symbol: pair,
				side: CONSTANTS.ORDER_SIDE.BUY,
				quantity: quantity
			}
		if(type === CONSTANTS.ORDER_TYPE.LIMIT)	
			newOrderParams.price = price
		else 
			newOrderParams.type = type

		try{
			let newBuyOrder = await this.Client.order(newOrderParams)
			if(type === CONSTANTS.ORDER_TYPE.MARKET) console.log(`market price is ${newBuyOrder.fills[0].price}`)
			return new Order(newBuyOrder)
		}
		catch(error) {
			console.log(error)
		}
	}

	async newSellOrder(price = 0, type = CONSTANTS.ORDER_TYPE.LIMIT, quantity = this.getQuantity()) {
		console.log(`new SELL order (${price}) ${quantity}...`)
		let pair = this.getPair(),
			newOrderParams = {
				symbol: pair,
				side: CONSTANTS.ORDER_SIDE.SELL,
				quantity: quantity
			}
		if(type === CONSTANTS.ORDER_TYPE.LIMIT)	
			newOrderParams.price = price
		else 
			newOrderParams.type = type

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
			quantity = this.setQuantity(price),
			newBuyOrder = await this.newBuyOrder(null, CONSTANTS.ORDER_TYPE.MARKET)
		this.orders.unshift(newBuyOrder)

		//2. выставить ордер на продажу так, чтобы выйти в профит по takeProffit
		price = Number(newBuyOrder.fills[0].price)
		this.botSettings.firstBuyPrice = price
		let profitPrice = this.getProfitPrice(price)
		let newSellOrder = await this.newSellOrder(profitPrice)	

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
		this.updateBotStatus(user)
		console.log('___trade is going___')
		this.currentOrder = await this.getOrder(this.currentOrder.orderId)
		let currentOrderStatus = this.currentOrder.status
		
		if(this.checkFilling(currentOrderStatus)) {
			await this.disableBot('ЗАВЕРШЕНО')
		}
		else if(this.checkFailing(currentOrderStatus)) {
			await this.disableBot('ОШИБКА или ЗАВЕРШЕНИЕ')	
		}
		else {
			console.log('В ПРОЦЕССЕ')
			console.log(`current order qty - ${this.botSettings.currentOrder}`)
			await this.isProcess()
			await this.updateOrders(this.orders)
			if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) {
				console.warn('___обычный trade___')
				setTimeout(() => this.trade(user), 5000)
			}
			else if(this.status === CONSTANTS.BOT_STATUS.INACTIVE) {
				console.warn('___бот выключен___')
				if(this.currentOrder !== null) {
					console.warn('-> ждем завершение цикла')
					setTimeout(() => this.trade(user), 5000)
				}
				else {
					console.warn('-> цикл завершен')
					await this.disableBot('нажали выкл -> бот завершил работу -> выключаем бота')
				}
			}
		}
		this.updateBot(user)
	}

	async isProcess() {
		let orders = this.safeOrders,
			length = orders.length
		if(length) {
			let nextSafeOrders = []
			console.log(`stopPrice - ${this.getStopPrice()}`)
			console.log('проверяем страховочные ордера')
			for(let i = 0; i < length; i++) {
				try {
					let order = await this.getOrder(orders[i].orderId)
					if(this.checkFilling(order.status)) {
						console.log('найдет заюзаный страховочный, пересчет')
						this.canselOrder(this.currentOrder.orderId)
						this.recountInitialOrder()
						let newProfitPrice = this.recountProfitPrice(order)
						this.recountQuantity(1)
						let newSellOrder = await this.newSellOrder(newProfitPrice)
						this.currentOrder = newSellOrder
						this.orders.unshift(this.currentOrder)
					}
					else if(this.checkCanceling(order.status)) {
						console.log('найдет отмененный страховочный ордер')
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
				console.log('стоплосс пройден')
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

	checkCanceling(status) {
		return status === CONSTANTS.ORDER_STATUS.CANCELED
	}

	checkProcessing(status) {
		return (status === CONSTANTS.ORDER_STATUS.NEW || status === CONSTANTS.ORDER_STATUS.PARTIALLY_FILLED)
	}

	async getOrder(orderId) {
		orderId = Number(orderId)
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
		orderId = Number(orderId)
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
					console.log(i)
					let orderData = await this.Client.getOrder({
						symbol: pair,
						orderId: orders[i].orderId
					})
					orders[i] = new Order(orderData)
			}
			catch(error) {
				console.log(`error (code ${error.code})`)
				console.error(error)
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

	async cancelAllOrders() {
		console.log('cancel all orders and sell by market')
		try{
			await this.canselOrders(this.safeOrders)
			await this.canselOrder(this.currentOrder.orderId)
			let lastPrice = await this.getLastPrice(),
				newOrder = await this.newSellOrder(lastPrice, CONSTANTS.ORDER_TYPE.MARKET)
			this.orders.unshift(newOrder)
			await this.updateOrders(this.orders)
			await this.disableBot('ОТМЕНИТЬ И ПРОДАТЬ')
		}
		catch(error) {
			console.log(error)
		}
	}

	updateBot(user) {
		console.log('update bot...')
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

	updateBotStatus(user) {
		console.log('update bot status...')
		user = { name: user.name }
		Mongo.select(user, 'users', (data) => {
			data = data[0]
			const index = data.bots.findIndex(bot => {
				return bot.botID === this.botID
			})
			this.status = data.bots[index].status
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