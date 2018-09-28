const CONSTANTS = require('../constants');
const Order = require('./Order');
const Crypto = require('../modules/Crypto');
const binanceAPI = require('binance-api-node').default;
const Mongo = require('./Mongo');
const sleep = require('system-sleep');
const uniqid = require('uniqid');
const PRC = CONSTANTS.PRC;

module.exports = class Process {
	constructor({
		_id = uniqid(PRC),
		symbol = '',
		status = CONSTANTS.BOT_STATUS.INACTIVE,
		freeze = CONSTANTS.BOT_FREEZE_STATUS.INACTIVE,
		preFreeze = freeze,
		currentOrder = {},
		orders = [],
		safeOrders = [],
		freezeOrders = {
			safe: [],
			current: {}
		},
		log = [],
		botSettings = {},
		user = {},
		botID = String(Date.now())
	} = {}) {
		this._id = _id;
		this.symbol = symbol;
		this.status = status;
		this.freeze = freeze;
		this.preFreeze = preFreeze;
		this.currentOrder = currentOrder;
		this.orders = orders;
		this.safeOrders = safeOrders;
		this.freezeOrders = freezeOrders;
		this.botSettings = botSettings;
		this.log = log;
		if(user) this.setClient(user);
		this.user = user;
		this.botID = botID;
	}

	async startTrade(user) {
		await this._log('Начало нового цикла торговли.');
		this.setClient(user);
		this.currentOrder = {};

		let newBuyOrder = await this.firstBuyOrder(user);
		if(newBuyOrder.orderId) {
			let qty = this.setQuantity(null, Number(newBuyOrder.origQty));
			let price = Number(newBuyOrder.price);

			this.botSettings.firstBuyPrice = price;
			let profitPrice = this.getProfitPrice(price);
			let newSellOrder = await this.newSellOrder(profitPrice, CONSTANTS.ORDER_TYPE.LIMIT, qty);
			if(newSellOrder !== CONSTANTS.DISABLE_FLAG) await this.updateProcess(user);
			if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) {
				this.currentOrder = newSellOrder;
				this.orders.push(newSellOrder);

				let safeOrders = await this.createSafeOrders(price, qty);
				this.safeOrders.push(...safeOrders);
				this.orders.push(...safeOrders);

				this.trade(user)
					.catch(err => console.log(err));
			}
		}
		else {
			await this.disableProcess('Неуспешная покупка начального ордера.', CONSTANTS.CONTINUE_FLAG)
			await this.updateProcess(user) 
			if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) this.startTradeManual(user)
		}
	}

	continueTrade(user = this.user) {
		console.log('****************continueTrade****************  ' + this._id);
		if(this.setClient(user)) {
			this.trade(user)
				.catch(err => console.log(err));
		}
	}

	async trade(user = this.user) {
		console.log('----------- trade ------------' + this._id);
		if(this.currentOrder.orderId) {
			this.currentOrder = await this.getOrder(this.currentOrder.orderId);
			let currentOrderStatus = this.currentOrder.status;
			
			if(this.checkFilling(currentOrderStatus) && !Number(this.freeze) && !Number(this.preFreeze)) {
				await this.disableProcess('Процесс удачно завершён.', CONSTANTS.CONTINUE_FLAG);
				await this.updateProcess(user);
				if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) this.startTrade(user);
			}
			else if(this.checkFailing(currentOrderStatus) && !Number(this.freeze) && !Number(this.preFreeze)) {
				await this.disableProcess('Процесс завершен, причина - выключение бота или ошибка.', CONSTANTS.CONTINUE_FLAG);
				await this.updateProcess(user);
				if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) this.startTrade(user);
			}
			else {
				if(this.freeze === CONSTANTS.BOT_FREEZE_STATUS.INACTIVE) {
					await this.process(user);
					this.orders = await this.updateOrders(this.orders);
				}
				if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) {
					this.checkFreezeStatus(user);
				}
				else if(this.status === CONSTANTS.BOT_STATUS.INACTIVE) {
					if(this.currentOrder.orderId) {
						console.log('------ wait for disabling bot');
						this.checkFreezeStatus(user);
					}
					else {
						console.log('----- bot is disabled');
						await this.disableProcess('нажали выкл -> бот завершил работу -> выключаем бота');
					}
				}
			}
		}
		await this.updateProcess(user)
	}

	nextTradeStep(user = this.user) {
		setTimeout(() => this.trade(user), CONSTANTS.TIMEOUT);
	}

	async process(user = this.user) {
		console.log('---- in PROCESS' + this.title);
		await this._log('Проверка состояния ордеров...');
		let orders = this.safeOrders || [],
			length = orders.length;
		if(length) {
			console.log('----- checked safeorders');
			let nextSafeOrders = [];
			for(let i = 0; i < length; i++) {
				try {
					let order = await this.getOrder(orders[i].orderId);
					this.botSettings.quantityOfActiveSafeOrders --;

					if(this.checkFilling(order.status)) {
						await this.cancelOrder(this.currentOrder.orderId);
						this.recountInitialOrder(order);
						this.recountQuantity(order.origQty);

						let newProfitPrice = this.recountProfitPrice(order),
						newSellOrder = await this.newSellOrder(newProfitPrice, CONSTANTS.ORDER_TYPE.LIMIT, this.getQuantity());

						if(newSellOrder !== CONSTANTS.DISABLE_FLAG) await this.updateProcess(user);
						let newSafeOrder = await this.createSafeOrder(null);

						this.currentOrder = newSellOrder;
						this.orders.push(this.currentOrder);

						if(newSafeOrder.orderId) {
							this.orders.push(newSafeOrder);
							nextSafeOrders.push(newSafeOrder);
						}
					}
					else if(this.checkCanceling(order.status)) {
						let newSafeOrder = await this.createSafeOrder(null);

						if(newSafeOrder.orderId) {
							this.orders.push(newSafeOrder);
							nextSafeOrders.push(newSafeOrder);
						}
					}
					else {
						nextSafeOrders.push(order);
					}
				}
				catch(error) {
					console.log(error);
				}
			}
			this.safeOrders = nextSafeOrders;
		}
		else {
			console.log('----- checked stoploss');
			let price = await this.getLastPrice(),
				stopPrice = this.getStopPrice();
			
			await this._log(`Проверка stoploss. (${stopPrice})`);
			console.log(`stopPrice - ${stopPrice}`);

			if(stopPrice > price) {
				console.log('------ stoploss is braked')
				await this._log(`Stoploss пройден.`);
				await this.cancelAllOrders(user);
				await this.disableProcess('Все распродано по рынку, бот выключен', CONSTANTS.CONTINUE_FLAG);
			}
		}
		await this.updateProcess(user);
		sleep(CONSTANTS.TIMEOUT);
	}

	async firstBuyOrder(user = this.user, orderId = 0) {
		console.log('--- firstBuyOrder');
		await this._log('первая закупка монет');
		let order = {};
		
		if(!orderId) {
			let price = await this.getLastPrice(),
				quantity = this.setQuantity(price), 
				newBuyOrder = await this.newBuyOrder(price, CONSTANTS.ORDER_TYPE.LIMIT, quantity);
			orderId = newBuyOrder.orderId;
		}
		
		order = await this.getOrder(orderId);
		this.orders.push(order);
		await this.updateProcess(user);
		await this._log('первый закупочный - ' + order.price + ', ' + order.origQty + ', (~total ' + (order.price * order.origQty) + ')...');
		
		while(!(
			this.checkFilling(order.status) ||
			this.checkCanceling(order.status) || 
			this.checkFailing(order.status)
		)) { 
			order = await this.getOrder(orderId);
			const ind = this.orders.findIndex(elem => elem.orderId === order.orderId);
			if(ind === -1) this.orders.push(new Order(order));
			else this.orders[ind] = new Order(order);
			await this.updateProcess(user);

			sleep(CONSTANTS.ORDER_TIMEOUT);
		}


		if(this.checkFilling(order.status)) {
			return new Order(order);
		}
		else if(this.checkCanceling(order.status) || this.checkFailing(order.status)) {
			return {};
		}
	}

	async newBuyOrder(price = 0, type = CONSTANTS.ORDER_TYPE.LIMIT, quantity = this.getQuantity(price), prevError = {}) {
		console.log(`---| new BUY order (${price}) ${quantity} ${type}...`);
		
		let symbol = this.getSymbol(),
			newOrderParams = {
				symbol: symbol,
				side: CONSTANTS.ORDER_SIDE.BUY,
				quantity: quantity
			};
		if(type === CONSTANTS.ORDER_TYPE.LIMIT)	
			newOrderParams.price = price;
		else 
			newOrderParams.type = type;

		try{
			let newBuyOrder = await this.Client.order(newOrderParams);
			await this._log('попытка создать ордер - ' + newBuyOrder.price + ', ' + newBuyOrder.origQty);
			return new Order(newBuyOrder);
		}
		catch(error) {
			await this._log(this.errorCode(error));
			if(quantity > 0) {
				let step = this.botSettings.decimalQty;
				if(
					(await this.isError1013(error) && await this.isError2010(prevError)) ||
					(await this.isError1013(prevError) && await this.isError2010(error))
				) return await this.disableProcess('Невозможно купить монеты');
				else if(await this.isError1013(error)) quantity += step;
				else if(await this.isError2010(error)) quantity -= step;
				
				let order = await this.newBuyOrder(price, type, this.toDecimal(quantity), error);
				return order;
			}
			else return {};
		}
	}

	async newSellOrder(price = 0, type = CONSTANTS.ORDER_TYPE.LIMIT, quantity = this.getQuantity(price), prevError = {}) {
		console.log(`---| new SELL order (${price}) ${quantity} ${type}...`);
		let pair = this.getSymbol(),
			newOrderParams = {
				symbol: pair,
				side: CONSTANTS.ORDER_SIDE.SELL,
				quantity: quantity
			};
		if(type === CONSTANTS.ORDER_TYPE.LIMIT)	
			newOrderParams.price = price;
		else 
			newOrderParams.type = type;

		try{
			let newSellOrder = await this.Client.order(newOrderParams);
			this.recountQuantity(newSellOrder.origQty, 1);
			await this._log('попытка создать ордер - ' + newSellOrder.price + ', ' + newSellOrder.origQty);
			return new Order(newSellOrder);
		}
		catch(error) {
			await this._log(this.errorCode(error));
			if(quantity > 0) {
				let step = this.botSettings.decimalQty;
				if(
					(await this.isError1013(error) && await this.isError2010(prevError)) ||
					(await this.isError1013(prevError) && await this.isError2010(error))
				) return await this.disableProcess('Невозможно продать монеты');
				else if(await this.isError1013(error)) quantity += step;
				else if(await this.isError2010(error)) quantity -= step;
				console.log('newSell', price,  this.toDecimal(quantity));

				let order = await this.newSellOrder(price, type, this.toDecimal(quantity), error);
				return order;
			}
			else return {};
		}
	}

	async createSafeOrders(price = 0, quantity = 0) {
		console.log('--- createSafeOrders');
		price = Number(price);
		let amount = this.getMaxOpenedAmount(),
			safeOrders = [],
			curPrice = price,
			curQty = quantity;
		await this._log(`создание страховочных ордеров (всего - ${quantity}, откроет - ${amount})`);
		for(let i = 0; i < amount; i++) {
			let newOrder = {};
			if(!this.getMartingaleActive())
				newOrder = await this.createSafeOrder(curPrice);
			else 
				newOrder = await this.createSafeOrder(curPrice, curQty);
			curPrice = newOrder.price;
			curQty = newOrder.origQty;
			if(newOrder.orderId)
				safeOrders.push(newOrder);
		}
		return safeOrders;
	}

	async createSafeOrder(price = 0, quantity = 0) {
		console.log('---! createSafeOrder');
		await this._log(`новый страховочный ордер (price - ${price}, qty - ${quantity})`);
		price = Number(price);

		let maxOpenSO = this.getMaxOpenedAmount(),
			currentQtyUsedSO = this.getQtyOfUsedSafeOrders(),
			currentQtyActiveSO = this.getQtyOfActiveSafeOrders(),
			maxAmountSO = this.getAmount(),
			deviation = this.getDeviation(),
			lastSafeOrder = this.getLastSafeOrder() || {},
			decimal = this.getDecimal(price || Number(lastSafeOrder.price)),
			newOrder = {};

		if(maxOpenSO > currentQtyActiveSO && maxAmountSO > currentQtyUsedSO) {
			this.botSettings.quantityOfUsedSafeOrders ++;
			this.botSettings.quantityOfActiveSafeOrders ++;
			let lastSafeOrderPrice = Number(lastSafeOrder.price) || price,
				newPrice = this.toDecimal(lastSafeOrderPrice - lastSafeOrderPrice * deviation, decimal),
				qty = 0;
			if(quantity) qty = this.toDecimal(quantity * this.getMartingaleValue());
			else if(this.getMartingaleActive()) qty = this.toDecimal(Number(lastSafeOrder.origQty) * this.getMartingaleValue());
			else qty = this.getQuantity(newPrice, 1);

			try {
				newOrder = await this.newBuyOrder(newPrice, CONSTANTS.ORDER_TYPE.LIMIT, qty);
			}
			catch(error) {
				await this._log(error);
			}
		}	
		return newOrder;
	}
	
	
	async _log(message = '') {
		let date = this.getDate(),
			nextMessage = {};
		nextMessage = `${date}|  ${message}`;

		if(this.log.length && this.log[0].indexOf(message) >= 0) this.log[0] = nextMessage;
		else this.log.unshift(nextMessage) ;
		await this.updateLog();
	}

	toDecimal(value = 0, decimal = this.getDecimal()) {
		return Number(Number(value).toFixed(decimal));
	}

	recountQuantity(quantity = 0, side = 0) {
		quantity = Number(quantity);
		let current = Number(this.botSettings.quantity);
		current += Math.pow(-1, side) * quantity;
		current = this.toDecimal(current);
		this.botSettings.quantity = current;
		return current;
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
			newProfitPrice = this.toDecimal(averagePrice, decimal);

		return newProfitPrice
	}
	
	countDecimalNumber(x) {
		return (x.toString().includes('.')) ? (x.toString().split('.').pop().length) : (0);
	}

	async disableProcess(message, isContinue = false) {
		console.log('[----- disableProcess ' + message);
		await this._log(`завершение процесса, причина -> (${message})`);
		if(this.symbol) await this.cancelOrders(this.safeOrders);

		this.safeOrders = []
		this.currentOrder = {}
		
		this.botSettings.quantityOfUsedSafeOrders = 0
		this.botSettings.quantityOfActiveSafeOrders = 0
		this.botSettings.currentOrder = this.botSettings.initialOrder
		this.botSettings.firstBuyPrice = 0

		if(this.symbol) this.orders = await this.updateOrders(this.orders);

		if(!isContinue) this.status = CONSTANTS.BOT_STATUS.INACTIVE;

		console.log(']----- disableProcess ');
		
		await this._log(`процесс завершен.`);
		return 'disable';
	}

	async cancelAllOrders(user = this.user) {
		console.log('----- cancel all orders and sell it');
		await this._log('Завершение всех ордеров и продажа по рынку.');
		try{
			await this.cancelOrders(this.safeOrders);
			await this.cancelOrder(this.currentOrder.orderId);
			let lastPrice = await this.getLastPrice(),
				qty = this.getQuantity(),
				newOrder = await this.newSellOrder(lastPrice, CONSTANTS.ORDER_TYPE.MARKET, qty);
			
			if(newOrder !== CONSTANTS.DISABLE_FLAG) await this.updateProcess(user);;
			this.orders.push(newOrder);
			this.orders = await this.updateOrders(this.orders);
			await this.updateProcess(user)
			return {
				status: 'info',
				message: 'Все ордера отменены и монеты распроданы по рынку'
			};
		}
		catch(error) {
			console.log(error);
			await this._log(error);
			return {
				status: 'error',
				message: `Ошибка процессе завершения всех ордеров и продажи по рынку (код ошибки ${this.errorCode(error)}) :: ${error}`
			};
		}
	}

	async cancelOrders(orders) {
		for(let i = 0; i < orders.length; i++) 
			await this.cancelOrder(orders[i].orderId);
	}

	async cancelOrder(orderId = 0) {
		orderId = Number(orderId);
		try {
			let pair = this.getSymbol();
			let order = await this.getOrder(orderId),
				side = order.side,
				qty = order.origQty,
				status = '',
				message = '';
			try {
				var cancelOrder = await this.Client.cancelOrder({
					symbol: pair,
					orderId: orderId
				});
				if(this.isOrderSell(side)) {
					this.recountQuantity(qty);
				}
				status = 'ok';
				message = `ордер ${cancelOrder.orderId} завершен`;
			}
			catch(error) {
				status = 'error';
				message = `ошибка при завершении ордера ${cancelOrder.orderId}`;
			}
			await this._log('закрытие ордера - ' + message);
			return {
				status: status,
				message: message,
				data: { order: cancelOrder }
			};
		}
		catch(error) {
			await this._log('закрытие ордера - ' + error);
			return {
				status: 'error',
				message: error,
				data: { orderId: orderId }
			};
		}
	}

	async freezeProcess(user) {
		console.warn('------ freezeProcess');
		await this._log('Заморозка текущего процесса.');
		this.preFreeze = CONSTANTS.BOT_FREEZE_STATUS.ACTIVE;

		let freezeSO = [],
			freezeCO = this.cloneDeep(this.currentOrder);

		this.safeOrders.forEach(order => {
			freezeSO.push(new Order(order));
		})
		
		this.freezeOrders.safe = freezeSO;
		this.freezeOrders.current = freezeCO;

		await this.cancelOrders(this.safeOrders);
		await this.cancelOrder(this.currentOrder.orderId);
		await this.updateProcess(user);
		await this._log('Бот успешно заморожен.');
	}

	async unfreezeProcess(user) {
		await this._log('Разморозка текущего процесса.');
		console.warn('------ unfreezeing bot')
		this.preFreeze = CONSTANTS.BOT_FREEZE_STATUS.INACTIVE;

		let newSafeOrders = await this.createOrders(this.freezeOrders.safe),
			newCurOrder = await this.createOrder(this.freezeOrders.current);

		this.safeOrders = newSafeOrders;
		this.currentOrder = newCurOrder;
		this.orders.push(...this.safeOrders);
		this.orders.push(this.currentOrder);
		await this.updateProcess(user);
		await this._log('Разморозка бота успешно завершена.');
	}

	async createOrders(orders = []/*, type = 'safe'*/) {
		const length = orders.length;
		let newOrders = [];

		for(let i = 0; i < length; i++) {
			let order = await this.createOrder(orders[i]);
			if(order.orderId)
				newOrders.push(order);
		}

		return newOrders
	}

	async createOrder(order = {}) {
		let { side, price, type, origQty } = order,
			newOrder = {};

		if(side === CONSTANTS.ORDER_SIDE.BUY) 
			newOrder = await this.newBuyOrder(price, type, origQty);
		else if(side === CONSTANTS.ORDER_SIDE.SELL) 
			newOrder = await this.newSellOrder(price, type, origQty);

		return newOrder;
	}

	cloneDeep(obj) { // полное клонирование объекта
		return Object.assign({}, obj);
		return JSON.parse(JSON.stringify(obj));
	}
	
	//:: SETTERS FUNC 
	async setClient(user) {
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
				await this._log('ошибка с определением бинанс ключей!');
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
			await this._log('ошибка с определением бинанс ключей!');
		}
		return ret
	}

	setQuantity(price = 0, quantity = 0) {
		this.botSettings.quantity = price ? this.toDecimal(Number(this.botSettings.currentOrder)/ price) : Number(quantity);
		return Number(this.botSettings.quantity);
	}
	//:: SETTERS FUNC END
	
	//************************************************************************************************//
	
	//:: GETTERS FUNC 
	getLastSafeOrder() {
		let orders = this.safeOrders,
			lastOrder = orders[0],
			length = orders.length;

		for (let i = 1; i < length; ++i) 
			if (orders[i].price < lastOrder.price) lastOrder = orders[i];

		return lastOrder;
	}

	getDeviation() {
		return Number(this.botSettings.deviation) / 100;
	}

	getAmount() {
		return Number(this.botSettings.safeOrder.amount);
	}

	getQtyOfActiveSafeOrders() {
		return Number(this.botSettings.quantityOfActiveSafeOrders);
	}

	getQtyOfUsedSafeOrders() {
		return Number(this.botSettings.quantityOfUsedSafeOrders);
	}

	getMartingaleActive() {
		return Number(this.botSettings.martingale.active);
	}

	getMartingaleValue() {
		return Number(this.botSettings.martingale.value)
	}

	getMaxOpenedAmount() {
		return Number(this.botSettings.maxOpenSafetyOrders);
	}

	getProfitPrice(price = 0) {
		price = Number(price);
		let takeProfit = this.getTakeProfit(),
			decimal = this.getDecimal(price),
			profitPrice = price + price * takeProfit;
		return this.toDecimal(profitPrice, decimal);
	}

	getTakeProfit() {
		return (Number(this.botSettings.takeProfit) + 2 * CONSTANTS.BINANCE_FEE) / 100;
	}

	async getOrder(orderId) {
		orderId = Number(orderId);
		let pair = this.getSymbol(),
			order = {};
		try{
			order = await this.Client.getOrder({
				symbol: pair,
				orderId: orderId
			});
		}
		catch(error) {
			if(await this.isError1021(error)) order = await this.getOrder(orderId);
		}
		return new Order(order);
	}

	getDate(date = Date.now()) {
		date = new Date(date);
		let hh = String(date.getHours()),
			ss = String(date.getSeconds()),
			mm = String(date.getMinutes());

		hh = hh.length < 2 ? '0' + hh : hh;
		mm = mm.length < 2 ? '0' + mm : mm;
		ss = ss.length < 2 ? '0' + ss : ss;

		return `${hh}:${mm}:${ss}`;
	}

	getQuantity(price = 0, safeFlag = 0) {
		price = Number(price);
		if(!safeFlag)
			return price ? this.toDecimal(Number(this.botSettings.currentOrder) / price) : Number(this.botSettings.quantity);
		else 
			return this.toDecimal(Number(this.botSettings.safeOrder.size) / price);
	}

	getDecimal(price = 0) {
		price = price ? price : this.botSettings.decimalQty;
		let ret = this.countDecimalNumber(price);
		return ret;
	}

	async getLastPrice() {
		let pair = this.getSymbol(),
			price = await this.Client.prices()
		return Number(price[pair]);
	}

	getSymbol() {
		return this.symbol;
	}

	getChangeKey(field = '') {
		return field ? `PROCESSES.${this._id}.${field}` : `PROCESSES.${this._id}`;
	}

	getChangeObject(field = '', data = null) {
		let key = this.getChangeKey(field),
			obj = {};
		
		obj[key] = data;

		return obj;
	}
	//:: GETTERS FUNC END

	
	//************************************************************************************************//

	//:: UPDATE FUNC
	async updateLog(user = this.user) {
		try {
			let change = this.getChangeObject('log', this.log);
			await Mongo.syncUpdate(user, change, 'users');
		} catch(err) {
			console.log(err);
		}
	}

	async updateProcess(user = this.user, message = '') {
		console.log('[ updateProcess', message);
		await this.updateProcessOrdersList(user);

		let change = this.getChangeObject('', this);
		await Mongo.syncUpdate(user, change, 'users');
		console.log('] updateProcess');
	}

	async syncUpdateBot(user = this.user, message = '') { //syncUpdateBot
		console.log('[ sync upd ', message);
		await this.updateProcessOrdersList(user);
		let data = await Mongo.syncSelect(user, 'users')
		data = data[0]
		let tempBot = new Bot(this)
		const index = data.bots.findIndex(bot => {
			return bot.botID === tempBot.botID
		})
		data.bots[index] = tempBot
		await Mongo.syncUpdate(user = this.user, {bots: data.bots}, 'users');
		console.log('] sync upd ')
	}

	async updateProcessOrdersList(user = this.user) {
		console.log('[ updateProcessOrdersList');
		let data = await Mongo.syncSelect(user, 'users');
		data = data[0];

		let ordersList = data.PROCESSES[this._id].ordersList;
		!ordersList && (ordersList = {});

		let _id = `${this._id}${this.botID}-${this._id}`;
		!ordersList[_id] && (ordersList[_id] = []);
		ordersList[_id] = this.orders;

		let change = this.getChangeObject('ordersList', ordersList);
		await Mongo.syncUpdate(user, change, 'users');
		console.log('] updateProcessOrdersList')
	}

	async updateOrders(orders = []) {
		console.log('------- updateOrders');
		let pair = this.getSymbol(),
			nextOrders = [],
			len = orders.length;
		for(let i = 0; i < len; i++) {
			try{
				if(!orders[i].isUpdate) {
					let orderData = await this.Client.getOrder({
						symbol: pair,
						orderId: orders[i].orderId
					});
					let order = new Order(orderData);
					if(this.checkFailing(order.status) || this.checkFilling(order.status)) order.isUpdate = true;
					nextOrders.push(order);
				}
				else {
					nextOrders.push(orders[i]);
				}
			}
			catch(error) {
				console.log(error);
			}
		}
		return nextOrders;
	}
	//:: UPDATE FUNC END

	//************************************************************************************************//

	//:: ERRORS TYPES
	errorCode(error = new Error('default err')) {
		return JSON.parse(JSON.stringify(error)).code;
	}

	//Timestamp for this request is outside of the recvWindow
	async isError1021(error = new Error('default err')) {  	
		let code = this.errorCode(error);
		console.log(code);
		await this._log('ошибка code:' + code + ', Timestamp for this request is outside of the recvWindow');
		return code === -1021;
	}

	//MIN_NOTATIAN
	async isError1013(error = new Error('default err')) { 
		let code = this.errorCode(error);
		console.log(code);
		await this._log('ошибка code:' + code + ', MIN_NOTATIAN');
		return code === -1013;
	}

	//insufficient balance
	async isError2010(error = new Error('default err')) { 
		let code = this.errorCode(error);
		console.log(code);
		await this._log('ошибка code:' + code + ', insufficient balance');
		return code === -2010;
	}
	//:: ERRORS TYPES END

	//************************************************************************************************//

	//:: CHECK FUNC
	isOrderSell(side) {
		return side === CONSTANTS.ORDER_SIDE.SELL;
	}

	isOrderBuy(side) {
		return side === CONSTANTS.ORDER_SIDE.BUY;
	}

	checkFilling(status) {
		return status === CONSTANTS.ORDER_STATUS.FILLED;
	}

	checkCanceling(status) {
		return status === CONSTANTS.ORDER_STATUS.CANCELED;
	}

	checkProcessing(status) {
		return (status === CONSTANTS.ORDER_STATUS.NEW || status === CONSTANTS.ORDER_STATUS.PARTIALLY_FILLED);
	}

	checkFailing(status) {
		return status === CONSTANTS.ORDER_STATUS.CANCELED || 
			status === CONSTANTS.ORDER_STATUS.PENDING_CANCEL ||
			status === CONSTANTS.ORDER_STATUS.REJECTED || 
			status === CONSTANTS.ORDER_STATUS.EXPIRED;
	}

	async checkFreezeStatus(user = this.user) {
		const activeF = CONSTANTS.BOT_FREEZE_STATUS.ACTIVE,
			inactiveF = CONSTANTS.BOT_FREEZE_STATUS.INACTIVE;
		if(this.freeze === activeF && this.preFreeze === inactiveF) {
			await this.freezeProcess(user);
			this.nextTradeStep(user);
		}
		else if(this.freeze === inactiveF && this.preFreeze === activeF) {
			await this.unfreezeProcess(user);
			this.nextTradeStep(user);
		}
		else {
			console.warn('----- general trade');
			this.nextTradeStep(user);
		}
	}
	//:: CHECK FUNC END
}