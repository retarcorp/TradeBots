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
const uniqid = require('uniqid');

const Process = require('./Process');
const CONSTANTS = require('../constants');
const BT = CONSTANTS.BT;

var log = (...par) => {
	console.log();
	console.log(...par);
}

module.exports = class Bot {
	constructor({
		title = 'Untitled bot',
		state = CONSTANTS.BOT_STATE.MANUAL,
		status = CONSTANTS.BOT_STATUS.INACTIVE,
		freeze = CONSTANTS.BOT_FREEZE_STATUS.INACTIVE,
		preFreeze = freeze,
		botID = uniqid(BT),
		pair = {},
		botSettings = {},
		processes = {},
		weight = 0,
		isDeleted = false
	} = {}, user = {}) {
		this.title = title;
		this.state = state;
		this.status = status;
		this.freeze = freeze;
		this.preFreeze = preFreeze;
		this.pair = new Pair(pair.from, pair.to, pair.requested);
		this.botSettings = new BotSettings(botSettings);
		this.botID = botID;
		this.processes = processes;
		this.user = user;
		if(weight) {
			this.weight = weight;
		} else if(this.isManual()) {
			this.weight = 1;
		} else if(this.isAuto()) {
			this.weight = this.pair.requested.length;
		}
		this.isDeleted = isDeleted;
		this.ALL = 'all';
	}

	continueTrade(user = this.user) {
		user = { name: user.name, userId: user.userId, binanceAPI: user.binanceAPI, regDate: user.regDate };
		
		this.user = user;
		
		// this.updateUserOrdersList(user);
		if(this.isManual()) {
			log('continueTrade in manual')

			for (let processId in this.processes) {
				if(this.processes[processId] && this.processes[processId].runningProcess) {
					this.processes[processId] = new Process(this.processes[processId]);
					this.processes[processId].continueTrade(user)
						.then( result => {
							console.log(result)
							if(this.status === CONSTANTS.BOT_STATUS.ACTIVE) {
								// this.updateBot(user);
								this.startManual(user);
							}
						})
						.catch( async err => {
							console.log(err);
							this.disableBot(user);
							await this.updateBot(user);
						});	
				}
			}
		} else if(this.isAuto()) {
			let isRunningProcessesExist = this.runningProcessExist();
			
			if(isRunningProcessesExist) {
				for (let processId in this.processes) {
					if(this.processes[processId] && this.processes[processId].runningProcess) {
						this.processes[processId] = new Process(this.processes[processId]);
						this.processes[processId].continueTrade(user)
							.then( result => {
								this.processes[processId].setRunnigProcess();
							})
							.catch( async err => {
								console.log(err);
								this.disableBot(user);
								await this.updateBot(user);
							});
					}
				}
			}
			this.startAuto(user, CONSTANTS.CONTINUE_FLAG);
		}
	}

	async changeStatus(nextStatus, user = this.user) {
		user = { name: user.name, userId: user.userId, binanceAPI: user.binanceAPI, regDate: user.regDate };
		this.user = user;

		let message = '',
			status = '';
		
		if(this.checkForActivate(nextStatus)) {
			this.status = nextStatus;
			
			if(this.isManual()) {
				this.botSettings.decimalQty = await Symbols.getLotSize(this.getPair());
				status = 'ok';
				message = 'Бот запущен (РУЧНОЙ)';
				await this.updateBot(user);
				this.startManual(user);
			}
			else if(this.isAuto()) {
				status = 'ok';
				message = 'Бот запущен (АВТО)';
				await this.updateBot(user);
				this.startAuto(user);
			}
			else {
				status = 'error';	
				message = "Ошибка (НЕИЗВЕСТНЫЙ ТИП БОТА)";
				this.status = CONSTANTS.BOT_STATUS.INACTIVE;
			}
		} else if(this.checkForDeactivate(nextStatus)) {
			this.status = nextStatus;
			for (let processId in this.processes) {
				if(this.processes[processId].deactivateProcess) {
					this.processes[processId].deactivateProcess();
				} else {
					this.processes[processId] = new Process(this.processes[processId]);
					this.processes[processId].deactivateProcess();
				}
			}
			status = 'info';
			message = "Бот перестанет работать после завершения всех рабочих циклов.";
			await this.updateBot(user); 
		} else if(nextStatus === CONSTANTS.BOT_STATUS.ACTIVE || nextStatus === CONSTANTS.BOT_STATUS.INACTIVE){
			this.status = nextStatus;
			for (let processId in this.processes) {
				this.processes[processId].setStatus(nextStatus);
			}
			status = 'ok';
			if(this.isAuto()) {
				this.startAuto(user);
			}
			// message = "Возможно вы пытаетесь включить бота, который не завершил свой последний цикл.";
			await this.updateBot(user);
		} else {
			status = 'error';
			message = `Неверный статус(${nextStatus}).`;
			await this.updateBot(user);
		}
		// this.updateUserOrdersList(user);

		return {
			status: status,
			data: { status: this.status },
			message: message
		};
	}

	async changeFreeze(nextFreeze, user) {
		const active = CONSTANTS.BOT_FREEZE_STATUS.ACTIVE,
			inactive = CONSTANTS.BOT_FREEZE_STATUS.INACTIVE
		let res = {
			status: 'error',
			message: 'Получены неверные данные.'
		}
		if(nextFreeze === inactive) {
			this.preFreeze = this.freeze
			this.freeze = inactive

			res = {
				status: 'info',
				data: { freeze: this.freeze },
				message: 'Процессы будут разморожены.'
			}
		}
		else if(nextFreeze === active) {
			this.preFreeze = this.freeze
			this.freeze = active
			res = {
				status: 'info',
				data: { freeze: this.freeze },
				message: 'Процессы будут заморожены.'
			}
		}
		for (let processId in this.processes) {
			this.processes[processId].changeFreeze(this.freeze, this.preFreeze);
		}
		await this.updateBot(user);
		return res;
	}

	//:: START FUNC
	async startManual(user = this.user) {
		log('startManual');
		let resObj = {
			symbol: this.getPair(),
			botSettings: this.botSettings,
			botID: this.botID,
			user: user,
			state: this.state,
			status: this.status,
			botTitle: this.title
		},
			newProcess = new Process(resObj);
			
		for (let processId in this.processes) {
			if(this.processes[processId].setRunnigProcess && this.processes[processId].runningProcess) {
				this.processes[processId].setRunnigProcess();
			}
		}

		this.processes[newProcess.processId] = newProcess;

		await this.updateBot(user);

		this.processes[newProcess.processId]
			.startTrade(user)
			.then( result => {
				console.log(result)
				if(this.status === CONSTANTS.BOT_STATUS.ACTIVE && result === 'finish') {
					this.startManual(user);
				}
			})
			.catch( async err => {
				console.log(err)
				this.disableBot(user);
				await this.updateBot(user);
			});
	}

	async startAuto(user = this.user, continueFlag = false) {
		if(!continueFlag) await this.pushTradingSignals();

		log('sreach signals')
		let signals = await Mongo.syncSelect({}, CONSTANTS.TRADING_SIGNALS_COLLECTION);

		let signal = await this.checkSignals(user, signals);
		console.log(signal)
		console.log(this.botSettings.amountPairsUsed, this.botSettings.maxAmountPairsUsed)
		if(signal.flag && ( this.status === CONSTANTS.BOT_STATUS.ACTIVE/* || this.workProcessesExist()*/ ) && (this.botSettings.amountPairsUsed < Number(this.botSettings.maxAmountPairsUsed))) {
			signal = signal.signal;
			if(signal) {
				log('find signal complite')
			
				this.pair.from = this.findFromSymbol(signal.symbol);
	
				if(this.pair.from) {
					this.botSettings.decimalQty = await Symbols.getLotSize(this.getPair());
					let resObj = {
							symbol: signal.symbol,//this.getPair(),
							botSettings: this.botSettings,
							botID: this.botID,
							user: user,
							state: this.state,
							status: this.status,
							botTitle: this.title
						},
						newProcess = new Process(resObj);
					
					this.processes[newProcess.processId] = newProcess;
					await this.updateBot(user);
					this.botSettings.amountPairsUsed++;
						
					this.processes[newProcess.processId]
						.startTrade(user)
						.then( result => {
							this.processes[newProcess.processId].setRunnigProcess();
							this.botSettings.amountPairsUsed--;
						})
						.catch( async err => {
							console.log(err);
							this.disableBot(user);
							await this.updateBot(user);
						});
	
					this.pair.from = '';
				}
			} 
			setTimeout( () => {
				this.startAuto(user, CONSTANTS.CONTINUE_FLAG);
			}, CONSTANTS.SLEEP);

		} else if(this.status === CONSTANTS.BOT_STATUS.ACTIVE || this.workProcessesExist()) {
			console.log('НУКА')
			setTimeout( () => {
				this.startAuto(user, CONSTANTS.CONTINUE_FLAG);
			}, CONSTANTS.SLEEP);
		} else {
			await this.clearTradingSignals();
			this.disableBot(user);
			await this.updateBot(user);
		}
	}
	//:: START FUNC END

	//************************************************************************************************//
	
	//:: SET FUNC
	setClient(user) {
		let key = '',
			secret = '',
			ret = true;

		if(user.binanceAPI.name !== '') {
			try {
				key = Crypto.decipher(user.binanceAPI.key,  Crypto.getKey(user.regDate, user.name));
				secret = Crypto.decipher(user.binanceAPI.secret,  Crypto.getKey(user.regDate, user.name));
			}
			catch(err) {
				key = '';
				secret = '';
				ret = false;
			}
			this.Client = binanceAPI({
				apiKey: key,
				apiSecret: secret
			});
		}
		else {
			ret = false;
		}
		return ret;
	}
	//:: SET FUNC END
	
	//************************************************************************************************//
	
	//:: GET FUNC 
	getPair(from = this.pair.from) {
		return from + this.pair.to
	}

	findFromSymbol(symbol = '') {
		let ret = '';
		this.pair.requested.forEach(elem => {
			if(symbol.indexOf(elem) >= 0) ret = elem;
		});
		return ret;
	}

	getAllOrders() {
		let allOrders = [];
		for (let processId in this.processes) {
			this.processes[processId].orders.forEach(order => allOrders.push(order));
		}
		return allOrders;
	}
	//:: GET FUNC END
	
	//************************************************************************************************//
	
	//:: CHECK FUNC
	isManual() {
		return this.state === CONSTANTS.BOT_STATE.MANUAL;
	}

	isAuto() {
		return this.state === CONSTANTS.BOT_STATE.AUTO;
	}

	workProcessesExist() {
		let res = false;
		for (let processId in this.processes) {
			if(this.processes[processId].status === CONSTANTS.BOT_STATUS.ACTIVE) {
				res = true;
				break;
			}
		}
		return res;
	}

	runningProcessExist() {
		let res = false;
		for (let processId in this.processes) {
			if(this.processes[processId].runningProcess) {
				res = true;
				break;
			}
		}
		return res;
	}

	checkForActivate(nextStatus) {
		let bot_status = CONSTANTS.BOT_STATUS,
			processesStatus = false;

		for (let processId in this.processes) {
			let proc = this.processes[processId];
			if(proc.status === bot_status.ACTIVE || (proc.runningProcess && proc.currentOrder.orderId)) {
				processesStatus = true;
				break;
			}
		}
		
		return (this.status === bot_status.INACTIVE && nextStatus === bot_status.ACTIVE && !processesStatus);
	}
	
	checkForDeactivate(nextStatus) {
		let bot_status = CONSTANTS.BOT_STATUS;
		return (this.status === bot_status.ACTIVE && nextStatus === bot_status.INACTIVE);
	}

	isUnusedSignal(signal) {
		let ret = true;

		for (let processId in this.processes) {
			console.log(this.processes[processId].status)
			if(this.processes[processId].symbol === signal.symbol && this.processes[processId].status === CONSTANTS.BOT_STATUS.ACTIVE) {
				ret = false;
				break;
			}
		}
		
		return ret;
	}

	isUnusedSymbol(symbol) {
		let ret = true;

		for (let processId in this.processes) {
			console.log(this.processes[processId].status)
			if(this.processes[processId].symbol === symbol && this.processes[processId].status === CONSTANTS.BOT_STATUS.ACTIVE) {
				ret = false;
				break;
			}
		}
		
		return ret;
	}

	isEqualSignals(signal) {
		return signal.checkRating === signal.rating || (signal.checkRating === CONSTANTS.TRANSACTION_TERMS.BUY && signal.rating === CONSTANTS.TRANSACTION_TERMS.STRONG_BUY);
	}

	isCurrentSignal(signal) {
		let ret = false,
			ind = this.botSettings.curTradingSignals.findIndex(elem => elem.id === signal.id);

		if(ind !== -1) {
			this.botSettings.curTradingSignals[ind].rating = signal.rating;
			ret = true;
		}
		return ret;
	}

	async checkSignals(user = this.user, signals = []) {
		console.log('checkSignals')
		let ret = {
				flag: false,
				signal: {}
			};
		signals.forEach(signal => {
			this.isCurrentSignal(signal);
		});
		
		await this.updateSignals(user);
		
		let monitorStatus = {};

		for(let i = 0; i < this.botSettings.curTradingSignals.length; i++) {
			let signal = this.botSettings.curTradingSignals[i];

			(monitorStatus[signal.symbol] === undefined) && (monitorStatus[signal.symbol] = true);
			if( !(this.isEqualSignals(signal) && this.isUnusedSignal(signal)) ) {
				monitorStatus[signal.symbol] = false;
				// ret = {
				// 	flag: true,
				// 	signal: signal
				// };
				// break;
			}
		}
		for (let symbol in monitorStatus) {
			if(monitorStatus[symbol]) {
				ret = {
					flag: true,
					signal: { symbol: symbol}
				};
				break;
			}
		}

		return ret;
	}
	//:: CHECK FUNC END

	//************************************************************************************************//
	
	//:: UPDATE FUNC
	async updateSignals(user = this.user) {
		user = { name: user.name };

		let data = await Mongo.syncSelect(user, CONSTANTS.USERS_COLLECTION);
		data = data[0];

		const index = data.bots.findIndex(bot => bot.botID === this.botID);
		
		const change = `bots.${index}.botSettings.curTradingSignals`,
			changeObj = {};
		
		changeObj[change] = this.botSettings.curTradingSignals;
		await Mongo.syncUpdate(user, changeObj, CONSTANTS.USERS_COLLECTION);
	}
	
	async updateLocalBot(next = this, callback = (data = {}) => {}) {
		try {
			this.title = next.title;
			this.pair = next.pair;
			this.weight = next.weight;
			this.botSettings.initialOrder = next.botSettings.initialOrder;
			this.botSettings.currentOrder = this.botSettings.initialOrder;
			this.botSettings.safeOrder = next.botSettings.safeOrder;
			this.botSettings.stopLoss = next.botSettings.stopLoss;
			this.botSettings.takeProfit = next.botSettings.takeProfit;
			this.botSettings.tradingSignals = next.botSettings.tradingSignals;
			this.botSettings.maxOpenSafetyOrders = next.botSettings.maxOpenSafetyOrders;
			this.botSettings.deviation = next.botSettings.deviation;
			this.botSettings.martingale = next.botSettings.martingale;
			this.botSettings.maxAmountPairsUsed = next.botSettings.maxAmountPairsUsed;
	
			for (let processId in this.processes) {
				if(this.processes[processId].updateProcess) {
					this.processes[processId].updateLocalProcess(this, this.getPair());
				}
			}

			if(this.isAuto() && this.status === CONSTANTS.BOT_STATUS.ACTIVE) {
				await this.clearTradingSignals();
				await this.pushTradingSignals();
			}
	
			callback({
				status: 'ok',
				message: `Бот ${this.botID} успешно обновлен. Обновления вступят в силу после завершения цикла всех процессов.`,
				data: this
			});
		} catch(err) {
			callback({
				status: 'error',
				message: `Ошибка при обновлении бота ${this.botID}.`,
				data: {
					bot: this,
					error: err
				}
			});
		}
	}

	async updateBot(user = this.user, message = '') {
		log('updateBot');
		user = { name: user.name };
		// await this.updateUserOrdersList(user);
		let data = await Mongo.syncSelect(user, CONSTANTS.USERS_COLLECTION);
		data = data[0];
		let tempBot = new Bot(Object.assign({}, this));
		const index = data.bots.findIndex(bot => bot.botID === tempBot.botID);
		
		const change = `bots.${index}`,
			changeObj = {};
		
		changeObj[change] = tempBot;

		await Mongo.syncUpdate(user, changeObj, CONSTANTS.USERS_COLLECTION);
	}

	JSONclone(object) {
		return JSON.parse(JSON.stringify(object));
	}

	async updateUserOrdersList(user = this.user) {
		user = { name: user.name };
		let data = await Mongo.syncSelect(user, CONSTANTS.USERS_COLLECTION);
		if(data.length) {
			data = data[0];
			let ordersList = data.ordersList;

			!ordersList && (ordersList = {});

			let _id = `${this.botID}`;

			!ordersList[_id] && (ordersList[_id] = []);

			ordersList[_id] = this.getAllOrders();

			await Mongo.syncUpdate(user, {ordersList:  ordersList}, CONSTANTS.USERS_COLLECTION);
		}
		
		// не вызывать когда бот выключен или удален
		if(this.workProcessesExist()) {
			setTimeout(() => { this.updateUserOrdersList(user) }, CONSTANTS.UPDATE_ORDERS_LIST_SLEEP);
		}
	}
	//:: UPDATE FUNC END
	
	//************************************************************************************************//

	async pushTradingSignals() {
		let signals = this.botSettings.tradingSignals,
			l = signals.length,
			pairs = this.pair.requested,
			pairsL = pairs.length,
			newTrSs = [];
		
		for(let j = 0; j < pairsL; j++) {
			let pair = pairs[j];
			for(let i = 0; i < l; i++) {
				signals[i].symbol = this.getPair(pair);
				// let id = md5(Math.random()*(new Date).getMilliseconds()*2/1213545/Math.random() + signals[i].symbol + (i*j*Math.pow(i, j*Math.random())))
				let id = uniqid();
				let signal = new TradingSignals(signals[i], id);
				newTrSs.push(signal);
				await Mongo.syncInsert(signal, CONSTANTS.TRADING_SIGNALS_COLLECTION);
			}
		}

		this.botSettings.curTradingSignals = newTrSs;
	}

	async clearTradingSignals() {
		let signals = this.botSettings.curTradingSignals,
			l = signals.length;

		for(let i = 0; i < l; i++) {
			let signal = signals[i]	;
			await Mongo.syncDelete({ id: signal.id }, CONSTANTS.TRADING_SIGNALS_COLLECTION);
		}
		this.botSettings.curTradingSignals = [];
		this.pair.from = '';
	}

	disableBot(user = this.user) {
		for (let processId in this.processes) {
			if(this.processes[processId].deactivateProcess) {
				this.processes[processId].deactivateProcess();
			} else {
				this.processes[processId] = new Process(this.processes[processId]);
				this.processes[processId].deactivateProcess();
			}
		}
		this.status = CONSTANTS.BOT_STATUS.INACTIVE;
	}

	cancelAllOrdersWithoutSell(user = this.user, processId = 0) {
		return new Promise( async (resolve, reject) => {
			try {
				if(processId && this.processes[processId]) {

					let res = await this.processes[processId].cancelAllOrdersWithoutSell(user);
					resolve(res);

				} else {
					reject({
						status: 'error',
						message: 'Неверный идентификатор'
					});
				}
			} catch (error) {
				reject({
					status: 'error',
					message: `eeeror ${err}`
				});
			}
		});
	}

	cancelAllOrders(user = this.user, processId = 0) {
		return new Promise( async (resolve, reject) => {
			try {
				if(processId === this.ALL) {	
					for (let processId in this.processes) {
						if(this.processes[processId].runningProcess) {
							await this.processes[processId].cancelAllOrders(user);
							await this.processes[processId].disableProcess('Удаление бота.');
						}
					}
					resolve({
						status: 'ok',
						message: 'Все процессы завершены'
					});
				} else {
					if(processId && this.processes[processId]) {
						let res = await this.processes[processId].cancelAllOrders(user);
						if(res.status !== 'error') {
							await this.processes[processId].disableProcess('Нажали на "отменить и продать".', CONSTANTS.CONTINUE_FLAG);
						}
						resolve(res);
					} else {
						reject({
							status: 'error',
							message: 'Неверный идентификатор'
						});
					}
				}
			}
			catch(err) {
				reject({
					status: 'error',
					message: `eeeror ${err}`
				});
			}
		});
	}

	async cancelOrder(orderId = 0, processId = '') {
		orderId = Number(orderId);
		if(orderId && processId && this.processes[processId]) {
			let res = await this.processes[processId].cancelOrder(orderId);
			return res;
		} else {
			return {
				status: 'error',
				message: 'Неверно отправленны данные ордера и процесса.',
				data: { orderId: orderId,
						processId: processId
					}
			}
		}
	}

	async deleteBot(user = this.user) {
		return new Promise( async (resolve, reject) => {
			try {
				this.disableBot(user);
				await this.cancelAllOrders(user, this.ALL);
				this.isDeleted = true;
				await this.updateBot(user);
				resolve({ 
					status: 'ok', 
					data: {
						deletedBot: this
					}
				});
			}
			catch(err) {
				reject({ 
					status: 'error',
					message: err 
				});
			}
		});
	}
}
