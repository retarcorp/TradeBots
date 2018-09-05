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
		freeze = CONSTANTS.BOT_FREEZE_STATUS.INACTIVE,
		preFreeze = freeze,
		botID = String(Date.now()),
		pair = {},
		currentOrder = null,
		orders = [],
		freezeOrders = {
			safe: [],
			current: null,
		},
		botSettings = {},
		balance = 0
	}, user) {
		this.title = title
		this.state = state
		this.status = status
		this.freeze = freeze
		this.preFreeze = preFreeze
		this.pair = new Pair(pair.from, pair.to)
		this.orders = orders
		this.currentOrder = currentOrder
		this.safeOrders = []
		this.freezeOrders = freezeOrders
		this.botSettings = new BotSettings(botSettings)
		this.botID = botID
		this.balance = balance
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
		let message = '',
			status = ''
		if(this.checkForActivate(nextStatus)) {
			this.status = nextStatus
			console.log('АКТИВ')
			if(this.state === CONSTANTS.BOT_STATE.MANUAL) {
				status = 'ok'	
				message = 'Бот запущен (РУЧНОЙ)'
				this.startManual(user)
			}
			else if(this.state === CONSTANTS.BOT_STATE.AUTO) {
				status = 'ok'	
				message = 'Бот запущен (АВТО)'
				this.startAuto(user)
			}
			else {
				status = 'error'	
				message = "Ошибка (НЕИЗВЕСТНЫЙ ТИП БОТА)"
				this.status = CONSTANTS.BOT_STATUS.INACTIVE
			}
		}
		else if(this.checkForDeactivate(nextStatus)) {
			this.status = nextStatus
			status = 'info'
			message = "Бот перестанет работать после завершения текущего цикла"
			console.log('ИНАКТИВ')
			await this.syncUpdateBot(user)
		}
		else {
			this.status = CONSTANTS.BOT_STATUS.INACTIVE
			status = 'error'
			message = "Ошибка (Возможно вы пытаетесь включить бота, который не завершил свой последний цикл)"
		}
		return {
			status: status,
			data: { status: this.status },
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

	setQuantity(price = 0, quantity = 0) {
		// this.botSettings.quantity = {
		// 	current: Math.ceil( (Number(this.botSettings.currentOrder) / price) * 100 ) /100,
		// 	size: Math.ceil( (Number(this.botSettings.currentOrder) / price) * 100 ) /100
		// }
		this.botSettings.quantity = price ? this.toDecimal(Number(this.botSettings.currentOrder) / price) + 0.01 : Number(quantity)
		// this.botSettings.quantityM = price ? this.toDecimal(Number(this.botSettings.currentOrder) / price) + 0.1 : Number(quantityM)
		console.log(price, this.botSettings.currentOrder, this.botSettings.quantity, price * this.botSettings.quantity)
		console.log("SET КОЛИЧЕСТВО _________ " + this.botSettings.quantity)
		// console.log('QUANTITYM = ' + this.botSettings.quantityM)
		return Number(this.botSettings.quantity)
	}

	getMartingaleValue() {
		return Number(this.botSettings.martingale.value)
	}

	getMartingaleActive() {
		return Number(this.botSettings.martingale.active)
	}

	getQuantity(price = 0, safeFlag = 0) {
		price = Number(price)
		console.log("GET КОЛИЧЕСТВО _________ " + this.botSettings.quantity)
		if(!safeFlag)
			return price ? this.toDecimal(Number(this.botSettings.currentOrder) / price) : Number(this.botSettings.quantity)
		else {
			// if(!this.getMartingaleActive())
				return this.toDecimal(Number(this.botSettings.safeOrder.size) / price)
			// else {
			// 	let ret = this.toDecimal(Number(this.botSettings.initialOrder) / price)
			// 	ret += ret * this.getMartingaleValue()
			// 	return ret
			// }
		}
	}
	
	recountQuantity(quantity = 0, side = 0) {
		quantity = Number(quantity)
		// if(!this.this.getMartingaleActive()) {
		console.log(`recount _ ${quantity} _ ${side}`)
		let current = Number(this.botSettings.quantity)
		current += Math.pow(-1, side) * quantity
		current = this.toDecimal(current)
		this.botSettings.quantity = current
		console.log("RECOUNT КОЛИЧЕСТВО _________ " + this.botSettings.quantity)
		return current
		// }
		// else if(!side){
		// 	console.log(`recount martingale_ ${quantity} ${this.botSettings.quantity}`)
		// 	let current = Number(this.botSettings.quantity)
		// 	if(quantity)
		// 		current = quantity
		// 	else {
		// 		current += this.getMartingaleValue() * current
		// 	}
		// 	this.botSettings.quantity = current
		// 	return current
		// }
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

	getMaxOpenedAmount() {
		return Number(this.botSettings.maxOpenSafetyOrders)
	}

	getQtyOfUsedSafeOrders() {
		return Number(this.botSettings.quantityOfUsedSafeOrders)
	}

	getQtyOfActiveSafeOrders() {
		return Number(this.botSettings.quantityOfActiveSafeOrders)
	}

	getTakeProfit() {
		return (Number(this.botSettings.takeProfit) + 2 * CONSTANTS.BINANCE_FEE) / 100
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

	toDecimal(value = 0, decimal = 2) {
		return Number(Number(value).toFixed(decimal))
	}

	async getLastPrice() {
		let pair = this.getPair(),
			// price = await this.Client.allBookTickers()
			price = await this.Client.prices()
		return Number(price[pair])
	}

	async newBuyOrder(price = 0, type = CONSTANTS.ORDER_TYPE.LIMIT, quantity = this.getQuantity(price), prevError = {}) {
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
			console.log(quantity)
			let newBuyOrder = await this.Client.order(newOrderParams)
			if(type === CONSTANTS.ORDER_TYPE.MARKET) console.log(`market price is ${newBuyOrder.fills[0].price}`)
			// if(price) this.recountQuantity(newBuyOrder.origQty)
			return new Order(newBuyOrder)
		}
		catch(error) {
			if(quantity > 0) {
				let step = 0.01
				if(
					(this.isError1013(error) && this.isError2010(prevError)) ||
					(this.isError1013(prevError) && this.isError2010(error))
				) return await this.disableBot('Невозможно купить монеты')
				else if(this.isError1013(error)) quantity += step
				else if(this.isError2010(error)) quantity -= step
				
				console.log(this.toDecimal(quantity, 2))
				let order = await this.newBuyOrder(price, type, this.toDecimal(quantity, 2), error)
				return order
			}
			else return {}
		}
	}

	async newSellOrder(price = 0, type = CONSTANTS.ORDER_TYPE.LIMIT, quantity = this.getQuantity(price), prevError = {}) {
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
			this.recountQuantity(newSellOrder.origQty, 1)
			return new Order(newSellOrder)
		}
		catch(error) {
			console.log(this.errorCode(error))
			if(quantity > 0) {
				let step = 0.01
				if(
					(this.isError1013(error) && this.isError2010(prevError)) ||
					(this.isError1013(prevError) && this.isError2010(error))
				) return await this.disableBot('Невозможно продать монеты')
				else if(this.isError1013(error)) quantity += step
				else if(this.isError2010(error)) quantity -= step

				let order = await this.newSellOrder(price, type, this.toDecimal(quantity, 2), error)
				return order
			}
			else return {}
		}
	}

	async createSafeOrders(price = 0, quantity = 0) {
		price = Number(price)
		let amount = this.getMaxOpenedAmount(),
			safeOrders = [],
			curPrice = price,
			curQty = quantity
		console.log(`create safe orders (amount - ${amount})`)
		for(let i = 0; i < amount; i++) {
			let newOrder = {}
			if(!this.getMartingaleActive())
				newOrder = await this.createSafeOrder(curPrice)
			else 
				newOrder = await this.createSafeOrder(curPrice, curQty)
			curPrice = newOrder.price
			curQty = newOrder.origQty
			console.log(newOrder)
			if(newOrder.orderId)
				safeOrders.push(newOrder)
		}
		return safeOrders
	}
	
	async createSafeOrder(price = 0, quantity = 0) {
		price = Number(price)
		console.log(`create safe order`)
		let maxOpenSO = this.getMaxOpenedAmount(),
			currentQtyUsedSO = this.getQtyOfUsedSafeOrders(),
			currentQtyActiveSO = this.getQtyOfActiveSafeOrders(),
			maxAmountSO = this.getAmount(),
			deviation = this.getDeviation(),
			lastSafeOrder = this.lastSafeOrder() || {},
			decimal = this.getDecimal(price || Number(lastSafeOrder.price)),
			newOrder = {}
		console.log(maxOpenSO, currentQtyActiveSO, maxAmountSO, currentQtyUsedSO)
		if(maxOpenSO > currentQtyActiveSO && maxAmountSO > currentQtyUsedSO) {
			console.log('??')
			this.botSettings.quantityOfUsedSafeOrders ++
			this.botSettings.quantityOfActiveSafeOrders ++
			let lastSafeOrderPrice = Number(lastSafeOrder.price) || price,
				newPrice = this.toDecimal(lastSafeOrderPrice - lastSafeOrderPrice * deviation, decimal),
				qty = 0
			if(quantity) qty = this.toDecimal(quantity * this.getMartingaleValue()) 
			else if(this.getMartingaleActive()) qty = this.toDecimal(Number(lastSafeOrder.origQty) * this.getMartingaleValue())
			else qty = this.getQuantity(newPrice, 1)

			try {
				console.log(newPrice)
				newOrder = await this.newBuyOrder(newPrice, CONSTANTS.ORDER_TYPE.LIMIT, qty)
			}
			catch(error) {
				console.log(error)
				console.log(error)
			}
			console.log(`create safe order end (price ${newPrice})`)
		}	
		return newOrder
	}

	lastSafeOrder() {
		let orders = this.safeOrders,
			lastOrder = orders[0],
			length = orders.length

		for (let i = 1; i < length; ++i) 
			if (orders[i].price < lastOrder.price) lastOrder = orders[i];

		return lastOrder
	}

	async getBinanceTime() {
		return await this.Client.time()
	}

	async firstBuyOrder(orderId = 0, counter = 0) {
		console.log('firstBuy', orderId)
		counter++
		let price = await this.getLastPrice(),
			order
		if(!orderId) {
			console.log('СОЗДАЕМ ОРДЕЕЕР')
			let quantity = this.setQuantity(price), 
				newBuyOrder = await this.newBuyOrder(price)
			orderId = newBuyOrder.orderId
		}
		order = await this.getOrder(orderId)

		if(this.checkFilling(order.status)) {
			console.log('ФИЛИНГ')
			return new Order(order)
		}
		else if(this.checkCanceling(order.status) || this.checkFailing(order.status)) {
			console.log('ниХУЯ')
			return {}
		}
		else {
			// return await this.firstBuyOrder(orderId, counter)
			// setTimeout(() => {
			// 	console.log('чек чек ' + counter)
				return this.firstBuyOrder(orderId, counter)
			// }, CONSTANTS.ORDER_TIMEOUT)
		}
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
		// let price = await this.getLastPrice(),
		// 	quantity = this.setQuantity(price),
		// 	newBuyOrder = await this.newBuyOrder(null, CONSTANTS.ORDER_TYPE.MARKET)
		let newBuyOrder = await this.firstBuyOrder()
		console.log(newBuyOrder)
		this.orders.push(newBuyOrder)
		//2. выставить ордер на продажу так, чтобы выйти в профит по takeProffit
		let price = Number(newBuyOrder.price),
			qty = Number(newBuyOrder.origQty)

		this.botSettings.firstBuyPrice = price
		let profitPrice = this.getProfitPrice(price)
		let newSellOrder = await this.newSellOrder(profitPrice)
		if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) {
			this.currentOrder = newSellOrder
			this.orders.push(newSellOrder)

			//3. создание страховочных ордеров
			let safeOrders = await this.createSafeOrders(price, qty)
			console.log(`кол-во страховочных ордеров - ${safeOrders.length}`)
			this.safeOrders.push(...safeOrders)
			this.orders.push(...safeOrders)

			//4. запуск цикла проверки статуса цены валюты 
			this.trade(user)
			.catch(err => {
				console.log(err)
			})
		}
	}

	errorCode(error = new Error('default err')) {
		return JSON.parse(JSON.stringify(error)).code
	}

	isError1021(error = new Error('default err')) { //Timestamp for this request is outside of the recvWindow 	
		let code = this.errorCode(error)
		console.log(code)
		return code === -1021
	}

	isError1013(error = new Error('default err')) { //MIN_NOTATIAN
		let code = this.errorCode(error)
		console.log(code)
		return code === -1013
	}

	isError2010(error = new Error('default err')) { // insufficient balance
		let code = this.errorCode(error)
		console.log(code)
		return code === -2010
	}

	async trade(user) {
		console.log('___________________________')
		console.log('qty = ' + this.botSettings.quantity)
		await this.updateBotParams(user)
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
			if(this.freeze === CONSTANTS.BOT_FREEZE_STATUS.INACTIVE) {
				await this.isProcess(user)
				this.orders = await this.updateOrders(this.orders)
			}
			if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) {
				console.warn('___обычный trade___')
				const activeF = CONSTANTS.BOT_FREEZE_STATUS.ACTIVE,
					inactiveF = CONSTANTS.BOT_FREEZE_STATUS.INACTIVE
				console.log(activeF, inactiveF)
				console.log(this.freeze, this.preFreeze)
				if(this.freeze === activeF && this.preFreeze === inactiveF) {
					// если сейчас бот заморожен, а раньше разморожен -> заморозить
					console.log('-> заморозить')
					await this.freezeBot()
					setTimeout(() => this.trade(user), CONSTANTS.TIMEOUT)
				}
				else if(this.freeze === inactiveF && this.preFreeze === activeF) {
					// если сейчас бот разморожен, а раньше заморожен -> разморозить
					console.log('-> разморозить')
					await this.unfreezeBot()
					setTimeout(() => this.trade(user), CONSTANTS.TIMEOUT)
				}
				else {
					// если пред и текущие значения равны -> продолжать цикл
					console.log('-> продолжать цикл')
					setTimeout(() => this.trade(user), CONSTANTS.TIMEOUT)
				}
			}
			else if(this.status === CONSTANTS.BOT_STATUS.INACTIVE) {
				console.warn('___бот выключен___')
				if(this.currentOrder !== null) {
					console.warn('-> ждем завершение цикла')
					setTimeout(() => this.trade(user), CONSTANTS.TIMEOUT)
				}
				else {
					console.warn('-> цикл завершен')
					await this.disableBot('нажали выкл -> бот завершил работу -> выключаем бота')
				}
			}
		}
		await this.syncUpdateBot(user)
	}

	async isProcess(user) {
		let orders = this.safeOrders,
			length = orders.length

		if(length) {
			let nextSafeOrders = []
			console.log(`stopPrice - ${this.getStopPrice()}`)
			console.log('проверяем страховочные ордера')
			for(let i = 0; i < length; i++) {
				try {
					let order = await this.getOrder(orders[i].orderId)
					this.botSettings.quantityOfActiveSafeOrders -- 
					if(this.checkFilling(order.status)) {
						// this.botSettings.quantityOfUsedSafeOrders --
						console.log('найден заюзаный страховочный, пересчет')
						await this.cancelOrder(this.currentOrder.orderId)
						this.recountInitialOrder()
						this.recountQuantity(order.origQty)
						let newProfitPrice = this.recountProfitPrice(order)
						let newSellOrder = await this.newSellOrder(newProfitPrice, CONSTANTS.ORDER_TYPE.LIMIT, this.getQuantity())
						let newSafeOrder = await this.createSafeOrder(null)
						this.currentOrder = newSellOrder
						this.orders.push(this.currentOrder)
						if(newSafeOrder.orderId) {
							this.orders.push(newSafeOrder)
							nextSafeOrders.push(newSafeOrder)
						}
					}
					else if(this.checkCanceling(order.status)) {
						console.log('найдет отмененный страховочный ордер')
						let newSafeOrder = await this.createSafeOrder(null)
						if(newSafeOrder.orderId) {
							this.orders.push(newSafeOrder)
							nextSafeOrders.push(newSafeOrder)
						}
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
				await this.cancelAllOrders(user)
				// await this.cancelOrder(this.currentOrder.orderId)
				// await this.newSellOrder(price, CONSTANTS.ORDER_TYPE.MARKET)
				await this.disableBot('Все распродано по рынку, бот выключен')
			}
		}
		await this.syncUpdateBot(user)
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
		let pair = this.getPair(),
			order = {}
		try{
			order = await this.Client.getOrder({
				symbol: pair,
				orderId: orderId
			})
		}
		catch(error) {
			console.log(orderId)
			console.log(error)
			if(this.isError1021(error)) order = await this.getOrder(orderId)
		}
		return new Order(order)
	}

	async cancelOrder(orderId) {
		orderId = Number(orderId)
		try {
			let pair = this.getPair()
			console.log(`close order(${orderId})`)
			let order = await this.getOrder(orderId),
				side = order.side,
				qty = order.origQty,
				status = '',
				message = ''
			try {
				let cancelOrder = await this.Client.cancelOrder({
					symbol: pair,
					orderId: orderId
				})
				console.log(cancelOrder, side)
				if(this.isOrderSell(side)) {
					this.recountQuantity(qty)
				}
				status = 'ok'
				message = `ордер ${cancelOrder.orderId} завершен`
			}
			catch(error) {
				console.log(this.errorCode(error))
				status = 'error'
				message = `ошибка при завершении ордера ${cancelOrder.orderId}`
			}
			return {
				status: status,
				message: message,
				data: { order: cancelOrder }
			}
		}
		catch(error) {
			console.log(this.errorCode(error))
			return {
				status: 'error',
				message: error,
				data: { orderId: orderId }
			}
		}
	}

	isOrderSell(side) {
		return side === CONSTANTS.ORDER_SIDE.SELL
	}

	isOrderBuy(side) {
		return side === CONSTANTS.ORDER_SIDE.BUY
	}

	async updateOrders(orders) {
		console.log('круг почета')
		let pair = this.pair.from + this.pair.to
		for(let i = 0; i < orders.length; i++) {
			try{
				// console.log(orders[i].time)
				if(!orders[i].isUpdate) {
					console.log('!')
					let orderData = await this.Client.getOrder({
						symbol: pair,
						orderId: orders[i].orderId
					})
					let order = new Order(orderData)
					if(this.checkFailing(order.status) || this.checkFilling(order.status)) order.isUpdate = true
					orders[i] = order
				}
			}
			catch(error) {
				console.log(`error (code ${error.code})`)
				console.error(error)
			}
		}
		console.log('конец почета')
		return orders
	}

	async createOrders(orders = []/*, type = 'safe'*/) {
		console.log('создаю ордера...')
		const length = orders.length
		let newOrders = []

		for(let i = 0; i < length; i++) {
			let order = await this.createOrder(orders[i])
			if(order.orderId)
				newOrders.push(order)
		}

		// if(type === 'safe') {
		// 	this.safeOrders = newOrders
		// }
		console.log('создал ордера.')
		return newOrders
	}

	async createOrder(order = {}) {
		console.log('создаю ордер...')
		let { side, price, type, origQty } = order,
			newOrder = {}

		if(side === CONSTANTS.ORDER_SIDE.BUY) 
			newOrder = await this.newBuyOrder(price, type, origQty)
		else if(side === CONSTANTS.ORDER_SIDE.SELL) 
			newOrder = await this.newSellOrder(price, type, origQty)

		console.log('создал ордер.')
		return newOrder
	}

	async cancelOrders(orders) {
		console.log('закрываю ордера...')
		for(let i = 0; i < orders.length; i++) {
			await this.cancelOrder(orders[i].orderId)
		}
		console.log('закрыл')
	}

	async disableBot(message) {
		console.log(`disableBot start...(${message})`)
		await this.cancelOrders(this.safeOrders)
		this.safeOrders = []
		this.currentOrder = null
		this.botSettings.quantityOfUsedSafeOrders = 0
		this.botSettings.quantityOfActiveSafeOrders = 0
		this.botSettings.currentOrder = this.botSettings.initialOrder
		this.botSettings.quantity = {
			current: 0,
			size: 0
		}
		this.botSettings.firstBuyPrice = 0
		this.orders = await this.updateOrders(this.orders)
		this.status = CONSTANTS.BOT_STATUS.INACTIVE
		console.log('disableBot end')
	}

	async cancelAllOrders(user) {
		console.log('cancel all orders and sell by market')
		try{
			await this.cancelOrders(this.safeOrders)
			await this.cancelOrder(this.currentOrder.orderId)
			let lastPrice = await this.getLastPrice(),
				newOrder = await this.newSellOrder(lastPrice, CONSTANTS.ORDER_TYPE.MARKET)
			this.orders.push(newOrder)
			this.orders = await this.updateOrders(this.orders)
			await this.syncUpdateBot(user)
			// await this.disableBot('ОТМЕНИТЬ И ПРОДАТЬ')
			console.log('cancel end____')
			return {
				status: 'info',
				message: 'Все ордера отменены и монеты распроданы по рынку'
			}
		}
		catch(error) {
			console.log(this.errorCode(error))
			return {
				status: 'error',
				message: `Ошибка при "отменить и продать все"(код ошибки ${this.errorCode(error)}) :: ${error}`
			}
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
			Mongo.update({name: data.name}, data, 'users', () => console.log('update bot end'))
		})
	}

	async syncUpdateBot(user, message) {
		message && console.log(message)
		console.log('sync update bot...')
		console.log(this.status)
		console.log(this.freeze)
		console.log(this.preFreeze)
		user = { name: user.name }
		let data = await Mongo.syncSelect(user, 'users')
		data = data[0]
		let tempBot = new Bot(this)
		const index = data.bots.findIndex(bot => {
			return bot.botID === tempBot.botID
		})
		data.bots[index] = tempBot
		await Mongo.syncUpdate({name: data.name}, data, 'users')
		console.log('sync update bot end')
	}

	async updateBotParams(user) {
		console.log('update bot params...')
		user = { name: user.name }
		let data = await Mongo.syncSelect(user, 'users')
		data = data[0]
		const index = data.bots.findIndex(bot => {
			return bot.botID === this.botID
		})
		let bot = data.bots[index]
		this.status = bot.status
		this.freeze = bot.freeze
		this.preFreeze = bot.preFreeze
	}

	async unfreezeBot() {
		console.log('UNFREEZE BOT')
		this.preFreeze = CONSTANTS.BOT_FREEZE_STATUS.INACTIVE

		// TODO
		// создать новые ордера по копиям из freezeOrders
		let newSafeOrders = await this.createOrders(this.freezeOrders.safe),
			newCurOrder = await this.createOrder(this.freezeOrders.current)

		this.safeOrders = newSafeOrders
		this.currentOrder = newCurOrder

		//разморозить
		// return {
		// 	status: 'ok',
		// 	message: 'бот успешно разморожен',
		// 	data: { freeze: this.freeze }
		// }
	}

	cloneDeep(obj) { // полное клонирование объекта
		return JSON.parse(JSON.stringify(obj))
	}

	async freezeBot() {
		console.log('FREEZE BOT')
		this.preFreeze = CONSTANTS.BOT_FREEZE_STATUS.ACTIVE

		// TODO
		console.log(this.currentOrder)
		// отменить все ордера
		// переместив их копии в объект freezeOrders
		let freezeSO = [],
			freezeCO = this.cloneDeep(this.currentOrder)

		this.safeOrders.forEach(order => {
			frezeSO.push(new Order(order))
		})
		
		this.freezeOrders.safe = freezeSO
		this.freezeOrders.current = freezeCO

		await this.cancelOrders(this.safeOrders)
		await this.cancelOrder(this.currentOrder)
		//заморозить
		// return {
		// 	status: 'ok',
		// 	message: 'бот успешно заморожен',
		// 	data: { freeze: this.freeze }
		// }
	}

	async changeFreeze(nextFreeze, user) {
		const active = CONSTANTS.BOT_FREEZE_STATUS.ACTIVE,
			inactive = CONSTANTS.BOT_FREEZE_STATUS.INACTIVE
		let res = {
			status: 'error',
			message: 'Получены неверные данные.'
		}
		console.log('__')
		console.log(this.freeze, this.preFreeze)
		if(nextFreeze === inactive) {
			console.log('inactive')
			this.preFreeze = this.freeze
			this.freeze = inactive
			res = {
				status: 'info',
				message: 'Бот будет разморожен.'
			}
		}
		else if(nextFreeze === active) {
			console.log('active')
			this.preFreeze = this.freeze
			this.freeze = active
			res = {
				status: 'info',
				message: 'Бот будет заморожен.'
			}
		}
		console.log(this.freeze, this.preFreeze)
		console.log('__')
		await this.syncUpdateBot(user, 'ОБНОВЛЕние ФРЕЕЕЕЗЕЕЕ БООТ')
		return res
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