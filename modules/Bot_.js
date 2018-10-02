let BotSettings = require('./BotSettings');
let Order = require('./Order');
let Pair = require('./Pair');
const Crypto = require('../modules/Crypto');
const Symbols = require('./Symbols');
let binanceAPI = require('binance-api-node').default;
const WSS = require('./WSS');
const TradingSignals = require('../modules/TradingSignals');
let Mongo = require('./Mongo');
let sleep = require('system-sleep');
const md5 = require('md5');

const Process = require('./Process');

const CONSTANTS = require('../constants');

module.exports = class Bot {
	constructor({
		title = 'Untitled bot',
		state = CONSTANTS.BOT_STATE.MANUAL,
		status = CONSTANTS.BOT_STATUS.INACTIVE,
		freeze = CONSTANTS.BOT_FREEZE_STATUS.INACTIVE,
		preFreeze = freeze,
		botID = String(Date.now()),
		pair = {},
		currentOrder = {},
		orders = [],
		safeOrders = [],
		freezeOrders = {
			safe: [],
			current: {},
		},
		botSettings = {},
		log = [],
		processes = {}
	} = {}, user = {}) {
		this.title = title;
		this.state = state;
		this.status = status;
		this.freeze = freeze;
		this.preFreeze = preFreeze;
		this.pair = new Pair(pair.from, pair.to, pair.requested);
		this.orders = orders;
		this.currentOrder = currentOrder;
		this.safeOrders = safeOrders;
		this.freezeOrders = freezeOrders;
		this.botSettings = new BotSettings(botSettings);
		this.botID = botID;
		this.log = log;
		this.processes = processes;
		if(user.name) this.setClient(user);
		this.user = user;
	}

	_log(message = '') {
		let date = new Date,
			nextMessage = ''
		date = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() 
		nextMessage = `${date}|  ${message}`
		
		if(this.log.length && this.log[0].indexOf(message) >= 0) this.log[0] = nextMessage
		else this.log.unshift(nextMessage) 
	}

	createNewProcess() {
		// TODO
		// значит, нужно сделать класс процесса, который будет иметь
		// все минимальные данные полей, которые нужны для его работы
		// (пара, минимальный оред, страховочные оредра, мартингейл, 
		// ...
		// )
		// и в этом объекте процесса будет происходить все, что есть 
		// сейчас в одном боте
	}

	changeDots(line) {
		const d3 = '...', d2 = '..', d1 = '.'
		let nextLine = line
		if(line.indexOf(d3) >= 0) {
			nextLine = line.replace(d3, d1)
		}
		else if(line.indexOf(d2) >= 0) {
			nextLine = line.replace(d2, d3)
		}
		else if(line.indexOf(d1) >= 0) {
			nextLine = line.replace(d1, d2)
		}
		return nextLine
	}

	setClient(user) {
		console.log(user);
		let key = '',
			secret = '',
			ret = true
		if(user.binanceAPI.name !== '') {
			try {
				key = Crypto.decipher(user.binanceAPI.key,  Crypto.getKey(user.regDate, user.name))
				secret = Crypto.decipher(user.binanceAPI.secret,  Crypto.getKey(user.regDate, user.name))
			}
			catch(err) {
				console.log('ошибка с определением ключей бинанса');
				this._log('ошибка с определением бинанс ключей!');
				key = '';
				secret = '';
				ret = false;
			}
			this.Client = binanceAPI({
				apiKey: key,
				apiSecret: secret
			})
		}
		else {
			this._log('ошибка с определением бинанс ключей!');
		}
		return ret
	}

	checkForActivate(nextStatus) {
		let bot_status = CONSTANTS.BOT_STATUS
		console.log('status = ' + this.status, bot_status.INACTIVE, 'nextStatus = ' + nextStatus, bot_status.ACTIVE, this.currentOrder.orderId)
		return (this.status === bot_status.INACTIVE && nextStatus === bot_status.ACTIVE && !this.currentOrder.orderId)
	}

	checkForDeactivate(nextStatus) {
		let bot_status = CONSTANTS.BOT_STATUS
		return (this.status === bot_status.ACTIVE && nextStatus === bot_status.INACTIVE)
	}

	continueTrade(user) {
		console.log('****************continueTrade****************  ' + this.title)
		if(this.setClient(user)) {
			if(this.state === CONSTANTS.BOT_STATE.MANUAL) {
				this.tradeManual(user)
			}
			else if(this.state === CONSTANTS.BOT_STATE.AUTO) {
				this.tradeAuto(user)
			}
		}
	}

	isManual() {
		return this.state === CONSTANTS.BOT_STATE.MANUAL;
	}

	isAuto() {
		return this.state === CONSTANTS.BOT_STATE.AUTO;
	}

	async changeStatus(nextStatus, user = this.user) {
		let message = '',
			status = '';
			
		if(this.checkForActivate(nextStatus)) {
			this.status = nextStatus;
			console.log('activate bot');

			if(this.isManual()) {
				this.botSettings.decimalQty = await Symbols.getLotSize(this.getPair());
				status = 'ok';
				message = 'Бот запущен (РУЧНОЙ)';
				await this.syncUpdateBot(user);
				this.startManual(user);
			}
			if(this.isAuto()) {

			}
			else {

			}
			// if(this.state === CONSTANTS.BOT_STATE.MANUAL) {
			// 	this.botSettings.decimalQty = await Symbols.getLotSize(this.getPair())
			// 	status = 'ok'	
			// 	message = 'Бот запущен (РУЧНОЙ)'
			// 	this._log('__________________________')
			// 	this._log(message)
			// 	await this.syncUpdateBot(user)
			// 	this.startManual(user)
			// }
			// else if(this.state === CONSTANTS.BOT_STATE.AUTO) {
			// 	status = 'ok'	
			// 	message = 'Бот запущен (АВТО)'
			// 	this._log(message)
			// 	await this.syncUpdateBot(user)
			// 	this.startAuto(user)
			// }
			// else {
			// 	status = 'error'	
			// 	message = "Ошибка (НЕИЗВЕСТНЫЙ ТИП БОТА)"
			// 	this._log(message)
			// 	this.status = CONSTANTS.BOT_STATUS.INACTIVE
			// }
		}
		else if(this.checkForDeactivate(nextStatus)) {
			let l = this.processes.length;
			this.status = nextStatus;
			for(let i = 0; i < l; i++) {
				this.processes[i].deactivateProcess();
			}	
			status = 'info';
			message = "Бот перестанет работать после завершения текущего цикла";


			
			// this._log(message)
			// console.log('deactivate bot') 
			await this.syncUpdateBot(user)
		}
		else {
			this.status = CONSTANTS.BOT_STATUS.INACTIVE
			status = 'error'
			message = "Ошибка (Возможно вы пытаетесь включить бота, который не завершил свой последний цикл)"
			this._log(message)
			await this.syncUpdateBot(user)
		}
		return {
			status: status,
			data: { status: this.status },
			message: message
		}
	}

	async startManual(user) {
		this.currentOrder = {};
		console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAaa', this.processes)
		if(Object.keys(this.processes).length === 0) {
			console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAaa')
			let resObj = {
				symbol: this.getPair(),
				botSettings: this.botSettings,
				botID: this.botID,
				user: this.user
			},
				newProcess = new Process(resObj);

			this.processes[newProcess._id] = newProcess;
			await this.syncUpdateBot(user);
			this.processes[newProcess._id].startTrade(user)
				.catch(err => console.log(err));
		}

		// console.log('- manual')
		// this.startTradeManual(user)
		// .catch((err) => console.log(err))
		
	}

	startAuto(user) {
		console.log('- auto')
		this.setClient(user)
		this.currentOrder = {}
		this.startTradeAuto(user)
		.catch( err => console.log(err) )
	}

	setQuantity(price = 0, quantity = 0) {
		this.botSettings.quantity = price ? this.toDecimal(Number(this.botSettings.currentOrder)/ price) : Number(quantity)
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
		if(!safeFlag)
			return price ? this.toDecimal(Number(this.botSettings.currentOrder) / price) : Number(this.botSettings.quantity)
		else 
			return this.toDecimal(Number(this.botSettings.safeOrder.size) / price)
	}
	
	recountQuantity(quantity = 0, side = 0) {
		quantity = Number(quantity)
		let current = Number(this.botSettings.quantity)
		current += Math.pow(-1, side) * quantity
		current = this.toDecimal(current)
		this.botSettings.quantity = current
		return current
	}
	
	getPair(from = this.pair.from) {
		return from + this.pair.to
	}

	countDecimalNumber(x) {
		return (x.toString().includes('.')) ? (x.toString().split('.').pop().length) : (0);
	} 

	getDecimal(price = 0) {
		price = price ? price : this.botSettings.decimalQty
		let ret = this.countDecimalNumber(price)
		return ret
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

	getBTCVolume() {
		return Number(this.botSettings.dailyVolumeBTC)
	}

	toDecimal(value = 0, decimal = this.getDecimal()) {
		return Number(Number(value).toFixed(decimal))
	}

	async getLastPrice() {
		let pair = this.getPair(),
			price = await this.Client.prices()
		return Number(price[pair])
	}

	async newBuyOrder(price = 0, type = CONSTANTS.ORDER_TYPE.LIMIT, quantity = this.getQuantity(price), prevError = {}) {
		console.log(`new BUY order (${price}) ${quantity}...`)
		console.log('---! newBuyOrder')
		
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

			this._log('попытка создать ордер - ' + newBuyOrder.price + ', ' + newBuyOrder.origQty)
			return new Order(newBuyOrder)
		}
		catch(error) {
			this._log(this.errorCode(error))
			if(quantity > 0) {
				let step = this.botSettings.decimalQty
				if(
					(this.isError1013(error) && this.isError2010(prevError)) ||
					(this.isError1013(prevError) && this.isError2010(error))
				) return await this.disableBot('Невозможно купить монеты')
				else if(this.isError1013(error)) quantity += step
				else if(this.isError2010(error)) quantity -= step
				
				let order = await this.newBuyOrder(price, type, this.toDecimal(quantity), error)
				return order
			}
			else return {}
		}
	}

	async newSellOrder(price = 0, type = CONSTANTS.ORDER_TYPE.LIMIT, quantity = this.getQuantity(price), prevError = {}) {
		console.log(`new SELL order (${price}) ${quantity} ${type}...`)
		console.log('---! newSellOrder')
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
			this.recountQuantity(newSellOrder.origQty, 1)
			this._log('попытка создать ордер - ' + newSellOrder.price + ', ' + newSellOrder.origQty)
			return new Order(newSellOrder)
		}
		catch(error) {
			this._log(this.errorCode(error))
			if(quantity > 0) {
				let step = this.botSettings.decimalQty
				if(
					(this.isError1013(error) && this.isError2010(prevError)) ||
					(this.isError1013(prevError) && this.isError2010(error))
				) return await this.disableBot('Невозможно продать монеты')
				else if(this.isError1013(error)) quantity += step
				else if(this.isError2010(error)) quantity -= step
				console.log('newSell', price,  this.toDecimal(quantity))
				let order = await this.newSellOrder(price, type, this.toDecimal(quantity), error)
				return order
			}
			else return {}
		}
	}

	async createSafeOrders(price = 0, quantity = 0) {
		console.log('--- createSafeOrders')
		this._log('создание страховочных ордеров')
		price = Number(price)
		let amount = this.getMaxOpenedAmount(),
			safeOrders = [],
			curPrice = price,
			curQty = quantity
		for(let i = 0; i < amount; i++) {
			let newOrder = {}
			if(!this.getMartingaleActive())
				newOrder = await this.createSafeOrder(curPrice)
			else 
				newOrder = await this.createSafeOrder(curPrice, curQty)
			curPrice = newOrder.price
			curQty = newOrder.origQty
			if(newOrder.orderId)
				safeOrders.push(newOrder)
		}
		return safeOrders
	}
	
	async createSafeOrder(price = 0, quantity = 0) {
		console.log('---! createSafeOrder')
		this._log('новый страховочный ордер')
		price = Number(price)
		let maxOpenSO = this.getMaxOpenedAmount(),
			currentQtyUsedSO = this.getQtyOfUsedSafeOrders(),
			currentQtyActiveSO = this.getQtyOfActiveSafeOrders(),
			maxAmountSO = this.getAmount(),
			deviation = this.getDeviation(),
			lastSafeOrder = this.lastSafeOrder() || {},
			decimal = this.getDecimal(price || Number(lastSafeOrder.price)),
			newOrder = {}
		if(maxOpenSO > currentQtyActiveSO && maxAmountSO > currentQtyUsedSO) {
			this.botSettings.quantityOfUsedSafeOrders ++
			this.botSettings.quantityOfActiveSafeOrders ++
			let lastSafeOrderPrice = Number(lastSafeOrder.price) || price,
				newPrice = this.toDecimal(lastSafeOrderPrice - lastSafeOrderPrice * deviation, decimal),
				qty = 0
			if(quantity) qty = this.toDecimal(quantity * this.getMartingaleValue()) 
			else if(this.getMartingaleActive()) qty = this.toDecimal(Number(lastSafeOrder.origQty) * this.getMartingaleValue())
			else qty = this.getQuantity(newPrice, 1)

			try {
				newOrder = await this.newBuyOrder(newPrice, CONSTANTS.ORDER_TYPE.LIMIT, qty)
			}
			catch(error) {
				this._log(error)
			}
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

	async firstBuyOrder(user = {}, orderId = 0) {
		console.log('--- firstBuyOrder')
		this._log('первая закупка монет')
		let order = {}
		
		console.log(this.orders.length)
		if(!orderId) {
			let price = await this.getLastPrice(),
				quantity = this.setQuantity(price), 
				newBuyOrder = await this.newBuyOrder(price, CONSTANTS.ORDER_TYPE.LIMIT, quantity)
			orderId = newBuyOrder.orderId
		}
		
		console.log(this.orders.length)
		order = await this.getOrder(orderId) 
		this.orders.push(order)
		await this.syncUpdateBot(user)
		this._log('первый закупочный - ' + order.price + ', ' + order.origQty)
		
		console.log(this.orders.length)
		while(!(
			this.checkFilling(order.status) ||
			this.checkCanceling(order.status) || 
			this.checkFailing(order.status)
		))
		{ 
			console.log('1')
			order = await this.getOrder(orderId) 
			const ind = this.orders.findIndex(elem => elem.orderId === order.orderId)
			if(ind === -1) this.orders.push(new Order(order))
			else this.orders[ind] = new Order(order)
			console.log(this.orders.length)
			await this.syncUpdateBot(user)

			sleep(CONSTANTS.ORDER_TIMEOUT)
		}


		if(this.checkFilling(order.status)) {
			return new Order(order)
		}
		else if(this.checkCanceling(order.status) || this.checkFailing(order.status)) {
			return {}
		}
	}

	async startTradeAuto(user, message = '') {
		console.log('-- startTradeAuto', message)
		this._log('начало торговли автобота (' + message + ')')
		if(!message) await this.pushTradingSignals()
		let signal = await this.checkSignals(user)
		console.log('найдены подходящие условия для пары - ' + signal.symbol);
		this._log('найдены подходящие условия для пары - ' + signal.symbol);
		await this.syncUpdateBot(user);
		if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) {
			this.pair.from = this.findFromSymbol(signal.symbol)
			console.log(this.pair.from)
			console.log(this.getPair())
				if(this.pair.from) {
					this._log('торговая пара найдена, начало торговли...')
					this.botSettings.decimalQty = await Symbols.getLotSize(this.getPair())
					console.log('signal = ' + signal)
					let newBuyOrder = await this.firstBuyOrder(user)
					if(newBuyOrder.orderId) {
						let qty = this.setQuantity(null, Number(newBuyOrder.origQty))
						let price = Number(newBuyOrder.price)

						this.botSettings.firstBuyPrice = price
						let profitPrice = this.getProfitPrice(price)
						let newSellOrder = await this.newSellOrder(profitPrice, CONSTANTS.ORDER_TYPE.LIMIT, qty)
						this._log('новый ордер на продажу - ' + newSellOrder.price + ', ' + newSellOrder.origQty)
						if(newSellOrder !== CONSTANTS.DISABLE_FLAG) await this.syncUpdateBot(user)
						this.currentOrder = newSellOrder
						this.orders.push(newSellOrder)

						this.tradeAuto(user)
						.catch(err => {
							this._log(err)
							console.log(err)
						})
					}
					else {
						await this.disableBot('начальный ордер не купился', CONSTANTS.CONTINUE_FLAG)
						await this.syncUpdateBot(user) 
						if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) this.startTradeAuto(user)
					}
				}
		}
		else {
			await this.clearTradingSignals();
			await this.disableBot('выключили во время поиска пар');
			await this.syncUpdateBot(user);
		}
	}

	async checkVolumeBTC() {
		this._log('проверка текущего объема BTC')
		let pair = this.getPair(),
			currentBTCvolume = this.getBTCVolume(),
			BTCvolume = await this.Client.dailyStats({ symbol: pair })
		BTCvolume = Number(BTCvolume.quoteVolume)
		if(currentBTCvolume <= BTCvolume)
			return true
		else return await this.checkVolumeBTC()
	}

	findFromSymbol(symbol = '') {
		let ret = false
		this.pair.requested.forEach(elem => {
			console.log(elem, symbol)
			if(symbol.indexOf(elem) >= 0) ret = elem
		})
		return ret
	}

	async checkSignals(user) {
		let ret = {
			flag: false,
			signal: {}
		}
		
		while(!ret.flag && this.status !== CONSTANTS.BOT_STATUS.INACTIVE) {
			await sleep(CONSTANTS.ORDER_TIMEOUT)
			this._log('проверка сигналов...')
			await this.syncUpdateBot(user)
			let signals = await Mongo.syncSelect({}, CONSTANTS.TRADING_SIGNALS_COLLECTION)
			console.log('lol')
			signals.forEach(signal => {
				this.isCurrentSignal(signal)
			})
			await this.syncUpdateBot(user)
			for(let i = 0; i < this.botSettings.curTradingSignals.length; i++) {
				let signal = this.botSettings.curTradingSignals[i];
				if(this.isEqualSignals(signal)) {
					ret = {
						flag: true,
						signal: signal
					}
					break;
				}
			}
		}
		return ret.signal
	}

	isEqualSignals(signal) {
		return signal.checkRating === signal.rating || (signal.checkRating === CONSTANTS.TRANSACTION_TERMS.BUY && signal.rating === CONSTANTS.TRANSACTION_TERMS.STRONG_BUY)
	}

	isCurrentSignal(signal) {
		console.log('-------------------')
		let ret = false,
			symbol = this.getPair(),
			ind = this.botSettings.curTradingSignals.findIndex(elem => elem.id === signal.id)
		if(ind !== -1) {
			this.botSettings.curTradingSignals[ind].rating = signal.rating
			ret = true
		}
		console.log('-------------------')
		return ret
	}

	async tradeAuto(user) {
		console.log('----------- tradeAuto ------------')
		if(this.currentOrder.orderId) {
			console.log(this.currentOrder)
			this.currentOrder = await this.getOrder(this.currentOrder.orderId)
			let currentOrderStatus = this.currentOrder.status

			if(this.checkFilling(currentOrderStatus) && !Number(this.freeze) && !Number(this.preFreeze)) {
				await this.clearTradingSignals()
				await this.disableBot('|is END', CONSTANTS.CONTINUE_FLAG)
				await this.syncUpdateBot(user)
				if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) this.startTradeAuto(user)
			}
			else if(this.checkFailing(currentOrderStatus) && !Number(this.freeze) && !Number(this.preFreeze)) {
				await this.clearTradingSignals()
				await this.disableBot('|is FAIL or ENDING', CONSTANTS.CONTINUE_FLAG)
				await this.syncUpdateBot(user)
				if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) this.startTradeAuto(user)
			}
			else {
				if(this.freeze === CONSTANTS.BOT_FREEZE_STATUS.INACTIVE) {
					await this.isProcess(user)
					this.orders = await this.updateOrders(this.orders)
				}
				if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) {
					const activeF = CONSTANTS.BOT_FREEZE_STATUS.ACTIVE,
						inactiveF = CONSTANTS.BOT_FREEZE_STATUS.INACTIVE
					if(this.freeze === activeF && this.preFreeze === inactiveF) {
						await this.freezeBot(user)
						setTimeout(() => this.tradeAuto(user), CONSTANTS.TIMEOUT)
					}
					else if(this.freeze === inactiveF && this.preFreeze === activeF) {
						await this.unfreezeBot(user)
						setTimeout(() => this.tradeAuto(user), CONSTANTS.TIMEOUT)
					}
					else {
						console.warn('----- general tradeAuto')
						setTimeout(() => this.tradeAuto(user), CONSTANTS.TIMEOUT)
					}
				}
				else if(this.status === CONSTANTS.BOT_STATUS.INACTIVE) {
					if(this.currentOrder.orderId) {
						console.log('------ wait for disabling bot')
						const activeF = CONSTANTS.BOT_FREEZE_STATUS.ACTIVE,
						inactiveF = CONSTANTS.BOT_FREEZE_STATUS.INACTIVE
						if(this.freeze === activeF && this.preFreeze === inactiveF) {
							await this.freezeBot(user)
							setTimeout(() => this.tradeAuto(user), CONSTANTS.TIMEOUT)
						}
						else if(this.freeze === inactiveF && this.preFreeze === activeF) {
							await this.unfreezeBot(user)
							setTimeout(() => this.tradeAuto(user), CONSTANTS.TIMEOUT)
						}
						else {
							setTimeout(() => this.tradeAuto(user), CONSTANTS.TIMEOUT)
						}
					}
					else {
						console.log('----- bot is disabled')
						await this.clearTradingSignals()
						await this.disableBot('нажали выкл -> бот завершил работу -> выключаем бота')
					}
				}
			}
		}
		else if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) this.startTradeAuto(user);
		await this.syncUpdateBot(user)
	}

	async pushTradingSignals() {
		console.log('---- pushTradingSignals')
		this._log('создание сигналов трайдинг вью')
		let signals = this.botSettings.tradingSignals,
			l = signals.length,
			pairs = this.pair.requested,
			pairsL = pairs.length,
			newTrSs = []
		
		for(let j = 0; j < pairsL; j++) {
			let pair = pairs[j]
			console.log(pair)
			for(let i = 0; i < l; i++) {
				signals[i].symbol = this.getPair(pair)
				let id = md5(Math.random()*(new Date).getMilliseconds()*2/1213545/Math.random() + signals[i].symbol + (i*j*Math.pow(i, j*Math.random())))
				let signal = new TradingSignals(signals[i], id)
				newTrSs.push(signal)
				console.log(signal.id)
				await Mongo.syncInsert(signal, CONSTANTS.TRADING_SIGNALS_COLLECTION)
			}
		}
		this.botSettings.curTradingSignals = newTrSs
	}

	async clearTradingSignals() {
		console.log('[ clearTradingSignals')
		let signals = this.botSettings.curTradingSignals,
			l = signals.length
		for(let i = 0; i < l; i++) {
			let signal = signals[i]	
			console.log(signal)
			console.log(`clear ${i+1} signal (${signal.id})`)
			await Mongo.syncDelete({ id: signal.id }, CONSTANTS.TRADING_SIGNALS_COLLECTION)
		}
		this.botSettings.curTradingSignals = []
		this.pair.from = '';
		console.log('] clearTradingSignals')
	}

	async startTradeManual(user) {
		console.log('-- startTradeManual')
		let newBuyOrder = await this.firstBuyOrder(user)
		if(newBuyOrder.orderId) {
			let qty = this.setQuantity(null, Number(newBuyOrder.origQty))
			let price = Number(newBuyOrder.price)

			this.botSettings.firstBuyPrice = price
			let profitPrice = this.getProfitPrice(price)
			let newSellOrder = await this.newSellOrder(profitPrice, CONSTANTS.ORDER_TYPE.LIMIT, qty)
			if(newSellOrder !== CONSTANTS.DISABLE_FLAG) await this.syncUpdateBot(user)
			if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) {
				this.currentOrder = newSellOrder
				this.orders.push(newSellOrder)

				let safeOrders = await this.createSafeOrders(price, qty)
				this.safeOrders.push(...safeOrders)
				this.orders.push(...safeOrders)

				this.tradeManual(user)
				.catch(err => {
				})
			}
		}
		else {
			await this.disableBot('начальный ордер не купился', CONSTANTS.CONTINUE_FLAG)
			await this.syncUpdateBot(user) 
			if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) this.startTradeManual(user)
		}
	}

	errorCode(error = new Error('default err')) {
		return JSON.parse(JSON.stringify(error)).code
	}

	isError1021(error = new Error('default err')) { //Timestamp for this request is outside of the recvWindow 	
		let code = this.errorCode(error)
		console.log(code)
		this._log('ошибка code:' + code + ', Timestamp for this request is outside of the recvWindow')
		return code === -1021
	}

	isError1013(error = new Error('default err')) { //MIN_NOTATIAN
		let code = this.errorCode(error)
		console.log(code)
		this._log('ошибка code:' + code + ', MIN_NOTATIAN')
		return code === -1013
	}

	isError2010(error = new Error('default err')) { // insufficient balance
		let code = this.errorCode(error)
		console.log(code)
		this._log('ошибка code:' + code + ', insufficient balance')
		return code === -2010
	}

	async tradeManual(user) {
		console.log('----------- tradeManual ------------')
		if(this.currentOrder.orderId) {
			this.currentOrder = await this.getOrder(this.currentOrder.orderId)
			let currentOrderStatus = this.currentOrder.status
			
			if(this.checkFilling(currentOrderStatus) && !Number(this.freeze) && !Number(this.preFreeze)) {
				await this.disableBot('|is END', CONSTANTS.CONTINUE_FLAG)
				await this.syncUpdateBot(user)
				if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) this.startManual(user)
			}
			else if(this.checkFailing(currentOrderStatus) && !Number(this.freeze) && !Number(this.preFreeze)) {
				await this.disableBot('|is FAIL or ENDING', CONSTANTS.CONTINUE_FLAG)	
				await this.syncUpdateBot(user)
				if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) this.startManual(user)
			}
			else {
				if(this.freeze === CONSTANTS.BOT_FREEZE_STATUS.INACTIVE) {
					await this.isProcess(user)
					this.orders = await this.updateOrders(this.orders)
				}
				if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) {
					const activeF = CONSTANTS.BOT_FREEZE_STATUS.ACTIVE,
						inactiveF = CONSTANTS.BOT_FREEZE_STATUS.INACTIVE
					if(this.freeze === activeF && this.preFreeze === inactiveF) {
						await this.freezeBot(user)
						setTimeout(() => this.tradeManual(user), CONSTANTS.TIMEOUT)
					}
					else if(this.freeze === inactiveF && this.preFreeze === activeF) {
						await this.unfreezeBot(user)
						setTimeout(() => this.tradeManual(user), CONSTANTS.TIMEOUT)
					}
					else {
						console.warn('----- general tradeManual')
						setTimeout(() => this.tradeManual(user), CONSTANTS.TIMEOUT)
					}
				}
				else if(this.status === CONSTANTS.BOT_STATUS.INACTIVE) {
					if(this.currentOrder.orderId) {
						console.log('------ wait for disabling bot')
						const activeF = CONSTANTS.BOT_FREEZE_STATUS.ACTIVE,
						inactiveF = CONSTANTS.BOT_FREEZE_STATUS.INACTIVE
						if(this.freeze === activeF && this.preFreeze === inactiveF) {
							await this.freezeBot(user)
							setTimeout(() => this.tradeManual(user), CONSTANTS.TIMEOUT)
						}
						else if(this.freeze === inactiveF && this.preFreeze === activeF) {
							await this.unfreezeBot(user)
							setTimeout(() => this.tradeManual(user), CONSTANTS.TIMEOUT)
						}
						else {
							setTimeout(() => this.tradeManual(user), CONSTANTS.TIMEOUT)
						}
					}
					else {
						console.log('----- bot is disabled')
						await this.disableBot('нажали выкл -> бот завершил работу -> выключаем бота')
					}
				}
			}
		}
		await this.syncUpdateBot(user)
	}

	async isProcess(user) {
		console.log('---- in PROCESS' + this.title)
		this._log('в процессе')
		let orders = this.safeOrders || [],
			length = orders.length
		if(length) {
			console.log('----- checked safeorders')
			let nextSafeOrders = []
			for(let i = 0; i < length; i++) {
				try {
					let order = await this.getOrder(orders[i].orderId)
					this.botSettings.quantityOfActiveSafeOrders -- 
					if(this.checkFilling(order.status)) {
						await this.cancelOrder(this.currentOrder.orderId)
						this.recountInitialOrder(order)
						this.recountQuantity(order.origQty)
						let newProfitPrice = this.recountProfitPrice(order)
						let newSellOrder = await this.newSellOrder(newProfitPrice, CONSTANTS.ORDER_TYPE.LIMIT, this.getQuantity())
						if(newSellOrder !== CONSTANTS.DISABLE_FLAG) await this.syncUpdateBot(user)
						let newSafeOrder = await this.createSafeOrder(null)
						this.currentOrder = newSellOrder
						this.orders.push(this.currentOrder)
						if(newSafeOrder.orderId) {
							this.orders.push(newSafeOrder)
							nextSafeOrders.push(newSafeOrder)
						}
					}
					else if(this.checkCanceling(order.status)) {
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
				}
			}
			this.safeOrders = nextSafeOrders
		}
		else {
			console.log('----- checked stoploss')
			let price = await this.getLastPrice(),
				stopPrice = this.getStopPrice()
			console.log(`price - ${price}`)
			console.log(`stopPrice - ${stopPrice}`)
			if(stopPrice > price) {
				console.log('------ stoploss is braked')
				await this.cancelAllOrders(user)
				await this.disableBot('Все распродано по рынку, бот выключен', CONSTANTS.CONTINUE_FLAG);
				(this.state === CONSTANTS.BOT_STATE.AUTO) && await this.clearTradingSignals();
			}
		}
		await this.syncUpdateBot(user)
		sleep(CONSTANTS.TIMEOUT)
	}

	recountInitialOrder(order) {
		let size = order ? Number(order.cummulativeQuoteQty) : Number(this.botSettings.safeOrder.size);
		this.botSettings.currentOrder = String(Number(this.botSettings.currentOrder) + size);
	}

	recountProfitPrice(nextOrder) {
		let prevProfitPrice = Number(this.currentOrder.price),
			nextProfitPrice = Number(this.getProfitPrice(nextOrder.price)),
			decimal = this.getDecimal(prevProfitPrice),
			averagePrice = (prevProfitPrice + nextProfitPrice) / 2,
			newProfitPrice = this.toDecimal(averagePrice, decimal)
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
			});
		}
		catch(error) {
			this._log(error)
			if(this.isError1021(error)) order = await this.getOrder(orderId)
		}
		return new Order(order)
	}

	async cancelOrder(orderId) {
		orderId = Number(orderId)
		try {
			let pair = this.getPair()
			let order = await this.getOrder(orderId),
				side = order.side,
				qty = order.origQty,
				status = '',
				message = ''
			try {
				var cancelOrder = await this.Client.cancelOrder({
					symbol: pair,
					orderId: orderId
				})
				if(this.isOrderSell(side)) {
					this.recountQuantity(qty)
				}
				status = 'ok'
				message = `ордер ${cancelOrder.orderId} завершен`
			}
			catch(error) {
				status = 'error'
				message = `ошибка при завершении ордера ${cancelOrder.orderId}`
			}
			this._log('закрытие ордера - ' + message)
			return {
				status: status,
				message: message,
				data: { order: cancelOrder }
			}
		}
		catch(error) {
			this._log('закрытие ордера - ' + error)
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
		console.log('------- updateOrders')
		let pair = this.getPair(),
			nextOrders = []
		for(let i = 0; i < orders.length; i++) {
			try{
				if(!orders[i].isUpdate) {
					let orderData = await this.Client.getOrder({
						symbol: pair,
						orderId: orders[i].orderId
					})
					let order = new Order(orderData)
					if(this.checkFailing(order.status) || this.checkFilling(order.status)) order.isUpdate = true
					nextOrders.push(order)
				}
				else {
					nextOrders.push(orders[i])
				}
			}
			catch(error) {
			}
		}
		return nextOrders
	}

	async createOrders(orders = []/*, type = 'safe'*/) {
		const length = orders.length
		let newOrders = []

		for(let i = 0; i < length; i++) {
			let order = await this.createOrder(orders[i])
			if(order.orderId)
				newOrders.push(order)
		}

		return newOrders
	}

	async createOrder(order = {}) {
		let { side, price, type, origQty } = order,
			newOrder = {}

		if(side === CONSTANTS.ORDER_SIDE.BUY) 
			newOrder = await this.newBuyOrder(price, type, origQty)
		else if(side === CONSTANTS.ORDER_SIDE.SELL) 
			newOrder = await this.newSellOrder(price, type, origQty)

		return newOrder
	}

	async cancelOrders(orders) {
		for(let i = 0; i < orders.length; i++) {
			await this.cancelOrder(orders[i].orderId)
		}
	}

	async disableBot(message, isContinue = false) {
		console.log('[----- disableBot ' + message)
		this._log(`выключение бота, причина (${message})`)
		if(this.pair.from) await this.cancelOrders(this.safeOrders)
		this.safeOrders = []
		this.currentOrder = {}
		this.botSettings.quantityOfUsedSafeOrders = 0
		this.botSettings.quantityOfActiveSafeOrders = 0
		this.botSettings.currentOrder = this.botSettings.initialOrder
		this.botSettings.firstBuyPrice = 0
		if(this.pair.from) this.orders = await this.updateOrders(this.orders)
		if(!isContinue) this.status = CONSTANTS.BOT_STATUS.INACTIVE
		console.log(']----- disableBot ')
		return 'disable'
	}

	async cancelAllOrders(user) {
		console.log('----- cancel all orders and sell it')
		this._log('завершение всех ордеров и продажа по рынку')
		try{
			await this.cancelOrders(this.safeOrders)
			await this.cancelOrder(this.currentOrder.orderId)
			let lastPrice = await this.getLastPrice(),
				qty = this.getQuantity();
				console.log('8****************************************************')
				console.log(qty)
			let newOrder = await this.newSellOrder(lastPrice, CONSTANTS.ORDER_TYPE.MARKET, qty)
			
			if(newOrder !== CONSTANTS.DISABLE_FLAG) await this.syncUpdateBot(user)
			this.orders.push(newOrder)
			this.orders = await this.updateOrders(this.orders)
			await this.syncUpdateBot(user)
			return {
				status: 'info',
				message: 'Все ордера отменены и монеты распроданы по рынку'
			}
		}
		catch(error) {
			console.log(error)
			this._log(error)
			return {
				status: 'error',
				message: `Ошибка при "отменить и продать все"(код ошибки ${this.errorCode(error)}) :: ${error}`
			}
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
			Mongo.update(user, {bots: data.bots}, 'users', () => console.log('update bot end'))
		})
	}

	async syncUpdateBot(user, message) {
		console.log('[ sync upd ')
		await this.syncUpdateUserOrdersList(user)
		user = { name: user.name }
		let data = await Mongo.syncSelect(user, 'users')
		data = data[0]
		let tempBot = new Bot(this)
		const index = data.bots.findIndex(bot => {
			return bot.botID === tempBot.botID
		})
		data.bots[index] = tempBot
		await Mongo.syncUpdate(user, {bots: data.bots}, 'users');
		console.log('] sync upd ')
	}

	async syncUpdateUserOrdersList(user) {
		console.log('[ syncUpdateUserOrdersList')
		user = { name: user.name }
		let data = await Mongo.syncSelect(user, 'users')
		data = data[0]
		let ordersList = data.ordersList
		!ordersList && (ordersList = {})
		let _id = `${this.title}${this.botID}`
		!ordersList[_id] && (ordersList[_id] = [])
		ordersList[_id] = this.orders
		await Mongo.syncUpdate(user, {ordersList:  ordersList}, 'users')

		console.log('] syncUpdateUserOrdersList')
	}

	async updateBotParams(user) {
		console.log('[---- updateBotParams')
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
		
		console.log(']---- updateBotParams')
	}

	async unfreezeBot(user) {
		this._log('разморозка бота начата')
		console.warn('------ unfreezeing bot')
		this.preFreeze = CONSTANTS.BOT_FREEZE_STATUS.INACTIVE

		let newSafeOrders = await this.createOrders(this.freezeOrders.safe),
			newCurOrder = await this.createOrder(this.freezeOrders.current)

		this.safeOrders = newSafeOrders
		this.currentOrder = newCurOrder
		this.orders.push(...this.safeOrders)
		this.orders.push(this.currentOrder)
		await this.syncUpdateBot(user)
		this._log('заморозка бота завершена')
	}

	cloneDeep(obj) { // полное клонирование объекта
		return Object.assign({}, obj)
		return JSON.parse(JSON.stringify(obj))
	}

	async freezeBot(user) {
		console.warn('------ freezeing bot')
		this._log('заморозка бота...')
		this.preFreeze = CONSTANTS.BOT_FREEZE_STATUS.ACTIVE

		let freezeSO = [],
			freezeCO = this.cloneDeep(this.currentOrder)
		this.safeOrders.forEach(order => {
			freezeSO.push(new Order(order))
		})
		
		this.freezeOrders.safe = freezeSO
		this.freezeOrders.current = freezeCO

		await this.cancelOrders(this.safeOrders)
		await this.cancelOrder(this.currentOrder.orderId)
		await this.syncUpdateBot(user)
		this._log('бот заморожен')
	}

	async changeFreeze(nextFreeze, user) {
		console.log('[------- changeFreeze')
		const active = CONSTANTS.BOT_FREEZE_STATUS.ACTIVE,
			inactive = CONSTANTS.BOT_FREEZE_STATUS.INACTIVE
		let res = {
			status: 'error',
			message: 'Получены неверные данные.'
		}
		if(nextFreeze === inactive) {
			console.log('------- inactive')
			this.preFreeze = this.freeze
			this.freeze = inactive
			res = {
				status: 'info',
				data: { freeze: this.freeze },
				message: 'Бот будет разморожен.'
			}
		}
		else if(nextFreeze === active) {
			console.log('------- active')
			this.preFreeze = this.freeze
			this.freeze = active
			res = {
				status: 'info',
				data: { freeze: this.freeze },
				message: 'Бот будет заморожен.'
			}
		}
		await this.syncUpdateBot(user, 'ОБНОВЛЕние ФРЕЕЕЕЗЕЕЕ БООТ')
		console.log(']------- changeFreeze')
		this._log('изменение состояния заморозки бота - ' + res.message)
		return res
	}
}