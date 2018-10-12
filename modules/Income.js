const Mongo = require('./Mongo');
const CONSTANTS = require('../constants');

const usersDataCollection = CONSTANTS.USERS_DATA_COLLECTION;
const btc = 'BTC', eth = 'ETH', bnb = 'BNB', usdt = 'USDT';

class Income {
	constructor() {
		this.FailureMessage = {
			status: 'error',
			message: 'Ошибка на сервере, вероятно отосланы неверные данные!'
		}

		this.SuccessfullyMessage = {
			status: 'ok',
			message: 'Выполнено успешно!'
		}
	}

	getSuccessfullyMessage(data = {}) {
		return Object.assign({}, this.SuccessfullyMessage, data);
	}

	getFailureMessage(data = {}) {
		return Object.assign({}, this.FailureMessage, data);
	}

	async liveUpdateIncome() {
		console.time('liveUpdateIncome');
		// получить список всех user.bots.botID.processes._id.orders.dealId.order
		let users = await Mongo.syncSelect({}, usersDataCollection),
			length = users.length;

		for (let i = 0, user = users[i]; i < length; i++) {
			let bots = user.bots;
			for (let botID in bots) {
				let processes = bots[botID].processes;

				for (let prcId in processes) {
					let orders = processes[prcId].orders,
						incomes = {};

					for (let dlId in orders) {
						let deal = orders[dlId];
						
						incomes[dlId] = this.setDealIncome(deal);

					}

					let change = this.getChangeObjectToProcess(botID, prcId, 'incomes', incomes);
	
					Mongo.update({ name: user.name }, change, usersDataCollection, data => {});
				}
			}
		}

		setTimeout(() => this.liveUpdateIncome(), CONSTANTS.UPDATE_ORDERS_LIST_SLEEP);

		console.timeEnd('liveUpdateIncome');
	}

	setDealIncome(deal = []) {
		if(deal.length) {
			const order_status = CONSTANTS.ORDER_STATUS;
			const _sell = CONSTANTS.ORDER_SIDE.SELL, 
				_buy = CONSTANTS.ORDER_SIDE.BUY,
				_new = order_status.NEW, 
				_canceled = order_status.CANCELED,
				_filled = order_status.FILLED; 

			let income = {},
				value = 0;

			let curSbl = this.getCurrentSymbol(deal[0].symbol);
	
			deal.forEach(order => {
				if(order.side === _sell && order.status === _filled) {
					value += Number(order.cummulativeQuoteQty);
				} else if(order.side === _buy && order.status === _filled) {
					value -= Number(order.cummulativeQuoteQty);
				}
	
			});
			income[curSbl] = value;
			return income;

		} else return {};
	}

	getCurrentSymbol(symbol = '') {
		if(symbol.indexOf(btc) > 0) return btc;
		if(symbol.indexOf(eth) > 0) return eth;
		if(symbol.indexOf(bnb) > 0) return bnb;
		if(symbol.indexOf(usdt) > 0) return usdt;
	}
	
	getChangeKeyToProcess(botID = '', prcId = '', field = '') {
		// userName.bots.botid.processes.prcId.
		let key = `bots.${botID}.processes.${prcId}`
		return field ? key + '.' + field : key;
	}

	getChangeObjectToProcess(botID = '', prcId = '', field = '', data = null) {
		let key = this.getChangeKeyToProcess(botID, prcId, field),
			obj = {};
		
		obj[key] = data;
		return obj;
	}

	async getAllUsersIncome(admin = {}, callback = (data = {}) => {}) {
		if(await this.authenticationAdmin(admin)) {
			let allUserIncome = {};
			let users = await Mongo.syncSelect({}, CONSTANTS.USERS_DATA_COLLECTION),
				len = users.length;
			
			for(let i = 0, user = users[i]; i < len; i++) {
				allUserIncome[user.name] = this.assemblyUserIncome(user.bots);
			}

			callback(this.getSuccessfullyMessage({ data: allUserIncome }));
		} else callback(this.getFailureMessage({ message: 'Недостаточно прав!' }));
	}

	async getUserIncome(user = {}, callback = (data = {}) => {}) {
		user = { name: user.name };
		if(user.name) {
			let userData = await Mongo.syncSelect(user, CONSTANTS.USERS_DATA_COLLECTION);

			if(userData.length) {
				userData = userData[0];
				let userIncome = this.assemblyUserIncome(userData.bots);

				callback(this.getSuccessfullyMessage({ data: userIncome }));

			} else callback(this.getFailureMessage({ message: 'Пользователь не найден' }));

		} else callback(this.getFailureMessage({ message: 'Невозможно определить пользователя' }));
	}

	assemblyUserIncome(bots = {}) {
		console.time('assemblyUserIncome');

		let allIncome = {},
			botsIncome = {};

		for (let botId in bots) {
			let processes = bots[botId].processes,
				botIncome = {},
				allBotIncome = {};

			botIncome.processes = {};

			for (let processId in processes) {
				let incomes = processes[processId].incomes,
					processIncome = {},
					allProcessIncome = {};
				
				processIncome.deals = {};

				for (let dealId in incomes) {
					let deal = incomes[dealId];
					processIncome.deals[dealId] = deal;

					for (let symbol in deal) {
						if(deal[symbol]) {
							if(allIncome[symbol]) allIncome[symbol] += deal[symbol];
							else allIncome[symbol] = deal[symbol];

							if(allProcessIncome[symbol]) allProcessIncome[symbol] += deal[symbol];
							else allProcessIncome[symbol] = deal[symbol];
							
							if(allBotIncome[symbol]) allBotIncome[symbol] += deal[symbol];
							else allBotIncome[symbol] = deal[symbol];
						}
					}
				}
				processIncome['allProcessIncome'] = allProcessIncome;
				botIncome.processes[processId] = processIncome;
			}

			botIncome['allBotIncome'] = allBotIncome;
			botsIncome[botId] = botIncome;
		}
		console.timeEnd('assemblyUserIncome');
		return {
			allIncome: allIncome,
			botsIncome: botsIncome
		};
	}

	async authenticationAdmin(admin = {}) {
		if(admin.name && admin.admin) {
			admin = { name: admin.name };
			let adminData = await Mongo.syncSelect(admin, CONSTANTS.USERS_COLLECTION);
			return adminData.length;

		} else {
			return false;
		}
	}

}

module.exports = new Income();