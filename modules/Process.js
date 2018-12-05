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

//decimalQty - qty step size
//tickSize - price step size

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
		finalProcessStatus = CONSTANTS.PROCESS_STATUS.NEUTRAL,
		preFreeze = freeze,
		unsoldOrdersFlag = false,
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
		purchasedOrders = [],
		requiredProffit = 0,
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
		this.finalProcessStatus = this.JSONclone(finalProcessStatus);
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
		this.user = this.JSONclone(user);
		this.botID = this.JSONclone(botID);
		this.botTitle = this.JSONclone(botTitle);
		this.errors = this.JSONclone(errors);
		this.requiredProffit = this.JSONclone(requiredProffit);
		this.purchasedOrders = this.JSONclone(purchasedOrders);
		this.unsoldOrdersFlag = this.JSONclone(unsoldOrdersFlag);
	}

	JSONclone(object = {}) {
		try {
			return JSON.parse(JSON.stringify(object));
		} catch(error) {
			MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, object, error: error, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'JSONclone'});
			try {
				return Object.assign({}, object);
			} catch(err) {
				MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, object, err, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'JSONclone_1'});
				return {};
			}
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
		console.log('khm')
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

	countFirstBuyPrice({ origQty = '', cummulativeQuoteQty = '' }) {
		console.log(origQty, cummulativeQuoteQty);
		return this.toDecimal(Number(cummulativeQuoteQty) / Number(origQty), this.getDecimal());
	}

	async startTrade(user) {
		return new Promise( async (resolve, reject) => {
			console.log('startTrade')
			await this._log('Начало нового цикла торговли.');
			if(this.setClient(user)) {
				this.currentOrder = {};
				this.firstBuyOrder(user)
					.then( async newBuyOrder => {
						
						console.log('firstOrder bouth')
						console.log(newBuyOrder.orderId)
						if(newBuyOrder.orderId) {
							console.log('oke')
							let orderQtyWithoutFee = Number(newBuyOrder.origQty) * (1 - CONSTANTS.BINANCE_FEE / 100); 
							let qty = this.setQuantity(undefined, orderQtyWithoutFee);
							console.log(orderQtyWithoutFee, qty)
							let price = this.countFirstBuyPrice(newBuyOrder),
								cummulativeQuoteQty = Number(newBuyOrder.cummulativeQuoteQty),
								cummulativeQuoteQtyWithoutFee = Number(cummulativeQuoteQty) * (1 - CONSTANTS.BINANCE_FEE / 100),
								proffitCummulativeQuoteQty = cummulativeQuoteQtyWithoutFee * ( 1 + this.getTakeProfit()),
								profitPrice = this.toDecimal(proffitCummulativeQuoteQty / qty, this.getDecimal(), true, true);
							console.log(qty, profitPrice)
							console.log('???')
							await this.awaitFreeze();
							this.requiredProffit = cummulativeQuoteQtyWithoutFee * this.getTakeProfit();
							this.botSettings.firstBuyPrice = price;
							this.botSettings.firstBuyTotal = cummulativeQuoteQtyWithoutFee;
							this.purchasedOrders.push(newBuyOrder);
							console.log(profitPrice, qty);
							this.newSellOrder(profitPrice, CONSTANTS.ORDER_TYPE.LIMIT, qty, async newSellOrder => {
								if(newSellOrder !== CONSTANTS.DISABLE_FLAG && newSellOrder.orderId) {
									
									console.log('newsellOrder is send', newSellOrder.orderId)
									this.currentOrder = newSellOrder;
									this.orders.push(newSellOrder);
									
									let safeOrders = await this.createSafeOrders(Number(price), Number(qty));
									console.log('created ' + safeOrders.length + ' safe orders');
									this.safeOrders.push(...safeOrders);
									this.orders.push(...safeOrders);
									
									await this.updateProcess(user);
									
									this.sleep(CONSTANTS.TIMEOUT, () => {
										this.trade(user, false, resolve, reject);
										console.log('never')
									});
								} else {
									await this.disableProcess(CONSTANTS.PROCESS_STATUS.ERROR, 'Неуспешная продажа монет. Ошибка при выставлении sell ордера (невозможно продать купленное кол-во монет по профит цене).');
									await this.updateProcess(user);
									resolve('finish');
								}
							});
							

						} else {
							await this.disableProcess(CONSTANTS.PROCESS_STATUS.ERROR, 'Неуспешная покупка начального ордера.');
							await this.updateProcess(user);
							resolve('finish');
						}
					}).catch( async error => {
						MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, error, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'startTrade'});
						if(error === 'error') {
							await this.disableProcess(CONSTANTS.PROCESS_STATUS.ERROR, 'Неуспешная покупка начального ордера.');
							await this.updateProcess(user);
							reject('finish');
						} else if(error === 'time_limit') {
							await this.disableProcess(CONSTANTS.PROCESS_STATUS.ERROR, 'Превышено ожидание покупки начального ордера.');
							await this.updateProcess(user);
							resolve('finish');
						} else if(error === '2010') {
							await this.disableProcess(CONSTANTS.PROCESS_STATUS.ERROR, 'Недостаточно средств для покупки начального ордера.');
							await this.updateProcess(user);
							reject('finish');
						}
					});
			} else {
				await this.disableProcess(CONSTANTS.PROCESS_STATUS.ERROR, 'Невозможно начать работу с бинансом, проверьте ключи');
				await this.updateProcess(user);
				reject('finish');
			}
		});
	}

	continueTrade(user = this.user) {
		console.log('continueTrade', this.botTitle)
		if(this.setClient(user)) {
			console.log('continueTrade', this.botTitle, 1)
			return new Promise( async (resolve, reject) => {
				this.trade(user, false, resolve, reject);
			});
		}
	}

	async checkUnsoldOrders(unclosedOrders = []) {
		return new Promise( (resolve, reject) => {
			if(unclosedOrders.length) {
				let allTotal = 0, allQty = 0;
				unclosedOrders.forEach(order => {
					if(this.isOrderBuy(order.side) && this.checkFilling(order.status)) {
						allTotal += Number(order.cummulativeQuoteQty);
						allQty += Number(order.origQty) * (1 - CONSTANTS.BINANCE_FEE / 100);
					}
				});
				
				allTotal = allTotal * (1 - CONSTANTS.BINANCE_FEE / 100);
				let take_proffit = this.getTP(allTotal);
				let total_proffit = allTotal * (1 + take_proffit + CONSTANTS.BINANCE_FEE / 100);
				let price_proffit = this.toDecimal(total_proffit / allQty, this.getDecimal(), true, true);

				this.newSellOrder(price_proffit, CONSTANTS.ORDER_TYPE.LIMIT, allQty, async newSellOrder => {
					if(newSellOrder !== CONSTANTS.DISABLE_FLAG && newSellOrder.orderId) {
						this.currentOrder = newSellOrder;
						this.orders.push(newSellOrder);

						this.safeOrders = [];
						this.setQuantity(undefined, allQty);
						this.unsoldOrdersFlag = true;
	
						await this.updateProcess(this.user);
						resolve({
							status: 'ok'
						});
					} else {
						await this.updateProcess(this.user);
						reject({
							status: 'error',
							message: 'Невозможно продать монеты.',
							processStatus: CONSTANTS.PROCESS_STATUS.ERROR
						});
					}
				});

			} else {
				reject({
					status: 'ok',
					message: 'Процесс удачно завершён.',
					processStatus: CONSTANTS.PROCESS_STATUS.OK
				});
			}
		});
	}

	async trade(user = this.user, flag = false, resolve = () => {}, reject = () => {}, tickTime = 0) {
		console.log()
		console.log()
		console.log()
		console.log()
		console.log('       trade, ', this.botTitle)
		if(this.currentOrder.orderId) {	
			console.log('__')

			if(this.isOrderSell(this.currentOrder.side)) {
				console.log('ordersell')
				this.getOrder(this.currentOrder.orderId, async tmpCurOrd => {
					console.log('after getting current order', tmpCurOrd.orderId)
					
					if(tmpCurOrd.orderId) {
						this.currentOrder = tmpCurOrd;
						let currentOrderStatus = this.currentOrder.status;
						if(this.checkFilling(currentOrderStatus) && !this.isFreeze()) {
							console.log('curOrder is filling');
							let uncolsedOrders = [];
							try {
								await this.cancelOrders(this.safeOrders, result => {
									console.log('addORDERRRS', result)
									if(result.error && result.order && this.isError2011(result.error)) {
										console.log('??')
										uncolsedOrders.push(result.order);
									}
								});
							} catch(error) {
								console.log(uncolsedOrders)
								console.log(error)
								MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, error, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'trade'});
							}
							this.checkUnsoldOrders(uncolsedOrders)
								.then(async result => {
									if(result.status === 'ok') {
										this.sleep(CONSTANTS.TIMEOUT, () => {
											this.trade(user, false, resolve, reject);
										});
									} else {
										await this.disableProcess(result.processStatus, result.message, false);
										await this.updateProcess(user);
										resolve('finish');
									}
								})
								.catch(async error => {
									await this.disableProcess(error.processStatus, error.message, false);
									await this.updateProcess(user);
									resolve('finish');
								});

						} else if(this.checkFailing(currentOrderStatus) && !this.isFreeze()) {
							console.log('curOrder is failing')
							await this.disableProcess(CONSTANTS.PROCESS_STATUS.CANCEL, 'Процесс завершен (ордер отменен).');
							await this.updateProcess(user);
							resolve('finish');
	
						} else {
							console.log('curOrder in process')
							this.process(user).then( async ret => {
								console.log('after process', ret);
								if(ret !== 'finish') {
									this.orders = await this.updateOrders(this.orders);
			
									if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) {
										console.log('__conttrade')
										await this.updateProcess(user);
										this.sleep(CONSTANTS.TIMEOUT, () => {
											this.trade(user, false, resolve, reject);
										});
									} else if(this.status === CONSTANTS.BOT_STATUS.INACTIVE) {
										console.log('__innn')
										if(this.currentOrder.orderId) {
											await this.updateProcess(user);
											this.sleep(CONSTANTS.TIMEOUT, () => {
												this.trade(user, false, resolve, reject);
											});
			
										} else if(this.isFreeze()) {
											await this._log('Ожидание разморозки бота');
											await this.updateProcess(user);
											this.sleep(CONSTANTS.TIMEOUT, () => {
												this.trade(user, false, resolve, reject);
											});
			
										} else {
											await this.disableProcess(CONSTANTS.PROCESS_STATUS.NEUTRAL, 'Процесс завершен');
											await this.updateProcess(user);
											resolve('finish');
										}
									}
								} else {
									reject(ret);
								}
							}).catch(error => {
								MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, botID: this.botID, botTitle: this.botTitle, processId: this.processId, error: JSON.stringify(error), fnc: 'trade->process__catch'});
								reject('error');
							});
						}
					} else {
						this.setErrors(tmpCurOrd, `Проблемы с получением информации об ордере! ${this.currentOrder.orderId}`);
						await this.disableProcess(CONSTANTS.PROCESS_STATUS.ERROR, `Проблемы с получением информации об ордере! ${this.currentOrder.orderId}`);
						await this.updateProcess(user);
						reject('finish');
					}
				});
				
			} else {
				const tenMin = 600000;

				this.getOrder(this.currentOrder.orderId, async cOrd => {
					console.log(this.botTitle, cOrd)
					if(cOrd.orderId) {
						this.currentOrder = cOrd;
						let currentOrderStatus = this.currentOrder.status;
		
						if(this.checkFilling(currentOrderStatus) && !this.isFreeze()) {
							//create new buy order
							this.getOrder(this.currentOrder.orderId, async newBuyOrder => {
								if(newBuyOrder.orderId) {
									let orderQtyWithoutFee = Number(newBuyOrder.origQty) * (1 - CONSTANTS.BINANCE_FEE / 100); 
									let qty = this.setQuantity(undefined, orderQtyWithoutFee);

									let price = this.countFirstBuyPrice(newBuyOrder),
										cummulativeQuoteQty = Number(newBuyOrder.cummulativeQuoteQty),
										cummulativeQuoteQtyWithoutFee = Number(cummulativeQuoteQty) * (1 - CONSTANTS.BINANCE_FEE / 100),
										proffitCummulativeQuoteQty = cummulativeQuoteQtyWithoutFee * ( 1 + this.getTakeProfit()),
										profitPrice = this.toDecimal(proffitCummulativeQuoteQty / qty, this.getDecimal(), true, true);
							
						
									await this.awaitFreeze();
									
									this.requiredProffit = cummulativeQuoteQtyWithoutFee * this.getTakeProfit();
									this.botSettings.firstBuyPrice = price;
									this.botSettings.firstBuyTotal = cummulativeQuoteQtyWithoutFee;

									this.purchasedOrders.push(newBuyOrder);
									console.log(profitPrice, qty, 1);
									this.newSellOrder(profitPrice, CONSTANTS.ORDER_TYPE.LIMIT, qty, async newSellOrder => {
										if(newSellOrder !== CONSTANTS.DISABLE_FLAG) await this.updateProcess(user);
					
										if(newSellOrder !== CONSTANTS.DISABLE_FLAG && newSellOrder.orderId) {
											await this.updateProcess(user);
											this.currentOrder = newSellOrder;
											this.orders.push(newSellOrder);
											// this.dealOrders.push(newSellOrder);
						
											let safeOrders = await this.createSafeOrders(price, qty);
											this.safeOrders.push(...safeOrders);
											this.orders.push(...safeOrders);
											// this.dealOrders.push(...safeOrders);
											await this.updateProcess(user);
											this.sleep(CONSTANTS.TIMEOUT, () => {
												this.trade(user, false, resolve, reject);
											})
										} else {
											await this.disableProcess(CONSTANTS.PROCESS_STATUS.ERROR, 'Неуспешная продажа монет. Ошибка при выставлении sell ордера (невозможно продать купленное кол-во монет по профит цене).');
											await this.updateProcess(user);
											reject('finish');
										}
									});
								} else {
									this.setErrors(cOrd, `Проблемы с получением информации об ордере! ${this.currentOrder}`);
									await this.disableProcess(CONSTANTS.PROCESS_STATUS.ERROR, 'Неуспешная покупка монет.');
									await this.updateProcess(user);
									reject('finish');
								}
							});
		
					} else {
						this.setErrors(this.currentOrder.orderId, `Проблемы с получением информации об ордере! ${JSON.stringify(this.currentOrder)}`);
						await this.disableProcess(CONSTANTS.PROCESS_STATUS.ERROR, 'Неуспешная покупка монет.');
						await this.updateProcess(user);
						reject('finish');
					}
					} else if((this.checkFailing(currentOrderStatus) && !this.isFreeze())) {
						// disable procces
						await this.disableProcess(CONSTANTS.PROCESS_STATUS.ERROR, 'Неуспешная покупка начального ордера.');
						await this.updateProcess(user);
						resolve('finish');
	
					} else if(tickTime < tenMin) {
						//trade
						await this.updateProcess(user);
						this.sleep(CONSTANTS.ORDER_TIMEOUT, () => {
							tickTime += CONSTANTS.ORDER_TIMEOUT;
							this.trade(user, false, resolve, reject, tickTime);
						});
					} else {
						this.cancelOrder(this.currentOrder, undefined, undefined, async result => {
							await this.updateProcess(user);
							resolve('time_limit');
						});
					}
				});
			}
		} else if(this.isFreeze() && !flag) {
			await this.updateProcess(user);
			this.sleep(CONSTANTS.BOT_SLEEP, () => {
				this.trade(user, false, resolve, reject);
			});
		} else if(!flag) {
			this.currentOrder = this.getSellOrder();
			await this.updateProcess(user);
			this.sleep(CONSTANTS.BOT_SLEEP, () => {
				this.trade(user, true, resolve, reject);
			});
		} else {
			this.setErrors(this.currentOrder, `Проблема с currentOrder ${this.currentOrder}`);
			await this.updateProcess(user);
			resolve('finish');
		}
	}

	sleep(time = 0, callback = () => {}) {
		setTimeout( () => {
			callback();
		}, time);
		return null;
	}

	nextTradeStep(user = this.user) {
		this.sleep(CONSTANTS.TIMEOUT, () => {
			this.trade(user);
		});
	}

	async isOrderFilled(order = {}, user = this.user) {
		return new Promise( async (resolve, reject) => {
			this.purchasedOrders.push(order);
			this.cancelOrder(this.currentOrder, undefined, undefined, async result => {
				console.log('after cancel current order')
				
				if(result.status === 'ok') {
					this.recountInitialOrder(order);
					let orderQtyWithoutFee = Number(order.origQty) * (1 - CONSTANTS.BINANCE_FEE / 100);
					this.recountQuantity(orderQtyWithoutFee);

					let newProfitPrice = this.recountProfitPrice();

					this.newSellOrder(newProfitPrice, CONSTANTS.ORDER_TYPE.LIMIT, this.getQuantity(), async newSellOrder => {
						if(newSellOrder.orderId) {
							console.log('created new sell order')
							this.currentOrder = newSellOrder;
							this.orders.push(this.currentOrder);
							
							await this.updateProcess(user);
							if(!this.isFreeze()) {
								this.botSettings.quantityOfActiveSafeOrders--;
								try {
									let newSafeOrder = await this.createSafeOrder();
			
									if(newSafeOrder.orderId) {
										console.log('create next safe orders')
										this.orders.push(newSafeOrder);
										await this.updateProcess(user);
										resolve([newSafeOrder]);

									} else if(newSafeOrder === 'ok') {
										resolve([]);
									} else {
										await this._log("Невозможно выставить страховочный ордер (недостаточно баланса)");
										resolve([]);
									}
								} catch(error) {
									await this._log("Невозможно выставить страховочный ордер " + JSON.stringify(error));
									MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, error, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'isOrderFilled__'});
									resolve([]);
								}
							}
						} else {
							MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, newSellOrder, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'isOrderFilled__'});
							await this._log(`невозможно выставить sell ордер (${JSON.stringify(newSellOrder)})`);
							await this.disableProcess(CONSTANTS.PROCESS_STATUS.ERROR, "Ошибка при выставлении нового sell ордера после покупки страховочного!");
							await this.updateProcess(user);
							reject({
								status: 'finish',
								err: newSellOrder,
								reason: `невозможно выставить sell ордер`
							});
						}
					});

				} else {
					MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, botID: this.botID, botTitle: this.botTitle, processId: this.processId, result, fnc: 'isOrderFilled_'});
					if(this.isError2011(result)) {
						await this._log(`Ордер ${order.orderId}(${order.price}, ${order.side}) невозможно отменить (статус - ${order.status})`);
					}
					reject({
						status: 'error',
						result
					});
				}
			});

		});
	}

	process(user = this.user) {
		return new Promise( async (resolve, reject) => {
			console.log('process')
			let orders = this.safeOrders || [],
				length = orders.length;
			
			if(length) {
				console.log('we get safeOrders ' + length)
				await this._log(`Проверка состояния страховочных ордеров (${this.getFirstSafeOrder().price}).`);

				let stTime = Date.now();
				this.getOrder_forOrdersArray(orders).then(async updatedOrders => {
					console.log('after update all safe orders')
					
					if(updatedOrders.status === 'ok') {
						updatedOrders = updatedOrders.orders;
						// что делать после обхода всех ордеров
						this.safeOrders = updatedOrders;
						let nextSafeOrders = [],
							updLength = updatedOrders.length,
							resf = '';
						
							console.log('check safe orders')
						for (let i = 0; i < updLength; i++) {
							let order = updatedOrders[i];
		
							if(order.orderId) {
								if(this.checkFilling(order.status)) {
									console.log('safe order is filling')
									try {
										resf = await this.isOrderFilled(order, user);
										if(resf.length >= 0) {
											nextSafeOrders.push(...resf);
											resf = '';
										}
									} catch(error) {
										MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, botID: this.botID, botTitle: this.botTitle, processId: this.processId, error: JSON.stringify(error), fnc: 'process___isOrderFilled'});
										resf = '';
										if(error.status === 'finish') {
											break;
										}
									}
								} else if(this.checkCanceling(order.status)) {
									console.log('safeorder is failing')
									if(!this.isFreeze()) {
										this.botSettings.quantityOfActiveSafeOrders--;
										let newSafeOrder = await this.createSafeOrder();
			
										if(newSafeOrder.orderId) {
											console.log('create next safe order')
											this.orders.push(newSafeOrder);
											nextSafeOrders.push(newSafeOrder);
										} else if(newSafeOrder !== 'ok') {
											await this._log("Невозможно выставить страховочный ордер (недостаточно баланса)");
										}
									}
								} else {
									console.log('nothin with safe order')
									nextSafeOrders.push(order);
								}
							} else {
								MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, botID: this.botID, botTitle: this.botTitle, processId: this.processId, order, fnc: 'process__for_orders_else'});
								await this._log((i + 1) + 'й страховочной ордер - ' + JSON.stringify(order));
							}
						}
						this.safeOrders = nextSafeOrders;
						await this.updateProcess(user);
						resolve(resf);
					} else {
						await this._log(JSON.stringify(updatedOrders));
						await this.updateProcess(user);
						resolve('');
					}
				}).catch(async error => {
					console.log(error)
					//что делать если обход с ошибкой
					MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, botID: this.botID, botTitle: this.botTitle, processId: this.processId, stTime, edTime: Date.now(), workTime: (Date.now() - stTime), fnc: 'process_end'});
					await this._log(JSON.stringify(error));
					await this.updateProcess(user);
					reject('');
				});
				
			} else if(this.isFreeze() && !this.isPreFreeze()) {
				//тип вроде нихуя делать не надо ибо бот заморожен
				await this.updateProcess(user);
				resolve('');
			} else if(!this.isFreeze() && this.isPreFreeze() && this.isNeedToOpenNewSafeOrders()) {
				//тип надо выставить некст сейв ордер, если еще можно
				try {
					let newSafeOrder = await this.createSafeOrder();
					
					if(newSafeOrder.orderId) {
						this.orders.push(newSafeOrder);
						this.safeOrders.push(newSafeOrder);
					} else {
						await this._log("Невозможно выставить страховочный ордер (недостаточно баланса)");
					}
					await this.updateProcess(user);
					resolve('');
				} catch(error) {
					MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, botID: this.botID, botTitle: this.botTitle, processId: this.processId, error: JSON.stringify(error), fnc: 'process__createsafeordererror'});
					await this._log(JSON.stringify(error));
					await this.updateProcess(user);
					reject('');
				}
			} else {
				try {
					const stopPrice = this.getStopPrice();
					await this._log(`Проверка stoploss. (${stopPrice})`);
					if(stopPrice) {
						let price = await this.getLastPrice();
						
						console.log('check stoploss', stopPrice, price)
			
						if(price && stopPrice > price) {
							console.log('stoploss are reached')
							await this._log(`Stoploss пройден.`);
							await this.cancelAllOrders(user, async result => {
								await this.disableProcess(result.res_status, result.message);
								await this.updateProcess(user);
								resolve('');
							});
						} else {
							await this.updateProcess(user);
							resolve('');
						}
					} else {
						await this.updateProcess(user);
						resolve('');
					}

				} catch(error) {
					MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, botID: this.botID, botTitle: this.botTitle, processId: this.processId, error, fnc: 'process__else_'});
					await this._log(JSON.stringify(error));
					await this.updateProcess(user);
					resolve('');
				}
			}
		});
	}

	async checkOrder(user = this.user, orderId = 0, callback = () => {}, time = Date.now(), errorFlag = false) {
		console.log('checkOrder', Date.now() - time, errorFlag)
		const tenMin = 600000,
			timeout = CONSTANTS.ORDER_TIMEOUT;
			
		this.getOrder(orderId, async order => {
			if(order.orderId) {
				const ind = this.orders.findIndex(elem => elem.orderId === order.orderId);
				if(ind === -1) this.orders.push(new Order(order));
				else this.orders[ind] = new Order(order);
	
				await this.updateProcess(user);
	
				if(this.checkFilling(order.status)) { // если оредер заполнен
					callback({
						status: 'ok',
						res: new Order(order)
					});
				} else if(this.checkCanceling(order.status) || this.checkFailing(order.status)) { // если ордер отменили или произошла ошибка
					callback({
						status: 'ok',
						res: {}
					});
				} else if( (Date.now() - time) >= tenMin) { // если время ожидания прошло
					this.cancelOrder(order, undefined, undefined, res => {
						if(res.status === 'error') {
							if(res.error && this.isError2011(res.error) && !errorFlag) {
								setTimeout( () => {
									this.checkOrder(user, orderId, callback, time, true);
								}, timeout);
							} else {
								MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, res, botID: this.botID, botTitle: this.botTitle, processId: this.processId, price, quantity, amount, fnc: 'firstBuyOrder->checkOrder->cancelOrder'});
								callback({
									status: 'error',
									res: 'time_limit'
								})
							}
						} else {
							callback({
								status: 'error',
								res: 'time_limit'
							});
						}
					});
				} else { 
					setTimeout( () => {
						this.checkOrder(user, orderId, callback, time);
					}, timeout);
				}
	
			} else {
				callback({
					status: 'error',
					res: 'error'
				});
			}
		});
			
	}

	async firstBuyOrder(user = this.user) {
		console.log('firstBuyOrder')
		return new Promise( async (resolve, reject) => {
			await this._log('первая закупка монет');
			let price = await this.getLastPrice(),
				quantity = this.setQuantity(price, 0, true);

			this.newBuyOrder(price, CONSTANTS.ORDER_TYPE.LIMIT, quantity, false, async newBuyOrder => {
				if(newBuyOrder === '2010') {
					reject(newBuyOrder);
				} else {
					let orderId = newBuyOrder.orderId;
	
					this.getOrder(orderId, async order => {
						if(order.orderId) {
							this.orders.push(order);
							this.currentOrder = order;
			
							await this.updateProcess(user);
							await this._log('первый закупочный - ' + order.price + ', ' + order.origQty + ', (~total ' + (order.price * order.origQty) + ')...');
							
							this.checkOrder(user, orderId, res => {
								if(res.status === 'ok') {
									resolve(res.res);
								} else if(res.status === 'error') {
									reject(res.res);
								} else {
									reject('error');
								}
							});
						} else {
							this.setErrors(order, `Проблема с currentOrder ${this.currentOrder}`);
							await this._log("проблема с getOrder в закупке первого ордера");
							reject('error');
						}
					});
					
				}
			});
		});
	}

	newBuyOrder(price = 0, type = CONSTANTS.ORDER_TYPE.LIMIT, quantity = this.getQuantity(price), isSafe = false, callback = () => {}, prevError = {}, amount = 0) {
		console.log('newBuyOrder')
		this.newBuyOrder_helper(price, type, quantity, isSafe, prevError, amount)
			.then( result => {
				this.newBuyOrder_handlerCallback(result, callback);
			})
			.catch( error => {
				this.newBuyOrder_handlerCallback(error, callback);
			});
	}

	newBuyOrder_helper(price = 0, type = CONSTANTS.ORDER_TYPE.LIMIT, quantity = this.getQuantity(price), isSafe = false, prevError = {}, amount = 0) {
		return new Promise( async (resolve, reject) => {
			const useServerTime = true, side = CONSTANTS.ORDER_SIDE.BUY;
			quantity = this.toDecimal(quantity);
			let symbol = this.getSymbol(),
				newOrderParams = { symbol, side, quantity, useServerTime };
			if(type === CONSTANTS.ORDER_TYPE.LIMIT) {
				newOrderParams.price = this.toDecimal(price, this.getDecimal(true));
			} else {
				newOrderParams.type = type;
			}
			console.log(newOrderParams)

			this.Client.order(newOrderParams)
				.then( async newBuyOrder => {
					await this._log('создан BUY ордер: ' + newBuyOrder.price + ', ' + newBuyOrder.origQty);
					MDBLogger.info({user: {userId: this.user.userId, name: this.user.name}, botID: this.botID, botTitle: this.botTitle, processId: this.processId, newBuyOrder, fnc: 'newBuyOrder'});
					resolve({
						status: 'ok',
						order: new Order(newBuyOrder)
					});
				})
				.catch( async error => {
					console.log(error);
					MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, error: JSON.stringify(error), prevError, botID: this.botID, botTitle: this.botTitle, processId: this.processId, price, quantity, amount, fnc: 'newBuyOrder'});
					
					if( (quantity >= 0 && amount <= 50) && ( (this.isError1013(error) || this.isError2010(error)) ) ) {
						let step = this.botSettings.decimalQty,
							priceStep = Number(this.botSettings.tickSize);
						if(
							(this.isError1013(error) && this.isError2010(prevError)) ||
							(this.isError1013(prevError) && this.isError2010(error))
						) {
							if(!isSafe) {
								reject({
									status: 'error',
									order: 'disable'
								});
							} else if(this.isError2010(error)) {
								reject({
									status: 'error',
									order: '2010'
								});
							}
						}
						else if(amount >= 10 && this.isError2010(error) && this.isError2010(prevError)) return '2010';
						else if(this.isError1013(error)) {
							price += priceStep;
							quantity += step;
						}
						else if(this.isError2010(error)) quantity -= step;
						
						quantity = this.toDecimal(quantity);
						price = this.toDecimal(price, this.getDecimal(true));
						amount++;
						reject({
							status: 'error',
							order: [{ price, type, quantity, isSafe, error, amount }]
						});
					} else if(quantity > 0 && amount < 50) {
						reject({
							status: 'error',
							order: [{ price, type, quantity, isSafe, error, amount }]
						});
					} else {
						reject({
							status: 'error',
							order: '2010'
						});
					} 
				});
		});
	}

	async newBuyOrder_handlerCallback(result = {}, callback = () => {}) {
		if(result.status === 'error') {
			if(typeof result.order !== 'string') {
				//в ордере массив параметров для нового ордера
				console.log(result);
				let { price, type, quantity, isSafe, error, amount } = result.order[0];
				this.sleep(CONSTANTS.TIMEOUT / 8, () => {
					this.newBuyOrder(price, type, quantity, isSafe, callback, error, amount);
				});
			} else if(result.order === 'disable') {
				// await this.disableProcess(CONSTANTS.PROCESS_STATUS.ERROR, 'Невозможно купить монеты (Недостаточно средств на балансе)');
				callback(result.order);
			} else {
				callback(result.order);
			}
		} else if(result.status === 'ok') {
			callback(result.order);
		} else {
			MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, result, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'newBuyOrder_handlerCallback_else'})
			callback(result);
		}
	}

	newSellOrder(price = 0, type = CONSTANTS.ORDER_TYPE.LIMIT, quantity = this.getQuantity(price), callback = () => {}, prevError = {}, amount = 0) {
		console.log('newSellOrder');
		this.newSellOrder_helper(price, type, quantity, prevError, amount)
			.then( result => {
				this.newSellOrder_handlerCallback(result, callback);
			})
			.catch( error => {
				this.newSellOrder_handlerCallback(error, callback);
			});
	}

	newSellOrder_helper(price = 0, type = CONSTANTS.ORDER_TYPE.LIMIT, quantity = this.getQuantity(price), prevError = {}, amount = 0) {
		return new Promise( async (resolve, reject) => {
			const useServerTime = true, side = CONSTANTS.ORDER_SIDE.SELL;
			// let qtyWithoutFee = this.toDecimal(quantity * (1 - CONSTANTS.BINANCE_FEE / 100)),
			let	symbol = this.getSymbol(),
				newOrderParams = { symbol, side, quantity, useServerTime };

			if(type === CONSTANTS.ORDER_TYPE.LIMIT)	{
				newOrderParams.price = price;
			} else {
				newOrderParams.type = type;
			}

			console.log(newOrderParams);
			this.Client.order(newOrderParams)
				.then( async newSellOrder => {
					this.recountQuantity(newSellOrder.origQty, 1);
					await this._log('создан SELL ордер: ' + newSellOrder.price + ', кол-во: ' + newSellOrder.origQty);
					MDBLogger.info({user: {userId: this.user.userId, name: this.user.name}, price, type, symbol, quantity, botID: this.botID, botTitle: this.botTitle, processId: this.processId, newSellOrder, fnc: 'newSellOrder'});
					resolve({
						status: 'ok',
						order: new Order(newSellOrder)
					});
				})
				.catch( async error => {
					console.log(error)
					MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, price, type, symbol, quantity, error, prevError, botID: this.botID, botTitle: this.botTitle, processId: this.processId, price, quantity, amount, fnc: 'newSellOrder'});
					if( (quantity >= 0 && amount <= 50) && ((this.isError1013(error) || this.isError2010(error))) ) {
						let step = Number(this.botSettings.decimalQty),
							priceStep = Number(this.botSettings.tickSize);
						if(
							(this.isError1013(error) && this.isError2010(prevError)) ||
							(this.isError1013(prevError) && this.isError2010(error))
						) {
							reject({
								status: 'error',
								order: 'disable',
								quantity
							});
						}
						else if(this.isError1013(error)) {
							price += priceStep;
							quantity += step;
						}
						else if(this.isError2010(error)) quantity -= step;
						
						quantity = this.toDecimal(quantity);
						price = this.toDecimal(price, this.getDecimal(true));
						amount++;
						reject({
							status: 'error',
							order: [{ price, type, quantity, error, amount }]
						});
					} else if(quantity > 0 && amount < 50){
						reject({
							status: 'error',
							order: [{ price, type, quantity, error, amount }]
						});
					} else {
						reject({
							status: 'error',
							order: 'disable'
						});
					};
				});
		});
	}

	async newSellOrder_handlerCallback(result = {}, callback = () => {}) {
		if(result.status === 'error') {
			if(typeof result.order !== 'string') {
				//в ордере массив параметров для нового ордера
				let { price, type, quantity, error, amount } = result.order[0];
				this.sleep(CONSTANTS.TIMEOUT/8, () => {
					this.newSellOrder(price, type, quantity, callback, error, amount);
				});
			} else if(result.order === 'disable') {
				// await this.disableProcess(CONSTANTS.PROCESS_STATUS.ERROR, 'Невозможно продать монеты');
				callback(result.order);
			} else {
				callback(result.order);
			}
		} else if(result.status === 'ok') {
			callback(result.order);
		} else {
			MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, result, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'newSellOrder_handlerCallback_else'})
			callback(result);
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
		return new Promise(async (resolve, reject) => {
			try {
				console.log('createSafeOrder', price, quantity)
				let maxOpenSO = this.getMaxOpenedAmount(),
					currentQtyUsedSO = this.getQtyOfUsedSafeOrders(),
					currentQtyActiveSO = this.getQtyOfActiveSafeOrders(),
					maxAmountSO = this.getAmount(),
					deviation = this.getDeviation(),
					lastSafeOrder = this.getLastSafeOrder() || {},
					decimal = this.getDecimal();

				price = Number(price);
				console.log(maxOpenSO, currentQtyUsedSO, currentQtyActiveSO, maxAmountSO, deviation, lastSafeOrder, decimal);
				if(maxOpenSO > currentQtyActiveSO && maxAmountSO > currentQtyUsedSO) {
					this.botSettings.quantityOfUsedSafeOrders ++;
					this.botSettings.quantityOfActiveSafeOrders ++;
					let lastSafeOrderPrice = Number(lastSafeOrder.price) || price,
						newPrice = this.toDecimal(lastSafeOrderPrice - lastSafeOrderPrice * deviation, decimal, true),
						qty = 0;
					
					console.log(lastSafeOrderPrice, newPrice, qty)
					if(quantity) qty = this.toDecimal(quantity * this.getMartingaleValue());
					else if(this.getMartingaleActive()) qty = this.toDecimal(Number(lastSafeOrder.origQty) * this.getMartingaleValue());
					else qty = this.getQuantity(newPrice, 1);
					console.log(qty)
					
					await this._log(`новый страховочный ордер (price - ${newPrice})`);
					this.newBuyOrder(newPrice, CONSTANTS.ORDER_TYPE.LIMIT, qty, true, newOrder => {
						if(newOrder.orderId) this.botSettings.lastSafeOrderPrice = newOrder.price;
						resolve(newOrder);
					});
				} else {
					resolve('ok');
				}
			} catch(err) {
				reject(err);
			}
		});

	}
	
	async _log(message = '') {
		let date = this.getDate(),
			nextMessage = {};
		nextMessage = `${date}|  ${message}`;

		// if(this.log.length && this.log[0].indexOf(message) >= 0) this.log[0] = nextMessage;
		// else this.log.unshift(nextMessage) ;
		await this.updateLog(nextMessage);
	}

	toDecimal(value = 0, decimal = this.getDecimal(false), isMath = false, isCeil = false) {
		if(isMath) {
			const d = Math.pow(10, decimal);
			if(!isCeil) {
				return Math.floor(Number(value) * d) / d;
			}
			return Math.ceil(Number(value) * d) / d;
		} 
		return Number(Number(value).toFixed(decimal));
	}

	recountQuantity(quantity = 0, side = 0) {

		// let curQty = Number(this.currentOrder.origQty);
		// let	additionalQty = Number(quantity * (1 - CONSTANTS.BINANCE_FEE/100));
		// // let	newQty = this.toDecimal((curQty + additionalQty), this.getDecimal(false), true);

		// let newQty = curQty;
		// newQty += Math.pow(-1, side) * additionalQty;
		// newQty = this.toDecimal(newQty, this.getDecimal(false), true);

		// this.botSettings.quantity = newQty;
		// return newQty;


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

	getTP(total = Number()) {
		total = Number(total);
		return Number(this.requiredProffit) / total;
	}

	recountProfitPrice() {
		try {
			let purchasedOrders = this.purchasedOrders || [];
			let allTotal = 0;
			
			purchasedOrders.forEach(order => {
				if(order.side === CONSTANTS.ORDER_SIDE.BUY && order.status === CONSTANTS.ORDER_STATUS.FILLED) {
					allTotal += Number(order.cummulativeQuoteQty);
				}
			});

			allTotal = allTotal * (1 - CONSTANTS.BINANCE_FEE / 100);
			let take_proffit = this.getTP(allTotal);
			let total_proffit = allTotal * (1 + take_proffit + 2 * CONSTANTS.BINANCE_FEE / 100);
			let price_proffit = this.toDecimal(total_proffit / this.botSettings.quantity, this.getDecimal(), true, true);
			
			return price_proffit;

		} catch(error) {

			MDBLogger.error(error, 'RECOUNTPROFFITPRICE');
			let _prevProffitPrice = Number(this.currentOrder.price),
				_nextProffitPrice = Number(this.getProffitPrice(nextOrder.price)),
				_averagePrice = (_prevProffitPrice + (_nextProffitPrice)) / 2,
				_newProffitPrice = Number(_averagePrice);
	
			_newProffitPrice = this.toDecimal(_newProffitPrice, this.getDecimal());
	
			return _newProffitPrice;
		} 


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

	async disableProcess(_status = CONSTANTS.PROCESS_STATUS.NEUTRAL, message = '', cancelOrdersFlag = true) {
		console.log('disableProcess', message)
		console.log(this.currentOrder.orderId);

		if(cancelOrdersFlag) {
			try {
				if(this.symbol) await this.cancelOrders(this.safeOrders);
			} catch(error) {					
				MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, sOrders: this.safeOrders, error, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'disableProcess'});
				await this._log(JSON.stringify(error));
			}
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
		this.orders = await this.updateOrders(this.orders);

		this.status = CONSTANTS.BOT_STATUS.INACTIVE;

		_status && (this.finalProcessStatus = _status);

		this.finallyStatus = CONSTANTS.BOT_STATUS.INACTIVE;

			
		await this._log(`процесс завершен.`);
		console.log(this.currentOrder.orderId)
		return 'disable';
	}

	async cancelAllOrders(user = this.user, callback = () => {}) {
		await this._log('Завершение всех ордеров и продажа по рынку.');
		try{
			if(this.currentOrder.orderId) {
				try {
					if(this.symbol) await this.cancelOrders(this.safeOrders);
				} catch(error) {					
					MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, sOrders: this.safeOrders, error, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'cancelAllOrders'});
					await this._log(JSON.stringify(error));
				}
				this.cancelOrder(this.currentOrder, undefined, undefined, async result => {
					if(result.status === 'ok') {
						let nextAct = async (isError = false) => {
							this.orders = await this.updateOrders(this.orders);
							if(isError) {
								await this.updateProcess(user);
								callback({
									status: 'info',
									message: 'Все ордера отменены, невозможно продать по рынку все купленные монеты',
									res_status: CONSTANTS.PROCESS_STATUS.ERROR
								});
							} else {
								this.getOrder(this.currentOrder.orderId, async cOrd => {
									if(cOrd.orderId) {
										this.currentOrder = cOrd;
									} else {
										this.setErrors(cOrd, `Проблема с currentOrder ${this.currentOrder}`);
									}
									await this.updateProcess(user);
									callback({
										status: 'info',
										message: 'Все ордера отменены и монеты распроданы по рынку',
										res_status: CONSTANTS.PROCESS_STATUS.OK
									});
								});
							}
						}
						
						if(this.isOrderSell(this.currentOrder.side)) {
							let lastPrice = await this.getLastPrice(),
								qty = this.getQuantity();
		
							this.newSellOrder(lastPrice, CONSTANTS.ORDER_TYPE.MARKET, qty, async newOrder => {
								if(newOrder.orderId) {
									this.orders.push(newOrder);
									nextAct(false);
								} else {
									await this._log(`Невозможно выставить sell ордер (${JSON.stringify(newOrder)})`);
									nextAct(true);
								}
							});
						} else {
							nextAct(false);
						}
					} else {
						callback(result);
					}
				});
			} else {
				callback({
					status: 'error',
					message: 'Невозможно продать монеты, так как ордеров нет или первый закупочный ордер еще не завершился.',
					res_status: CONSTANTS.PROCESS_STATUS.ERROR
				});
			}
		} catch(error) {
			await this._log(JSON.stringify(error));
			callback({
				status: 'error',
				message: `Ошибка процессе завершения всех ордеров и продажи по рынку (код ошибки ${this.errorCode(error)}) :: ${error}`,
				res_status: CONSTANTS.PROCESS_STATUS.ERROR
			});
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
				this.cancelOrder(this.currentOrder, undefined, undefined, async result => {
					if(result.status === 'ok') {
						this.orders = await this.updateOrders(this.orders);
						await this.updateProcess(user);
						return {
							status: 'info',
							message: 'Все ордера отменены'
						};
					} else {
						return result;
					}
				});

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

	cancelOrders(orders = [], callback = () => {}) {
		return new Promise( async (resolve, reject) => {
			let l = orders.length;
			if(l) {
				for(let i = 0; i < l; i++) {
					if(i === l - 1) {
						this.cancelOrder(orders[i], resolve, reject, callback);
					} else {
						this.cancelOrder(orders[i], undefined, undefined, callback);
					}
				}
			} else {
				resolve(true);
			}
		});
	}

	async cancelOrder(order_data = {}, resolve = () => {}, reject = () => {}, callback = () => {}) {
		this.cancelOrder_helper(order_data)
			.then( result => {
				this.cancelOrder_handlerCallback(result, order_data, resolve, reject, callback);
			})
			.catch( error => {
				MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, error, order_data, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'cancelOrder'});
				this.cancelOrder_handlerCallback(error, order_data, resolve, reject, callback);
			});
	}

	cancelOrder_handlerCallback(result = {}, order_data = {}, resolve = () => {}, reject = () => {}, callback = () => {}) {
		if(result.status === 'error') {
			if(this.isError2011(result.error)) {
				reject(result.message);
				callback(result);
			} else {
				setTimeout( () => {
					this.cancelOrder(order_data, resolve, reject, callback);
				}, 5000);
			}

		} else if(result.status === 'ok') {
			resolve(result.message);
			callback(result);
		} else {
			MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, result, order_data, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'cancelOrder_handlerCallback_else'})
			reject(result.message);
			callback(result);
		}
	}

	cancelOrder_helper(order_data = {}) {
		return new Promise( async (resolve, reject) => {
			console.log('cancelOrder_helper');
			let orderId = 0;

			if(typeof order_data === 'object') {
				orderId = order_data.orderId;
			} else {
				orderId = Number(order_data);
			}

			this.getOrder(orderId, async order => {
				let symbol = this.getSymbol(),
					side = order.side,
					qty = order.origQty,
					status = '',
					message = '',
					data = {},
					res_status = CONSTANTS.PROCESS_STATUS.NEUTRAL;

				if(order && order.orderId) {

					if(/*order.status === CONSTANTS.ORDER_STATUS.FILLED || */order.status === CONSTANTS.ORDER_STATUS.CANCELED) {
						status = 'ok';
						message = `ордер ${order.orderId} уже завершен`;
						res_status = CONSTANTS.PROCESS_STATUS.OK; 
						data = order;
						resolve({ status, message, res_status, data });
					} else {
						try {
							const useServerTime = true;
							let cancelOrder = await this.Client.cancelOrder({ symbol, orderId, useServerTime });
							if(this.isOrderSell(side)) {
								this.recountQuantity(qty);
							}
							status = 'ok';
							message = `ордер ${cancelOrder.orderId} завершен`;
							res_status = CONSTANTS.PROCESS_STATUS.OK;
							data = cancelOrder;

							await this._log('закрытие ордера - ' + message);

							resolve({ status, message, res_status, data });

						} catch(error) {
							MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, order: {orderId, symbol}, error, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'cancelOrder'});
							status = 'error';
							message = `ошибка при завершении ордера ${orderId}`;
							res_status = CONSTANTS.PROCESS_STATUS.ERROR;
							reject({ status, message, res_status, error, order });
						}
						
						// await this._log('закрытие ордера - ' + message);
						// callback({ status, message, error: _error, res_status,
						// 	data: { order: cancelOrder }
						// });
					}

				} else {
					status = 'error';
					message = `Проблема с закрытием ордера ${orderId}`;
					res_status = CONSTANTS.PROCESS_STATUS.ERROR;
					data = order;
					// if(reject) reject(message);
					// this.setErrors(order, message);
					// callback({ status, res_status, message, data });
					reject({ status, res_status, message, data, order });
				}

			});
		});
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
			try {
				this.Client = binanceAPI({
					apiKey: key,
					apiSecret: secret
				});
				
				let checkClient = await this.Client.accountInfo();
				if(!checkClient.balances) {
					if(flag) await this._log('ошибка с определением бинанс ключей!');
					ret = false;
				}
			} catch(er) {
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
		if(isFirst) {
			let qty = this.toDecimal(Number(this.botSettings.currentOrder)/ price);
			let nextQty = 0, check = false, i = 0, marketPrice = 0;
			do { 
				// if purchased qty will be sell by market without activate sefe order
				// we need add min deviation to first qty  
				i++;
				nextQty = qty + qty * i * CONSTANTS.BINANCE_FEE / 100;
				marketPrice = price * nextQty * (1 - Number(this.botSettings.deviation) / 100); 
				check = this.botSettings.minNotional > marketPrice;
			} while(check);

			this.botSettings.quantity = nextQty;
		} else {
			this.botSettings.quantity = price ? this.toDecimal(Number(this.botSettings.currentOrder)/ price) : this.toDecimal(Number(quantity), this.getDecimal(false), true, true);
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
			decimal = this.getDecimal(),
			stopPrice = stopLoss ? price * ( 1 - stopLoss) : 0;
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

	getFirstSafeOrder() {
		let orders = this.safeOrders,
			firstOrder = orders[0],
			length = orders.length;

		for (let i = 1; i < length; ++i) 
			if (orders[i].price > firstOrder.price) firstOrder = orders[i];

		return firstOrder;
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

	getProffitPrice_forRecountSafeOrders(price = 0) {
		let takeProfit = this.getTakeProfit_forRecountSafeOrders(),
			decimal = this.getDecimal();
		
		price = Number(price);

		let	profitPrice = price * (1 + takeProfit);
		return this.toDecimal(profitPrice, decimal);
	}

	getProffitPrice(price = 0, flag = true) {
		// купил за 0.0190 901 штуку
		// после коммисии у меня 900 штук
		// нужно продать 900 штук так, чтобы выйти в плюс на 1% (0.01)
		// было 0.0190 * 901 = 17.119
		// нужно  х   * 900 = 17.290
		// то есть 17.290 / 900 = 0.0192
		// то есть мне нужно умножить цену покупки на тейк профит
		// и я получу цену на продажу, чтобы я ушел в плюс
		// так же нужно учесть коммисию 0.1% (0.001)



		// price = Number(price);
		let takeProfit = this.getTakeProfit(),
			decimal = this.getDecimal(flag);
		
		price = Number(price);

		let	profitPrice = price * (1 + takeProfit);
		return this.toDecimal(profitPrice, decimal);
	}

	getTakeProfit() {
		return (Number(this.botSettings.takeProfit) +  2 * CONSTANTS.BINANCE_FEE) / 100;
	}

	getTakeProfit_forRecountSafeOrders() {
		return (Number(this.botSettings.takeProfit) + 3 * CONSTANTS.BINANCE_FEE) / 100;
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

	async getOrder(orderId = 0, callback = () => {}) {
		this.getOrder_helper(orderId)
			.then( result => {
				this.getOrder_handlerCallback(result, orderId, callback);
			})
			.catch( error => {
				MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, error, orderId, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'getOrder'})
				this.getOrder_handlerCallback(error, orderId, callback);
			});
	}

	getOrder_handlerCallback(result = {}, orderId = Number(), callback = () => {}) {
		if(result.status === 'error') {
			setTimeout( () => {
				this.getOrder(orderId, callback);
			}, 5000);
			return;
		} else if(result.status === 'ok') {
			callback(result.order);
		} else {
			MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, result, orderId, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'getOrder_handlerCallback_else'})
			callback(result);
		}
	}

	async getOrder_forOrdersArray(orders = [], handler, isUpdateCheckFlag = false) {
		console.log('getOrder_forOrdersArray')
		return new Promise((resolve, reject) => {
			let qtyPassedElements = 0, elementsQty = orders.length,
				sendOrdersArray = [],
				l = orders.length;
			
			if(l) {
				try {
					if(isUpdateCheckFlag) {
						for (let i = 0; i < l; i++) {
							let order = orders[i];
							if(!order.isUpdate) {
								this.getOrder(order.orderId, async updatedOrder => {
									qtyPassedElements++;
									if(handler) {
										let orderAfterHandling = await handler(updatedOrder);
										sendOrdersArray.push(...orderAfterHandling);
									} else {	
										sendOrdersArray.push(updatedOrder);
									}
									if(qtyPassedElements === elementsQty) {
										resolve({
											status: 'ok',
											orders: sendOrdersArray
										});
									} else if(qtyPassedElements > elementsQty) {
										reject({
											status: 'error',
											message: 'trabls with "getOrder_forOrdersArray"'
										});
									}
								});
							} else {
								qtyPassedElements++;
								sendOrdersArray.push(order);
								if(qtyPassedElements === elementsQty) {
									resolve({
										status: 'ok',
										orders: sendOrdersArray
									});
								} else if(qtyPassedElements > elementsQty) {
									reject({
										status: 'error',
										message: 'trabls with "getOrder_forOrdersArray"'
									});
								}
							}
						}
					} else {
						for (let i = 0; i < l; i++) {
							let order = orders[i];
							this.getOrder(order.orderId, async updatedOrder => {
								qtyPassedElements++;
								if(handler) {
									let orderAfterHandling = await handler(updatedOrder);
									sendOrdersArray.push(...orderAfterHandling);
								} else {	
									sendOrdersArray.push(updatedOrder);
								}
								if(qtyPassedElements === elementsQty) {
									resolve({
										status: 'ok',
										orders: sendOrdersArray
									});
								} else if(qtyPassedElements > elementsQty) {
									reject({
										status: 'error',
										message: 'trabls with "getOrder_forOrdersArray"'
									});
								}
							});
						}
					}
				} catch(error) {
					MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, botID: this.botID, botTitle: this.botTitle, processId: this.processId, error: error, fnc: 'getOrder_forOrdersArray'});
					reject({
						status: 'error',
						error,
						message: 'trabls with "getOrder_forOrdersArray"'
					});
				}
			} else {
				resolve({
					status: 'ok',
					orders: sendOrdersArray
				});
			}
		});
	}

	async getOrder_helper(orderId = 0) {
		return new Promise( async (resolve, reject) => {
			orderId = Number(orderId);

			let order = {};
			if(orderId) {
				let symbol = this.getSymbol();
				this.Client.getOrder({
					symbol,
					orderId,
					useServerTime: true
				}).then( result => {
					resolve({
						order: new Order(result),
						status: 'ok'
					});
				}).catch( async error => {
					// await this._log( 'произошла ошибка при getOrder (errCode: ' + this.errorCode(error) + ')' + JSON.stringify(error) );
					MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, error, order: {symbol, orderId}, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'getOrder'})
					if(this.isError2013(error)) {
						resolve({
							status: 'ok',
							order: new Order(order)
						});
					} else {
						reject({
							error,
							status: 'error'
						});
					}
				});
			} else {
				resolve({
					order: new Order(order),
					status: 'ok'
				});
			}
		});
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

	getDecimal(isTickSize = true) {
		let value = isTickSize ? Number(this.botSettings.tickSize) : this.botSettings.decimalQty;
		return this.countDecimalNumber(value);
	}

	async getLastPrice() {
		let pair = this.getSymbol();
		try {
			let price = await this.Client.prices();
			return Number(price[pair]);
		} catch(error) {
			MDBLogger.error({user: {userId: this.user.userId, name: this.user.name}, orderId, botID: this.botID, botTitle: this.botTitle, processId: this.processId, fnc: 'getLastPrices'})
			return 0;
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
		return new Promise( (resolve, reject) => {
			this.getOrder_forOrdersArray(orders, async order => {
				console.log('hend;e')
				let resArr = [];
				if(order.orderId) {
					if(this.checkFailing(order.status) || this.checkFilling(order.status)) order.isUpdate = true;
					resArr.push(order);
				}
				return resArr;
			}, true).then(updatedOrders => {
				if(updatedOrders.status === 'ok') {
					resolve(updatedOrders.orders);
				} else {
					reject(updatedOrders);
				}
			}).catch( error => {
				reject(error);
			})
		});
	}
	//:: UPDATE FUNC END

	//************************************************************************************************//

	//:: ERRORS TYPES
	errorCode(error = new Error('default err')) {
		return JSON.parse(JSON.stringify(error)).code;
	}

	//Timestamp for this request is outside of the recvWindow
	isError1021(error = new Error('default err')) {  	
		let code = this.errorCode(error);
		return code === -1021;
	}

	//TOO_MANY_REQUESTS
	isError1003(error = new Error('default err')) {  	
		let code = this.errorCode(error);
		return code === -1003;
	}

	//MIN_NOTATIAN
	isError1013(error = new Error('default err')) { 
		let code = this.errorCode(error);
		return code === -1013;
	}

	//Order does not exist
	isError2013(error = new Error('default err')) {
		let code = this.errorCode(error);
		return code === -2013;
	}

	//cancel rejected
	isError2011(error = new Error('default err')) {
		let code = this.errorCode(error);
		return code === -2011;
	}

	//insufficient balance
	isError2010(error = new Error('default err')) { 
		let code = this.errorCode(error);
		return code === -2010;
	}

	// Неверные бинанс ключи
	isError2014(error = new Error('default err')) {
		let code = this.errorCode(error);
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

		return (maxOpenSO > currentQtyActiveSO && maxAmountSO > currentQtyUsedSO && !this.unsoldOrdersFlag);
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