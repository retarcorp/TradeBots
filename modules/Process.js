const CONSTANTS = require('../constants');
const Order = require('./Order');
const Crypto = require('../modules/Crypto');
const binanceAPI = require('binance-api-node').default;
const Mongo = require('./Mongo');
const sleep = require('system-sleep');
const uniqid = require('uniqid');
const PRC = CONSTANTS.PRC;
const DL = CONSTANTS.DL;
const Logger = require('./Logger');
const MDBLogger = require('./MDBLogger');
const Symbols = require('./Symbols');


// const winston = require('winston');
// const logger = winston.createLogger({
// 	transports: [
// 		new winston.transports.File({ filename: './logger.txt' })
// 	]
// });

// logger.info({ a: 12 });
// const winston = require('winston');
// const files = new winston.transports.File({ filename: '/combined.txt' });
// const console = new winston.transports.Console();
 
// winston.add(console);
// winston.add(files);
// winston.level = 'debug';

// console.log(winston)
 
module.exports = class Process {
	constructor({
		processId = uniqid(PRC),
		// dealId = uniqid(DL),
		symbol = '',
		runningProcess = true,
		status = CONSTANTS.BOT_STATUS.INACTIVE,
		finallyStatus = CONSTANTS.BOT_STATUS.ACTIVE,
		state = CONSTANTS.BOT_STATE.MANUAL,
		freeze = CONSTANTS.BOT_FREEZE_STATUS.INACTIVE,
		preFreeze = freeze,
		currentOrder = {},
		orders = [],
		// dealOrders = [],
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
		botID = String(Date.now()),
		botTitle = String(),
		errors = {
			isExist: false,
			description: null
		}
	} = {}) {
		this.processId = this.JSONclone(processId);
		// this.dealId = this.JSONclone(dealId);
		this.symbol = this.JSONclone(symbol);
		this.updateStatus = this.JSONclone(updateStatus);
		this.runningProcess = this.JSONclone(runningProcess);
		this.state = this.JSONclone(state);
		this.status = this.JSONclone(status);
		this.finallyStatus = this.JSONclone(finallyStatus);
		this.freeze = this.JSONclone(freeze);
		this.preFreeze = this.JSONclone(preFreeze);
		this.currentOrder = this.JSONclone(currentOrder);
		// this.dealOrders = this.JSONclone(dealOrders);
		this.orders = this.JSONclone(orders);
		this.safeOrders = this.JSONclone(safeOrders);
		this.freezeOrders = this.JSONclone(freezeOrders);
		this.botSettings = this.JSONclone(botSettings);
		this.nextProcessSettings = this.JSONclone(nextProcessSettings);
		this.log = this.JSONclone(log);
		if(user.name) this.setClient(user, true);
		this.user = user;
		this.botID = this.JSONclone(botID);
		this.botTitle = this.JSONclone(botTitle);
		this.errors = this.JSONclone(errors);
		
		// winston.log('debug', 'process contructor');
	}

	JSONclone(object) {
		try {
			return JSON.parse(JSON.stringify(object));
		} catch(error) {
			MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, error: error, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'JSONclone'});
		}
	}

	changeFreeze(fre = this.freeze, preFre = this.preFreeze) {
		this.freeze = fre;
		this.preFreeze = preFre;
	}

	deactivateProcess() {
		this.status = CONSTANTS.BOT_STATUS.INACTIVE;
	}

	async awaitFreeze(flag = false, resolve = () => {}, reject = () => {}) {
		console.log('1000')
		if(flag) {
			if(this.isFreeze()) {
				setTimeout( () => {
					this.awaitFreeze(flag, resolve, reject);
				}, CONSTANTS.TIMEOUT);
			} else {
				resolve(true);
			}
		} else {
			return new Promise( async (resolve, reject ) => {
				this.awaitFreeze(true, resolve, reject);
			});
		}
	}

	async startTrade(user) {
		// winston.log('debug', 'startTrade');
		return new Promise( async (resolve, reject) => {
			await this._log('Начало нового цикла торговли.');
			if(this.setClient(user)) {
				this.currentOrder = {};
				this.firstBuyOrder(user)
					.then( async newBuyOrder => {
						
						if(newBuyOrder.orderId) {
							let qty = this.setQuantity(null, Number(newBuyOrder.origQty));
							// let price = Number(newBuyOrder.price);
							let price = newBuyOrder.price;
							
							await this.awaitFreeze();
							this.botSettings.firstBuyPrice = price;
							let profitPrice = this.getProfitPrice(price);
							let newSellOrder = await this.newSellOrder(profitPrice, CONSTANTS.ORDER_TYPE.LIMIT, qty);
							
							if(newSellOrder !== CONSTANTS.DISABLE_FLAG && newSellOrder.orderId) {
								this.currentOrder = newSellOrder;
								this.orders.push(newSellOrder);
								
								let safeOrders = await this.createSafeOrders(price, qty);
								this.safeOrders.push(...safeOrders);
								this.orders.push(...safeOrders);
								
								await this.updateProcess(user);
								this.trade(user, false, resolve, reject);
							} else {
								await this.disableProcess('Неуспешная продажа монет. Ошибка при выставлении sell ордера (невозможно продать купленное кол-во монет по профит цене).');
								await this.updateProcess(user);
								resolve('finish');
							}

						} else {
							await this.disableProcess('Неуспешная покупка начального ордера.');
							await this.updateProcess(user);
							resolve('finish');
						}
					})
					.catch( async error => {
						MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, error, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'startTrade'});
						if(error === 'error') {
							await this.disableProcess('Неуспешная покупка начального ордера.');
							await this.updateProcess(user);
							reject('finish');
						} else if(error === 'time_limit') {
							await this.disableProcess('Превышено ожидание покупки начального ордера.');
							await this.updateProcess(user);
							resolve('finish');
						} else if(error === '2010') {
							await this.disableProcess('Недостаточно средств для покупки начального ордера.');
							await this.updateProcess(user);
							reject('finish');
						}
					});
			} else {
				await this.disableProcess('Невозможно начать работу с бинансом, проверьте ключи');
				await this.updateProcess(user);
				reject('finish');
			}
		});
	}

	continueTrade(user = this.user) {
		if(this.setClient(user)) {
			return new Promise( async (resolve, reject) => {
				this.trade(user, false, resolve, reject);
			});
		}
	}

	async trade(user = this.user, flag = false, resolve = () => {}, reject = () => {}, tickTime = 0) {
		if(this.currentOrder.orderId) {	

			if(this.isOrderSell(this.currentOrder.side)) {
				let tmpCurOrd = await this.getOrder(this.currentOrder.orderId);
				
				if(tmpCurOrd.orderId) {
					this.currentOrder = tmpCurOrd;
					let currentOrderStatus = this.currentOrder.status;
					
					if(this.checkFilling(currentOrderStatus) && !this.isFreeze()) {
						await this.disableProcess('Процесс удачно завершён.');
						await this.updateProcess(user);
						resolve('finish');

					} else if(this.checkFailing(currentOrderStatus) && !this.isFreeze()) {
						await this.disableProcess('Процесс завершен (ордер отменен).');
						await this.updateProcess(user);
						resolve('finish');

					} else {
						let ret = await this.process(user, resolve, reject);
						if(ret !== 'finish') {
							this.orders = await this.updateOrders(this.orders);
	
							if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) {
								sleep(CONSTANTS.TIMEOUT);
								this.trade(user, false, resolve, reject);
							}
							else if(this.status === CONSTANTS.BOT_STATUS.INACTIVE) {
								if(this.currentOrder.orderId) {
									sleep(CONSTANTS.TIMEOUT);
									this.trade(user, false, resolve, reject);
	
								} else if(this.isFreeze()) {
									await this._log('Ожидание разморозки бота');
									sleep(CONSTANTS.TIMEOUT);
									this.trade(user, false, resolve, reject);
	
								} else {
									await this.disableProcess('Бот выключен и процесс завершился');
									resolve('finish');
								}
							}
						} else {
							reject(ret);
						}
					}
				} else {
					this.setErrors(tmpCurOrd, `Проблемы с получением информации об ордере! ${this.currentOrder.orderId}`);
					await this._log(`Проблемы с получением информации об ордере! ${this.currentOrder.orderId}`);
					sleep(CONSTANTS.TIMEOUT);
					this.trade(user, false, resolve, reject);
				}
			} else {
				const tenMin = 600000;
				let cOrd = await this.getOrder(this.currentOrder.orderId);
				if(cOrd.orderId) {
					this.currentOrder = cOrd;
					let currentOrderStatus = this.currentOrder.status;
	
					if(this.checkFilling(currentOrderStatus) && !this.isFreeze()) {
						//create new buy order
						let newBuyOrder = await this.getOrder(this.currentOrder.orderId);
	
						if(newBuyOrder.orderId) {
							let qty = this.setQuantity(null, Number(newBuyOrder.origQty));
							let price = Number(newBuyOrder.price);
				
							while(this.isFreeze()) {
								sleep(CONSTANTS.TIMEOUT);
							};
							
							this.botSettings.firstBuyPrice = price;
							let profitPrice = this.getProfitPrice(price);
							let newSellOrder = await this.newSellOrder(profitPrice, CONSTANTS.ORDER_TYPE.LIMIT, qty);
							console.log('НОВЫЙ ПРОДАТЬ', newSellOrder)
		
		
							if(newSellOrder !== CONSTANTS.DISABLE_FLAG) await this.updateProcess(user);
		
							if(newSellOrder !== CONSTANTS.DISABLE_FLAG && newSellOrder.orderId) {
								console.log('AU')
								await this.updateProcess(user);
								this.currentOrder = newSellOrder;
								this.orders.push(newSellOrder);
								// this.dealOrders.push(newSellOrder);
			
								let safeOrders = await this.createSafeOrders(price, qty);
								this.safeOrders.push(...safeOrders);
								this.orders.push(...safeOrders);
								// this.dealOrders.push(...safeOrders);
			
								this.trade(user, false, resolve, reject);
							} else {
								console.log('AUUUA')
								await this.disableProcess('Неуспешная продажа монет. Ошибка при выставлении sell ордера (невозможно продать купленное кол-во монет по профит цене).');
								await this.updateProcess(user);
								('finish');
							}
						} else {
							this.setErrors(cOrd, `Проблемы с получением информации об ордере! ${this.currentOrder}`);
							await this.disableProcess('Неуспешная покупка монет.');
							await this.updateProcess(user);
							reject('finish');
						}
				} else {
					this.setErrors(this.currentOrder.orderId, `Проблемы с получением информации об ордере! ${JSON.stringify(this.currentOrder)}`);
					await this.disableProcess('Неуспешная покупка монет.');
					await this.updateProcess(user);
					reject('finish');
				}
				} else if((this.checkFailing(currentOrderStatus) && !this.isFreeze())) {
					// disable procces
					await this.disableProcess('Неуспешная покупка начального ордера.');
					await this.updateProcess(user);
					resolve('finish');

				} else if(tickTime < tenMin) {
					//trade
					sleep(CONSTANTS.ORDER_TIMEOUT);
					tickTime += CONSTANTS.ORDER_TIMEOUT;
					this.trade(user, false, resolve, reject, tickTime);
				} else {
					await this.cancelOrder(this.currentOrder);
					resolve('time_limit');
				}
			}
		} else if(this.isFreeze() && !flag) {
			setTimeout(() => {
				this.trade(user, false, resolve, reject);
			}, CONSTANTS.BOT_SLEEP)
		} else if(!flag) {
			this.currentOrder = this.getSellOrder();
			this.trade(user, true, resolve, reject);
		} else {
			this.setErrors(this.currentOrder, `Проблема с currentOrder ${this.currentOrder}`);
			resolve('finish');
		}
		
		await this.updateProcess(user);
	}

	nextTradeStep(user = this.user) {
		sleep(CONSTANTS.TIMEOUT);
		this.trade(user);
	}

	async process(user = this.user) {
		let orders = this.safeOrders || [],
			length = orders.length,
			nextSafeOrders = [];
		
		if(length) {
			await this._log(`Проверка состояния страховочных ордеров (${orders[length - 1].price}).`);
			for(let i = 0; i < length; i++) {
				try {
					let order = await this.getOrder(orders[i].orderId);
					if(order.orderId) {
						if(this.checkFilling(order.status)) {
							await this.cancelOrder(this.currentOrder);
							this.recountInitialOrder(order);
							this.recountQuantity(order.origQty);
	
							let newProfitPrice = this.recountProfitPrice(order),
								newSellOrder = await this.newSellOrder(newProfitPrice, CONSTANTS.ORDER_TYPE.LIMIT, this.getQuantity());
	
							if(newSellOrder.orderId) {
								this.currentOrder = newSellOrder;
								this.orders.push(this.currentOrder);
							} else {
								await this._log(`невозможно выставить sell ордер (${JSON.stringify(newSellOrder)})`);
								await this.disableProcess("Ошибка при выставлении нового sell ордера после покупки страховочного!");
								await this.updateProcess(user);
								return 'finish';
							}
	
							if(!this.isFreeze()) {
								this.botSettings.quantityOfActiveSafeOrders--;
								let newSafeOrder = await this.createSafeOrder(null);
	
								if(newSafeOrder.orderId) {
									this.orders.push(newSafeOrder);
									nextSafeOrders.push(newSafeOrder);
								} else {
									await this._log("Невозможно выставить страховочный ордер (недостаточно баланса)");
								}
							}
	
						} else if(this.checkCanceling(order.status)) {
							if(!this.isFreeze()) {
								this.botSettings.quantityOfActiveSafeOrders--;
								let newSafeOrder = await this.createSafeOrder(null);
	
								if(newSafeOrder.orderId) {
									this.orders.push(newSafeOrder);
									nextSafeOrders.push(newSafeOrder);
								} else {
									await this._log("Невозможно выставить страховочный ордер (недостаточно баланса)");
								}
							}
						}
						else {
							nextSafeOrders.push(order);
						}
					} else {
						this._log((i + 1) + 'й страховочной ордер - ' + JSON.stringify(order));
						
					}
				}
				catch(error) {
					console.log(error);
				}
			}
			this.safeOrders = nextSafeOrders;

		} else if(this.isFreeze() && !this.isPreFreeze()) {
			//тип вроде нихуя делать не надо ибо бот заморожен
		} else if(!this.isFreeze() && this.isPreFreeze() && this.isNeedToOpenNewSafeOrders()) {
			//тип надо выставить некст сейв ордер, если еще можно
			let newSafeOrder = await this.createSafeOrder();
			
			if(newSafeOrder.orderId) {
				this.orders.push(newSafeOrder);
				this.safeOrders.push(newSafeOrder);
				// nextSafeOrders.push(newSafeOrder);
			} else {
				await this._log("Невозможно выставить страховочный ордер (недостаточно баланса)");
			}
			// this.safeOrders = nextSafeOrders;

		} else {
			let price = await this.getLastPrice(),
				stopPrice = this.getStopPrice();
			
			await this._log(`Проверка stoploss. (${stopPrice})`);

			if(stopPrice > price) {
				await this._log(`Stoploss пройден.`);
				await this.cancelAllOrders(user);
				await this.disableProcess('Все распродано по рынку, бот выключен', CONSTANTS.CONTINUE_FLAG);
			}
		}
		await this.updateProcess(user);
		sleep(CONSTANTS.TIMEOUT);
		return '';
	}

	async checkOrder(user = this.user, orderId = 0, resolve = () => {}, reject = () => {}, time = Date.now()) {
		const tenMin = 600000,
			timeout = CONSTANTS.ORDER_TIMEOUT;
			
		let order = await this.getOrder(orderId);
			
		if(order.orderId) {
			const ind = this.orders.findIndex(elem => elem.orderId === order.orderId);
			if(ind === -1) this.orders.push(new Order(order));
			else this.orders[ind] = new Order(order);

			await this.updateProcess(user);

			if(this.checkFilling(order.status)) { // если оредер заполнен
				resolve(new Order(order));
			} else if(this.checkCanceling(order.status) || this.checkFailing(order.status)) { // если ордер отменили или произошла ошибка
				resolve({});
			} else if( (Date.now() - time) >= tenMin) { // если время ожидания прошло
				await this.cancelOrder(order);
				reject('time_limit');
			} else { 
				setTimeout( () => {
					this.checkOrder(user, orderId, resolve, reject, time);
				}, timeout);
			}

		} else {
			this.setErrors(щквук, `Проблема с checkOrder ${orderId}`);
			reject('error');
		}
	}

	async firstBuyOrder(user = this.user, orderId = 0) {
		return new Promise( async (resolve, reject) => {

			await this._log('первая закупка монет');
			let price = await this.getLastPrice(),
				quantity = this.setQuantity(price, 0, true), 
				newBuyOrder = await this.newBuyOrder(price, CONSTANTS.ORDER_TYPE.LIMIT, quantity);
			
			if(newBuyOrder === '2010') {
				console.log('2010')
				reject(newBuyOrder);
			} else {
				let orderId = newBuyOrder.orderId,
					order = await this.getOrder(orderId);
				
				console.log('____________________-')
				if(order.orderId) {
					this.orders.push(order);
					this.currentOrder = order;
	
					await this.updateProcess(user);
					await this._log('первый закупочный - ' + order.price + ', ' + order.origQty + ', (~total ' + (order.price * order.origQty) + ')...');
					
					this.checkOrder(user, orderId, resolve, reject);
				} else {
					this.setErrors(order, `Проблема с currentOrder ${this.currentOrder}`);
					this._log("проблема с getOrder в закупке первого ордера");
					reject('error');
				}
			}

		});
	}

	async newBuyOrder(price = 0, type = CONSTANTS.ORDER_TYPE.LIMIT, quantity = this.getQuantity(price), prevError = this.JSONclone({}), isSave = false, amount = 0) {
		
		let symbol = this.getSymbol(),
			newOrderParams = {
				symbol: symbol,
				side: CONSTANTS.ORDER_SIDE.BUY,
				quantity: quantity,
				recvWindow: CONSTANTS.RECV_WINDOW
			};
		if(type === CONSTANTS.ORDER_TYPE.LIMIT)	
			newOrderParams.price = price;
		else 
			newOrderParams.type = type;

		try{
			let newBuyOrder = await this.Client.order(newOrderParams);
			await this._log('попытка создать ордер - ' + newBuyOrder.price + ', ' + newBuyOrder.origQty);
			MDBLogger.info({user: {userId: this.user.userId, name: this.user.name}, botID: this.botID, botTitle: this.botTitle, processId: this.processId, newBuyOrder, fnc: 'newBuyOrder'});
			return new Order(newBuyOrder);
		}
		catch(error) {
			// await this._log(this.errorCode(error));
			MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, error, prevError, botID: this.botID, botTitle: this.botTitle, processId: this.processId, price, quantity, amount, fnc: 'newBuyOrder'});
			if(quantity > 0) {
				let step = this.botSettings.decimalQty;
				if(
					(await this.isError1013(error) && await this.isError2010(prevError)) ||
					(await this.isError1013(prevError) && await this.isError2010(error))
				) {
					if(!isSave) {
						return await this.disableProcess('Невозможно купить монеты (Недостаточно средств на балансе)');
					} else if(await this.isError2010(error)) {
						return '2010';
					}
				}
				else if(amount >= 3 && await this.isError2010(error)) return '2010'
				else if(await this.isError1013(error)) quantity += step;
				else if(await this.isError2010(error)) quantity -= step;
				
				let order = await this.newBuyOrder(price, type, this.toDecimal(quantity), error, isSave, ++amount);
				return order;
			} else return {};
		}
	}

	async newSellOrder(price = 0, type = CONSTANTS.ORDER_TYPE.LIMIT, quantity = this.getQuantity(price), prevError = this.JSONclone({}), amount = 0) {
		console.log(price)
		let qtyWithoutFee = this.toDecimal(quantity * (1 - CONSTANTS.BINANCE_FEE / 100));
		let pair = this.getSymbol(),
			newOrderParams = {
				symbol: pair,
				side: CONSTANTS.ORDER_SIDE.SELL,
				quantity: qtyWithoutFee,
				recvWindow: CONSTANTS.RECV_WINDOW
			};
		if(type === CONSTANTS.ORDER_TYPE.LIMIT)	
			newOrderParams.price = price;
		else 
			newOrderParams.type = type;

		try{
			let newSellOrder = await this.Client.order(newOrderParams);
			this.recountQuantity(newSellOrder.origQty, 1);
			await this._log('создан оредер - цена: ' + newSellOrder.price + ', кол-во: ' + newSellOrder.origQty);
			MDBLogger.info({user: {userId: this.user.userId, name: this.user.name}, price, type, pair, quantity, qtyWithoutFee, botID: this.botID, botTitle: this.botTitle, processId: this.processId, newSellOrder, fnc: 'newSellOrder'});
			return new Order(newSellOrder);
		} catch(error) {
			MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, price, type, pair, quantity, qtyWithoutFee, error: JSON.stringify(error), prevError, botID: this.botID, botTitle: this.botTitle, processId: this.processId, price, quantity, amount, fnc: 'newSellOrder'});
			console.log(error);
			console.log(this.errorCode(error), this.errorCode(prevError), price);
			// await this._log(this.errorCode(error));
			if(quantity > 0 && amount <= 50) {
				let step = this.botSettings.decimalQty;
				if(
					(await this.isError1013(error) && await this.isError2010(prevError)) ||
					(await this.isError1013(prevError) && await this.isError2010(error))
				) return await this.disableProcess('Невозможно продать монеты');
				else if(await this.isError1013(error)) quantity += step;
				else if(await this.isError2010(error)) quantity -= step;

				let order = await this.newSellOrder(price, type, this.toDecimal(quantity), error, ++amount);
				return order;
			} else return {};
		}
	}

	async createSafeOrders(price = 0, quantity = 0) {
		let amount = this.getMaxOpenedAmount(),
			safeOrders = [],
			curPrice = price,
			curQty = quantity,
			errQty = 0;
		await this._log(`создание страховочных ордеров (qty - ${quantity}, откроет ордеров - ${amount})`);
		for(let i = 0; i < amount; i++) {
			let newOrder = {};
			if(!this.getMartingaleActive()) newOrder = await this.createSafeOrder(curPrice);
			else newOrder = await this.createSafeOrder(curPrice, curQty);

			if(newOrder.orderId) {
				curPrice = newOrder.price;
				curQty = newOrder.origQty;
				
				safeOrders.push(newOrder);
			} else {
				errQty++;
				await this._log(errQty + 'й страховочный ордер не создался');
				if(this.getAmount() > errQty) {
					amount++;
				}
			}
		}
		return safeOrders;
	}

	async createSafeOrder(price = this.botSettings.lastSafeOrderPrice, quantity = 0) {

		let maxOpenSO = this.getMaxOpenedAmount(),
			currentQtyUsedSO = this.getQtyOfUsedSafeOrders(),
			currentQtyActiveSO = this.getQtyOfActiveSafeOrders(),
			maxAmountSO = this.getAmount(),
			deviation = this.getDeviation(),
			lastSafeOrder = this.getLastSafeOrder() || {},
			decimal = this.getDecimal(price || lastSafeOrder.price),
			newOrder = {};
		price = Number(price);

		if(maxOpenSO > currentQtyActiveSO && maxAmountSO > currentQtyUsedSO) {
			this.botSettings.quantityOfUsedSafeOrders ++;
			this.botSettings.quantityOfActiveSafeOrders ++;
			let lastSafeOrderPrice = Number(lastSafeOrder.price) || price,
				newPrice = this.toDecimal(lastSafeOrderPrice - lastSafeOrderPrice * deviation, decimal),
				qty = 0;
			if(quantity) qty = this.toDecimal(quantity * this.getMartingaleValue());
			else if(this.getMartingaleActive()) qty = this.toDecimal(Number(lastSafeOrder.origQty) * this.getMartingaleValue());
			else qty = this.getQuantity(newPrice, 1);

			
			await this._log(`новый страховочный ордер (price - ${newPrice})`);
			try {
				newOrder = await this.newBuyOrder(newPrice, CONSTANTS.ORDER_TYPE.LIMIT, qty, {}, true);
				if(newOrder.orderId) this.botSettings.lastSafeOrderPrice = newOrder.price;
			}
			catch(error) {
				await this._log(JSON.stringify(error));
			}
		}	
		return newOrder;
	}
	
	
	async _log(message = '') {
		let date = this.getDate(),
			nextMessage = {};
		nextMessage = `${date}|  ${message}`;

		// if(this.log.length && this.log[0].indexOf(message) >= 0) this.log[0] = nextMessage;
		// else this.log.unshift(nextMessage) ;
		await this.updateLog(nextMessage);
	}

	toDecimal(value = 0, decimal = this.getDecimal(0, false)) {
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
	
	countDecimalNumber(x = 0) {
		x = x.toString();
		if(x.indexOf('e-') >= 0) {
			return Number(x.split('e-')[1]);
		} else {
			return (x.toString().includes('.')) ? (x.toString().split('.').pop().length) : (0);
		}
	}

	setRunnigProcess(nexStatus = false) {
		this.runningProcess = nexStatus;
		this.finallyStatus = !nexStatus ? nexStatus : this.finallyStatus;
	}

	async setNextBotSettings() {
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
		bs.martingale = next.martingale;
		bs.maxAmountPairsUsed = next.maxAmountPairsUsed;
		bs.minNotional = next.minNotional;
		bs.decimalQty = await Symbols.getLotSize(this.getSymbol());
		bs.tickSize = await Symbols.getTickSize(this.getSymbol());

		this.updateStatus = false;
	}

	async disableProcess(message = '') {
		
		try {
			if(this.symbol) await this.cancelOrders(this.safeOrders);
		} catch(error) {					
			MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, sOrders: this.safeOrders, error, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'disableProcess'});
			await this._log(JSON.stringify(error));
		}
		await this._log(`завершение процесса, причина -> (${message})`);
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
		// if(this.symbol) 
		this.orders = await this.updateOrders(this.orders);

		this.status = CONSTANTS.BOT_STATUS.INACTIVE;
		this.finallyStatus = CONSTANTS.BOT_STATUS.INACTIVE;

		 
		await this._log(`процесс завершен.`);
		return 'disable';
	}

	async cancelAllOrders(user = this.user) {
		await this._log('Завершение всех ордеров и продажа по рынку.');
		try{
			if(this.currentOrder.orderId) {
				try {
					if(this.symbol) await this.cancelOrders(this.safeOrders);
				} catch(error) {					
					MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, sOrders: this.safeOrders, error, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'cancelAllOrders'});
					await this._log(JSON.stringify(error));
				}
				await this.cancelOrder(this.currentOrder);
	
				if(this.isOrderSell(this.currentOrder.side)) {
					let lastPrice = await this.getLastPrice(),
						qty = this.getQuantity(),
						newOrder = await this.newSellOrder(lastPrice, CONSTANTS.ORDER_TYPE.MARKET, qty);
					
					if(newOrder.orderId) {
						this.orders.push(newOrder);
					} else {
						await this._log(`Невозможно выставить sell ордер (${JSON.stringify(newOrder)})`);
					}
				}
				
				this.orders = await this.updateOrders(this.orders);
				let cOrd = await this.getOrder(this.currentOrder.orderId);
				if(cOrd.orderId) {
					this.currentOrder = cOrd;
				} else {
					this.setErrors(cOrd, `Проблема с currentOrder ${this.currentOrder}`);
				}
				await this.updateProcess(user);
				return {
					status: 'info',
					message: 'Все ордера отменены и монеты распроданы по рынку'
				};
			} else {
				return {
					status: 'error',
					message: 'Невозможно продать монеты, так как ордеров нет или первый закупочный ордер еще не завершился.'
				};
			}
		} catch(error) {
			console.log(error);
			await this._log(JSON.stringify(error));
			return {
				status: 'error',
				message: `Ошибка процессе завершения всех ордеров и продажи по рынку (код ошибки ${this.errorCode(error)}) :: ${error}`
			};
		}
	}

	async cancelAllOrdersWithoutSell(user = this.user) {
		await this._log('Завершение всех ордеров.');
		try{
			if(this.currentOrder.orderId) {
				try {
					if(this.symbol) await this.cancelOrders(this.safeOrders);
				} catch(error) {					
					MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, sOrders: this.safeOrders, error, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'cancelAllOrdersWithoutSell'});
					await this._log(JSON.stringify(error));
				}
				await this.cancelOrder(this.currentOrder);

				this.orders = await this.updateOrders(this.orders);
				await this.updateProcess(user);
				return {
					status: 'info',
					message: 'Все ордера отменены'
				};
			} else {
				return {
					status: 'error',
					message: 'Невозможно продать монеты, так как ордеров нет или первый закупочный ордер еще не завершился.'
				};
			}
		}
		catch(error) {
			await this._log(JSON.stringify(error));
			return {
				status: 'error',
				message: `Ошибка процессе завершения всех ордеров и продажи по рынку (код ошибки ${this.errorCode(error)}) :: ${error}`
			};
		}
	}

	// async cancelOrders(orders) {
	// 	for(let i = 0; i < orders.length; i++) 
	// 		await this.cancelOrder(orders[i]);
	// }

	cancelOrders(orders = []) {
		console.log('cancelOrders')
		return new Promise( async (resolve, reject) => {
			let l = orders.length;
			if(l) {
				for(let i = 0; i < l; i++) {
					console.log(i);
					if(i === l - 1) {
						console.log('!!!!')
						this.cancelOrder(orders[i], resolve, reject);
					} else {
						this.cancelOrder(orders[i]);
					}
				}
			} else {
				resolve(true);
			}
		});
	}

	async cancelOrder(order = {}, resolve, reject) {
		if(typeof order === 'number') {
			order = await this.getOrder(order);
		}
		// orderId = Number(orderId);
		try {
			// let order = await this.getOrder(orderId),
			let pair = this.getSymbol(),
				side = order.side,
				orderId = order.orderId,
				qty = order.origQty,
				status = '',
				message = '';

			if(orderId) {
				try {
					var cancelOrder = await this.Client.cancelOrder({
						symbol: pair,
						orderId: orderId
						// ,
						// recvWindow: CONSTANTS.RECV_WINDOW
					});
					if(this.isOrderSell(side)) {
						this.recountQuantity(qty);
					}
					status = 'ok';
					message = `ордер ${cancelOrder.orderId} завершен`;
					if(resolve) resolve(message);
				} catch(error) {
					MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, order: {orderId: orderId, symbol: pair}, error, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'cancelOrder'});
					status = 'error';
					message = `ошибка при завершении ордера ${cancelOrder.orderId}`;
					if(reject) reject(message);
				}
				
				await this._log('закрытие ордера - ' + message);
				return {
					status: status,
					message: message,
					data: { order: cancelOrder }
				};
			} else {
				status = 'error';
				message = `Проблема с закрытием ордера ${orderId}`;
				data = order;
				if(reject) reject(message);

				this.setErrors(order, message);
				return { status, message, data };
			}

		} catch(error) {
			MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, error: error, order: {orderId: order.orderId, symbol: this.getSymbol(), order}, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'cancelOrder'})
			await this._log('закрытие ордера - ' + JSON.stringify(error));
			if(reject) reject(error);
			return {
				status: 'error',
				message: error,
				data: { orderId: order.orderId }
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
		await this.cancelOrder(this.currentOrder);
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
		// this.dealOrders.push(...this.safeOrders);
		this.orders.push(this.currentOrder);
		// this.dealOrders.push(this.currentOrder);
		await this.updateProcess(user);
		await this._log('Разморозка бота успешно завершена.');
	}

	async createOrders(orders = []/*, type = 'safe'*/) {
		const length = orders.length;
		let newOrders = [];

		for(let i = 0; i < length; i++) {
			let order = await this.createOrder(orders[i]);
			if(order.orderId) newOrders.push(order);
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
	setErrors(errorCode = 0, description = '') {
		this.errors.isExist = true;
		this.errors.description = {
			code: errorCode,
			message: description
		};
	}

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
			} catch(err) {
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

	setQuantity(price = 0, quantity = 0, isFirst = false) {
		console.log(price, this.botSettings.currentOrder)
		if(isFirst) {
			let qty = this.toDecimal(Number(this.botSettings.currentOrder)/ price);
			let nextQty = 0, check = false, i = 0, marketPrice = 0;
			do { 
				console.log(i, nextQty, this.botSettings.minNotional,marketPrice, check)
				// if purchased qty will be sell by market without activate sefe order
				// we need add min deviation to first qty  
				i++;
				nextQty = qty + qty * i * CONSTANTS.BINANCE_FEE / 100;
				marketPrice = price * nextQty * (1 - Number(this.botSettings.deviation) / 100); 
				check = this.botSettings.minNotional > marketPrice;
			} while(check);

			this.botSettings.quantity = nextQty;
		} else {
			this.botSettings.quantity = price ? this.toDecimal(Number(this.botSettings.currentOrder)/ price) : Number(quantity);
		}
		return Number(this.botSettings.quantity);
	}

	setDealId() {
		this.dealId = uniqid(DL);
		this.dealOrders = [];
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
			stopPrice = stopLoss ? price - price * stopLoss : 0;
		return this.toDecimal(stopPrice, decimal);
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

	getProfitPrice(price = 0, flag = true) {
		// price = Number(price);
		let takeProfit = this.getTakeProfit(),
			decimal = this.getDecimal(price, flag);
		
		console.log(decimal)
		price = Number(price);

		let	profitPrice = price + price * takeProfit;
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


	// вот в этой еб*чей функции по ночам в 00:40 по минскому времени появляется неизвестная ошибка с ответа сервера бинанса
	// и этот момент нужно обработать что бы все работало шикарно, еб вашу мать!
	// async getOrder(orderId = 0) {
	// 	orderId = Number(orderId);
	// 	let pair = this.getSymbol(),
	// 		order = {};
	// 	try{
	// 		order = await this.Client.getOrder({
	// 			symbol: pair,
	// 			orderId: orderId
	// 		});
	// 	} catch(error) {
	// 		console.log(error)
	// 		MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, error, order: {symbol: pair, orderId: orderId, order: order}, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'getOrder'})
	// 		// if(await this.isError1021(error)) {
	// 		// 	console.log('ошибочка с меткой времени и окном', orderId);
	// 		await this._log( 'произошла ошибка при getOrder (errCode: ' + this.errorCode(error) + ')' );
	// 		if(this.isError2013(error)) {
	// 			console.log(error);
	// 			return this.errorCode(error);
	// 		} else {
	// 			return await this.getOrder(orderId);
	// 		}
	// 	}
	// 	return new Order(order);
	// }

	async getOrder(orderId = 0) {
		return new Promise( async (resolve, reject) => {
			this.getOrder_helper(orderId, resolve, reject);
		});
	}

	async getOrder_helper(orderId = 0, resolve = () => {}, reject = () => {}, isError = false) {
		if(isError) {
			MDBLogger.info({user: {userId: this.user.userId, name: this.user.name}, orderId, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'getOrder_helper'})
		}
		orderId = Number(orderId);
		let order = {};
		if(orderId) {
			try {
				let symbol = this.getSymbol();
				order = await this.Client.getOrder({ symbol, orderId, useServerTime: true });
				resolve(new Order(order));
			} catch (error) {
				await this._log( 'произошла ошибка при getOrder (errCode: ' + this.errorCode(error) + ')' + JSON.stringify(error) );
				MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, error, order: {symbol, orderId, order}, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'getOrder'})
				if(this.isError2013(error)) {
					reject(new Order(order));
				} else {
					sleep(10);
					this.getOrder_helper(orderId, resolve, reject, true);
				}
			}	
		} else {
			resolve(new Order(order));
		}
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

	getDecimal(price = 0, flag = true) {
		price = flag ? Number(this.botSettings.tickSize) : this.botSettings.decimalQty;
		// console.log(this.botSettings.tickSize)
		// price = Number(this.botSettings.tickSize);
		console.log(price)
		let ret = this.countDecimalNumber(price);
		console.log(ret)
		return ret;
	}

	async getLastPrice() {
		let pair = this.getSymbol();
		try {
			let price = await this.Client.prices();
			return Number(price[pair]);
		} catch(error) {
			MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, orderId, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'getLastPrices'})
			
			let price = await this.Client.prices();
			return Number(price[pair]);
		}
	}

	getSymbol() {
		return this.symbol;
	}

	getChangeUserKey(field = '', botInd = null) {
		return field ? `bots.${botInd}.processes.${this.processId}.${field}` : `bots.${botInd}.processes.${this.processId}`;
	}

	getChangeKey(field = '') {
		// _userOrders_._user_._botID_._processId_
		return field ? `bots.${this.botID}.processes.${this.processId}.${field}` : `bots.${this.botID}.processes.${this.processId}`;
	}

	async getChangeUserObject(field = '', data = null) {
		const user = { name: this.user.name },
			botInd = await this.getBotIndex(user);
		
		if(botInd !== -1) {
			let key = this.getChangeUserKey(field, botInd),
				obj = {};
			
			obj[key] = data;
	
			return obj;
		} else {
			return -1;
		}
	}

	getChangeObject(field = '', data = null) {
		let key = this.getChangeKey(field),
			obj = {};
		
		obj[key] = data;
		return obj;
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
	async updateLog(nextMessage = '') {
		// const user = { name: this.user.name };
		// try {
		// 	let change = await this.getChangeUserObject('log', this.log);
		// 	if(change !== -1) {
		// 		await Mongo.syncUpdate(user, change, 'users');
		// 	}
		// } catch(err) {
		// 	console.log(err);
		// }
		nextMessage = '\r\n' + nextMessage;
		let path = Logger.getPath(`/Users/${this.user.name}(${this.user.userId})/${this.botTitle}(${this.botID})/${this.processId}`);
		await Logger.append(path, '/log.txt', nextMessage);


	}

	async updateLocalProcess(next = this, nextSymbol = this.symbol) {
		this.updateStatus = true;
		let nextProcessSettings = {
			symbol: (this.isAuto()) ? this.symbol : nextSymbol,
			initialOrder: Number(next.botSettings.initialOrder),
			safeOrder: next.botSettings.safeOrder,
			stopLoss: next.botSettings.stopLoss,
			takeProfit: next.botSettings.takeProfit,
			tradingSignals: next.botSettings.tradingSignals,
			maxOpenSafetyOrders: next.botSettings.maxOpenSafetyOrders,
			deviation: next.botSettings.deviation,
			martingale: next.botSettings.martingale,
			maxAmountPairsUsed: next.botSettings.maxAmountPairsUsed,
			minNotional: next.botSettings.minNotional
		}
		this.nextProcessSettings = nextProcessSettings;
	}

	async updateProcess(user = this.user, message = '') {
		user = { name: user.name };
		// await this.updateProcessOrdersList(user);
		let change = await this.getChangeUserObject('', this);
		if(change !== -1) {
			await Mongo.syncUpdate(user, change, CONSTANTS.USERS_COLLECTION);
		}
	}

	// async updateProcessOrdersList(user = this.user) {
	// 	user = { name: user.name };
	// 	let data = await Mongo.syncSelect(user, 'users');
	// 	data = data[0];
	// 	const botInd = await this.getBotIndex(user, data);
	// 	if(botInd != -1) {
	// 		let ordersList = data.bots[botInd].processes[this.processId].ordersList;
	// 		!ordersList && (ordersList = {});
	
	// 		let processId = `${this.processId}${this.botID}-${this.processId}`;
	// 		!ordersList[processId] && (ordersList[processId] = []);
	// 		ordersList[processId] = this.orders;
	
	// 		let change = await this.getChangeUserObject('ordersList', ordersList);
	// 		if(change !== -1) {
	// 			await Mongo.syncUpdate(user, change, 'users');
	// 		}
	// 	}
	// }

	async updateProcessOrdersList(user = this.user) {
		const collection = CONSTANTS.USERS_DATA_COLLECTION;
		user = { name: user.name };
		let ordersList = this.orders;
		ordersList = await this.updateOrders(ordersList);
		let change = await this.getChangeObject(`orders.${this.dealId}`, ordersList);
		await Mongo.syncUpdate(user, change, collection);
	}

	async updateOrders(orders = []) {
		let nextOrders = [],
			len = orders.length;
		for(let i = 0; i < len; i++) {
			try{
				if(!orders[i].isUpdate) {
					let order = await this.getOrder(orders[i].orderId);
					if(order.orderId) {
						if(this.checkFailing(order.status) || this.checkFilling(order.status)) order.isUpdate = true;
						nextOrders.push(order);
					}
				} else {
					nextOrders.push(orders[i]);
				}
			} catch(error) {
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
		// await this._log('ошибка code:' + code + ', Временная метка для этого запроса находится вне recvWindow');
		return code === -1021;
	}

	//MIN_NOTATIAN
	async isError1013(error = new Error('default err')) { 
		let code = this.errorCode(error);
		// await this._log('ошибка code:' + code + ', Количество продоваемых монет ниже минимально-допустимого');
		return code === -1013;
	}

	//Order does not exist
	async isError2013(error = new Error('default err')) {
		let code = this.errorCode(error);
		// await this._log('ошибка code:' + code + ', Order does not exist');
		return code === -2013;
	}

	//insufficient balance
	async isError2010(error = new Error('default err')) { 
		
		let code = this.errorCode(error);
		// await this._log('ошибка code:' + code + ', Недостаточно средств на балансе валюты');
		return code === -2010;
	}

	// Неверные бинанс ключи
	async isError2014(error = new Error('default err')) {
		
		let code = this.errorCode(error);
		// await this._log('ошибка code:' + code + ', Неверные бинанс ключи');
		return code === -2014
	}
	//:: ERRORS TYPES END

	//************************************************************************************************//

	//:: CHECK FUNC
	
	isNeedToOpenNewSafeOrders() {
		let maxOpenSO = this.getMaxOpenedAmount(),
			currentQtyUsedSO = this.getQtyOfUsedSafeOrders(),
			currentQtyActiveSO = this.getQtyOfActiveSafeOrders(),
			maxAmountSO = this.getAmount();

		return (maxOpenSO > currentQtyActiveSO && maxAmountSO > currentQtyUsedSO);
	}

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

	isFreeze() {
		return this.freeze === CONSTANTS.BOT_FREEZE_STATUS.ACTIVE;
	}

	isPreFreeze() {
		return this.preFreeze === CONSTANTS.BOT_FREEZE_STATUS.ACTIVE;
	}
	//:: CHECK FUNC END
}