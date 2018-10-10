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
		signal = {},
		runningProcess = true,
		status = CONSTANTS.BOT_STATUS.INACTIVE,
		state = CONSTANTS.BOT_STATE.MANUAL,
		freeze = CONSTANTS.BOT_FREEZE_STATUS.INACTIVE,
		preFreeze = freeze,
		currentOrder = {},
		orders = [],
		safeOrders = [],
		updateStatus = false,
		freezeOrders = {
			safe: [],
			current: {}
		},
		log = [],
		botSettings = {},
		nextProcessSettings = {},
		user = {},
		botID = String(Date.now())
	} = {}) {
		this._id = this.JSONclone(_id);
		this.symbol = this.JSONclone(symbol);
		this.signal = this.JSONclone(signal);
		this.updateStatus = this.JSONclone(updateStatus);
		this.runningProcess = this.JSONclone(runningProcess);
		this.state = this.JSONclone(state);
		this.status = this.JSONclone(status);
		this.freeze = this.JSONclone(freeze);
		this.preFreeze = this.JSONclone(preFreeze);
		this.currentOrder = this.JSONclone(currentOrder);
		this.orders = this.JSONclone(orders);
		this.safeOrders = this.JSONclone(safeOrders);
		this.freezeOrders = this.JSONclone(freezeOrders);
		this.botSettings = this.JSONclone(botSettings);
		this.nextProcessSettings = this.JSONclone(nextProcessSettings);
		this.log = this.JSONclone(log);
		if(user.name) this.setClient(user, true);
		this.user = user;
		this.botID = this.JSONclone(botID);
	}

	JSONclone(object) {
		return JSON.parse(JSON.stringify(object));
	}

	changeFreeze(fre = this.freeze, preFre = this.preFreeze) {
		this.freeze = fre;
		this.preFreeze = preFre;
	}

	deactivateProcess() {
		this.status = CONSTANTS.BOT_STATUS.INACTIVE;
	}

	async startTrade(user) {
		await this._log('Начало нового цикла торговли.');
		if(this.setClient(user)) {
			this.currentOrder = {};
	
			let newBuyOrder = await this.firstBuyOrder(user);
			if(newBuyOrder.orderId) {
				let qty = this.setQuantity(null, Number(newBuyOrder.origQty));
				let price = Number(newBuyOrder.price);
	
				while(this.isFreeze()) {
					sleep(CONSTANTS.TIMEOUT);
				};
				this.botSettings.firstBuyPrice = price;
				let profitPrice = this.getProfitPrice(price);
				let newSellOrder = await this.newSellOrder(profitPrice, CONSTANTS.ORDER_TYPE.LIMIT, qty);
				if(newSellOrder !== CONSTANTS.DISABLE_FLAG) await this.updateProcess(user);
				// if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) {
					this.currentOrder = newSellOrder;
					this.orders.push(newSellOrder);
	
					let safeOrders = await this.createSafeOrders(price, qty);
					this.safeOrders.push(...safeOrders);
					this.orders.push(...safeOrders);
	
					this.trade(user)
						.catch(err => console.log(err));
				// }
			}
			else {
				await this.disableProcess('Неуспешная покупка начального ордера.', CONSTANTS.CONTINUE_FLAG)
				await this.updateProcess(user) 
				if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) this.startTrade(user)
			}
		}
	}

	continueTrade(user = this.user) {
		console.log('****************continueTrade****************  ' + this._id);
		if(this.setClient(user)) {
			this.trade(user)
				.catch(err => console.log(err));
		}
	}

	async trade(user = this.user, flag = false) {
		console.log('----------- trade ------------' + this._id, flag);
		if(this.currentOrder.orderId) {
			this.currentOrder = await this.getOrder(this.currentOrder.orderId);
			let currentOrderStatus = this.currentOrder.status;
			
			if(this.checkFilling(currentOrderStatus) && !this.isFreeze()) {
				await this.disableProcess('Процесс удачно завершён.', CONSTANTS.CONTINUE_FLAG);
				await this.updateProcess(user);
				if(this.status === CONSTANTS.BOT_STATUS.ACTIVE && (this.isManual() || this.checkSignalStatus()) ) this.startTrade(user);
			}
			else if(this.checkFailing(currentOrderStatus) && !this.isFreeze()) {
				await this.disableProcess('Процесс завершен, причина - выключение бота или ошибка.', CONSTANTS.CONTINUE_FLAG);
				await this.updateProcess(user);
				if(this.status === CONSTANTS.BOT_STATUS.ACTIVE && (this.isManual() || this.checkSignalStatus()) ) this.startTrade(user);
			}
			else {
				// if(this.freeze === CONSTANTS.BOT_FREEZE_STATUS.INACTIVE) {
					await this.process(user);
					this.orders = await this.updateOrders(this.orders);
				// }
				if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) {
					this.checkFreezeStatus(user);
				}
				else if(this.status === CONSTANTS.BOT_STATUS.INACTIVE) {
					if(this.currentOrder.orderId) {
						console.log('------ wait for disabling bot');
						this.checkFreezeStatus(user);
					} else if(this.isFreeze()) {
						await this._log('Ожидание разморозки бота');
						this.checkFreezeStatus(user);
					} else {
						console.log('----- bot is disabled');
						await this.disableProcess('нажали выкл -> бот завершил работу -> выключаем бота');
					}
				}
			}
		} else if(!flag) {
			this.currentOrder = this.getSellOrder();
			this.trade(user, true);
		} else if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) {
			console.log('ТИПО НАД НЧАТЬ START TRADE');
			this.startTrade(user);
		}
		await this.updateProcess(user);
	}

	nextTradeStep(user = this.user) {
		sleep(CONSTANTS.TIMEOUT);
		this.trade(user);
		// setTimeout(() => this.trade(user), CONSTANTS.TIMEOUT);
	}

	async process(user = this.user) {
		console.log('---- in PROCESS ' + this._id);
		let orders = this.safeOrders || [],
			length = orders.length,
			nextSafeOrders = [];

		if(length) {
			await this._log('Проверка состояния ордеров...');
			console.log('----- checked safeorders');
			for(let i = 0; i < length; i++) {
				console.log(i + 'ордер есть ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
				try {
					let order = await this.getOrder(orders[i].orderId);
					this.botSettings.quantityOfActiveSafeOrders --;

					if(this.checkFilling(order.status)) {
						console.log('ордер ФИЛИНГ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
						await this.cancelOrder(this.currentOrder.orderId);
						this.recountInitialOrder(order);
						this.recountQuantity(order.origQty);

						let newProfitPrice = this.recountProfitPrice(order),
							newSellOrder = await this.newSellOrder(newProfitPrice, CONSTANTS.ORDER_TYPE.LIMIT, this.getQuantity());

						if(newSellOrder !== CONSTANTS.DISABLE_FLAG) await this.updateProcess(user);

						this.currentOrder = newSellOrder;
						this.orders.push(this.currentOrder);

						if(!this.isFreeze()) {
							console.log('ордер ФИЛИНГ НЕ ФРИЗ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
							let newSafeOrder = await this.createSafeOrder(null);

							if(newSafeOrder.orderId) {
								this.orders.push(newSafeOrder);
								nextSafeOrders.push(newSafeOrder);
							}
						}

					} else if(this.checkCanceling(order.status)) {
						console.log('ордер КАНСЕЛ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
						if(!this.isFreeze()) {
							console.log('ордер КАНСЕЛ НЕ ФРИЗ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
							let newSafeOrder = await this.createSafeOrder(null);

							if(newSafeOrder.orderId) {
								this.orders.push(newSafeOrder);
								nextSafeOrders.push(newSafeOrder);
							}
						}
					}
					else {
						console.log('ордер ПРОСТО ЕСЛЕ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
						nextSafeOrders.push(order);
					}
				}
				catch(error) {
					console.log(error);
				}
			}
			this.safeOrders = nextSafeOrders;

		} else if(this.isFreeze() && !this.isPreFreeze()) {
			console.log('ТИП ВРОДЕ НИХУЯ ДЕЛАТЬ НЕ НАДО ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
			//тип вроде нихуя делать не надо
		} else if(!this.isFreeze() && this.isPreFreeze()) {
			//тип надо выставить некст сейв ордер, если еще можно
			console.log('ВЫСТАВЛЯЕМ НОВЫЙ СЕЙВ ОРДЕР ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
			let newSafeOrder = await this.createSafeOrder();

			if(newSafeOrder.orderId) {
				this.orders.push(newSafeOrder);
				nextSafeOrders.push(newSafeOrder);
			}
			this.safeOrders = nextSafeOrders;

		} else {
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

	async createSafeOrder(price = this.botSettings.lastSafeOrderPrice, quantity = 0) {
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
				this.botSettings.lastSafeOrderPrice = Number(newOrder.price);
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

	setRunnigProcess(nexStatus = false) {
		this.runningProcess = nexStatus;
	}

	setNextBotSettings() {
		let next = this.nextProcessSettings,
			bs = this.botSettings;
		
		this.symbol = next.symbol;
		bs.initialOrder = next.initialOrder;
		bs.safeOrder = next.safeOrder;
		bs.stopLoss = next.stopLoss;
		bs.takeProfit = next.takeProfit;
		bs.tradingSignals = next.tradingSignals;
		bs.maxOpenSafetyOrders = next.maxOpenSafetyOrders;
		bs.deviation = next.deviation;

		this.updateStatus = false;
	}

	async disableProcess(message, isContinue = false) {
		console.log("---------------------DISABLEPROCESS IN PROCESS")
		console.log('isContinue ' + isContinue);
		console.log('[----- disableProcess ' + message);
		await this._log(`завершение процесса, причина -> (${message})`);
		if(this.symbol) await this.cancelOrders(this.safeOrders);

		this.safeOrders = [];
		this.currentOrder = {};
		
		this.botSettings.quantityOfUsedSafeOrders = 0;
		this.botSettings.quantityOfActiveSafeOrders = 0;

		if(this.updateStatus) {
			this.setNextBotSettings();
		}

		this.botSettings.currentOrder = this.botSettings.initialOrder;
		this.botSettings.firstBuyPrice = 0;
		// this.runningProcess = false;
		if(this.symbol) this.orders = await this.updateOrders(this.orders);

		if(!isContinue) this.status = CONSTANTS.BOT_STATUS.INACTIVE;

		console.log(']----- disableProcess ');
		
		await this._log(`процесс завершен.`);
		return 'disable';
	}

	async cancelAllOrders(user = this.user) {
		console.log("---------------------CANCEL ALL ORDERS IN PROCESS");
		console.log('----- cancel all orders and sell it');
		await this._log('Завершение всех ордеров и продажа по рынку.');
		console.log(this.currentOrder)
		try{
			if(this.currentOrder.orderId) {
				await this.cancelOrders(this.safeOrders);
				await this.cancelOrder(this.currentOrder.orderId);
	
				if(this.isOrderSell(this.currentOrder.side)) {
					let lastPrice = await this.getLastPrice(),
						qty = this.getQuantity(),
						newOrder = await this.newSellOrder(lastPrice, CONSTANTS.ORDER_TYPE.MARKET, qty);
					
					if(newOrder !== CONSTANTS.DISABLE_FLAG) await this.updateProcess(user);
					this.orders.push(newOrder);
				}
				
				this.orders = await this.updateOrders(this.orders);
				await this.updateProcess(user);
				return {
					status: 'info',
					message: 'Все ордера отменены и монеты распроданы по рынку'
				};
			} else {
				return {
					status: 'error',
					message: 'Невозможно продать монеты, так как первый закупочный ордер еще не завершился.'
				};
			}
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
	setStatus(nextStatus = '') {
		if(nextStatus === CONSTANTS.BOT_STATUS.ACTIVE || nextStatus === CONSTANTS.BOT_STATUS.INACTIVE) {
			this.status = nextStatus;
		}	
	}

	async setClient(user = this.user, flag = false) {
		let key = '',
			secret = '',
			ret = true;
		
		if(user.binanceAPI.name) {
			try {
				key = Crypto.decipher(user.binanceAPI.key,  Crypto.getKey(user.regDate, user.name))
				secret = Crypto.decipher(user.binanceAPI.secret,  Crypto.getKey(user.regDate, user.name))
			}
			catch(err) {
				console.log('ошибка с определением ключей бинанса');
				if(flag) await this._log('ошибка с определением бинанс ключей!');
				key = '';
				secret = ''; 
				ret = false;
			}
			this.Client = binanceAPI({
				apiKey: key,
				apiSecret: secret
			});

			let checkClient = await this.Client.accountInfo();
			if(!checkClient.balances) {
				if(flag) await this._log('ошибка с определением бинанс ключей!');
				ret = false;
			}
		}
		else {
			if(flag) await this._log('ошибка с определением бинанс ключей!');
			ret = false;
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

	getSellOrder() {
		let orders = this.orders,
			l = orders.length,
			order = {};

		for (let i = 0; i < l; i++) {
			if( this.isOrderSell(orders[i].side) && !orders[i].isUpdate && this.checkProcessing(orders[i].status) ) {
				order = orders[i];
				break;
			}
		}

		return new Order(order);
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
			if(await this.isError1021(error)) return await this.getOrder(orderId);
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

	getChangeKey(field = '', botInd = null) {
		return field ? `bots.${botInd}.processes.${this._id}.${field}` : `bots.${botInd}.processes.${this._id}`;
	}

	async getChangeObject(field = '', data = null) {
		const user = { name: this.user.name },
			botInd = await this.getBotIndex(user);
		
		if(botInd !== -1) {
			let key = this.getChangeKey(field, botInd),
				obj = {};
			
			obj[key] = data;
	
			return obj;
		} else {
			return -1;
		}
	}

	async getBotIndex(user = this.user, userData = null) {
		if(!userData) {
			user = { name: user.name };
			userData = await Mongo.syncSelect(user, 'users');
			userData = userData[0];
		}

		const botInd = userData.bots.findIndex(bot => bot.botID === this.botID);

		return botInd;
	}
	//:: GETTERS FUNC END

	
	//************************************************************************************************//

	//:: UPDATE FUNC
	async updateLog() {
		const user = { name: this.user.name };
		try {
			let change = await this.getChangeObject('log', this.log);
			if(change !== -1) {
				await Mongo.syncUpdate(user, change, 'users');
			}
		} catch(err) {
			console.log(err);
		}
	}

	async updateLocalProcess(next = this, nextSymbol = this.symbol) {
		this.updateStatus = true;
		let nextProcessSettings = {
			symbol: nextSymbol,
			initialOrder: next.botSettings.initialOrder,
			safeOrder: next.botSettings.safeOrder,
			stopLoss: next.botSettings.stopLoss,
			takeProfit: next.botSettings.takeProfit,
			tradingSignals: next.botSettings.tradingSignals,
			maxOpenSafetyOrders: next.botSettings.maxOpenSafetyOrders,
			deviation: next.botSettings.deviation
		}
		this.nextProcessSettings = nextProcessSettings;
	}

	async updateProcess(user = this.user, message = '') {
		user = { name: user.name };
		// console.log('[ updateProcess', message);
		await this.updateProcessOrdersList(user);
		let change = await this.getChangeObject('', this);
		if(change !== -1) {
			await Mongo.syncUpdate(user, change, 'users');
		}
		// console.log('] updateProcess');
	}

	async updateProcessOrdersList(user = this.user) {
		// console.log('[ updateProcessOrdersList');
		user = { name: user.name };
		let data = await Mongo.syncSelect(user, 'users');
		data = data[0];
		const botInd = await this.getBotIndex(user, data);
		// const botInd = data.bots.findIndex(bot => bot.botID === this.botID);
		// console.log(botInd);
		if(botInd != -1) {
			let ordersList = data.bots[botInd].processes[this._id].ordersList;
			!ordersList && (ordersList = {});
	
			let _id = `${this._id}${this.botID}-${this._id}`;
			!ordersList[_id] && (ordersList[_id] = []);
			ordersList[_id] = this.orders;
	
			let change = await this.getChangeObject('ordersList', ordersList);
			if(change !== -1) {
				await Mongo.syncUpdate(user, change, 'users');
			}
		}
		// console.log('] updateProcessOrdersList');
	}

	async updateOrders(orders = []) {
		console.log('------- updateOrders');
		let nextOrders = [],
			len = orders.length;
		for(let i = 0; i < len; i++) {
			try{
				if(!orders[i].isUpdate) {
					let order = await this.getOrder(orders[i].orderId);
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
		// await this._log('ошибка code:' + code + ', Временная метка для этого запроса находится вне recvWindow');
		return code === -1021;
	}

	//MIN_NOTATIAN
	async isError1013(error = new Error('default err')) { 
		let code = this.errorCode(error);
		console.log(code);
		// await this._log('ошибка code:' + code + ', Количество продоваемых монет ниже минимально-допустимого');
		return code === -1013;
	}

	//insufficient balance
	async isError2010(error = new Error('default err')) { 
		let code = this.errorCode(error);
		console.log(code);
		// await this._log('ошибка code:' + code + ', Недостаточно средств на балансе валюты');
		return code === -2010;
	}

	// Неверные бинанс ключи
	async isError2014(error = new Error('default err')) {
		let code = this.errorCode(error);
		console.log(code);
		// await this._log('ошибка code:' + code + ', Неверные бинанс ключи');
		return code === -2014
	}
	//:: ERRORS TYPES END

	//************************************************************************************************//

	//:: CHECK FUNC
	isAuto() {
		return this.state === CONSTANTS.BOT_STATE.AUTO;
	}

	isManual() {
		return this.state === CONSTANTS.BOT_STATE.MANUAL;
	}

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

	async checkSignalStatus() {
		if(this.isAuto()) {
			let key = { id: this.signal.id },
				signal = await Mongo.syncSelect(key, CONSTANTS.TRADING_SIGNALS_COLLECTION);
	
			return ( signal && ( signal.rating === signal.checkRating || (signal.checkRating === CONSTANTS.TRANSACTION_TERMS.BUY && signal.rating === CONSTANTS.TRANSACTION_TERMS.STRONG_BUY) ));
		} else return false;
	}

	isFreeze() {
		return this.freeze === CONSTANTS.BOT_FREEZE_STATUS.ACTIVE;
	}

	isPreFreeze() {
		return this.preFreeze === CONSTANTS.BOT_FREEZE_STATUS.ACTIVE;
	}

	async checkFreezeStatus(user = this.user) {
		const activeF = CONSTANTS.BOT_FREEZE_STATUS.ACTIVE,
			inactiveF = CONSTANTS.BOT_FREEZE_STATUS.INACTIVE;
		// if(this.freeze === activeF && this.preFreeze === inactiveF) {
		// 	await this.freezeProcess(user);
		// 	this.nextTradeStep(user);
		// }
		// else if(this.freeze === inactiveF && this.preFreeze === activeF) {
		// 	await this.unfreezeProcess(user);
		// 	this.nextTradeStep(user);
		// }
		// else {
		// 	console.warn('----- general trade');
			this.nextTradeStep(user);
		// }
	}
	//:: CHECK FUNC END
}