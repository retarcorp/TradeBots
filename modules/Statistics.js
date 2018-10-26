const CONSTANTS = require('../constants');
const Mongo = require('./Mongo');
const STATISTICS_COLLECTION = CONSTANTS.STATISTICS_COLLECTION;
const sleep = require('system-sleep')
const M = require('./Message');

class Statistics {
	constructor() {

	}

	async getUserStatistic(user = {}, callback = (data = {}) => {}) {
		console.log(user);
		console.log(CONSTANTS.USERS_COLLECTION);
		let userData = await Mongo.syncSelect(user, CONSTANTS.USERS_COLLECTION);
		if(userData.length && (userData = userData[0]).name ) {
			let resData = [],
				bots = userData.bots;

			bots.forEach(bot => {
				let botData = {
					title: bot.title,
					botID: bot.botID,
					status: bot.status,
					processes: []
				},
					processes = bot.processes;

				for (let _id in processes) {
					let prc = processes[_id],
						prcData = {
							botTitle: botData.title,
							processId: prc.processId,
							symbol: prc.symbol,
							status: prc.status,
							finallyStatus: prc.finallyStatus,
							freeze: prc.freeze,
							orders: prc.orders
						};
					
					botData.processes.push(prcData);
				}

				resData.push(botData);
			});

			callback(M.getSuccessfullyMessage({ data: resData }));

		} else {
			callback(M.getFailureMessage({ message: `Пользователь не найден (${user.name})`}));
		}

	}

	async updateUsersStatistic() {
		console.time('updateUsersStatistic');
		let users = await Mongo.syncSelect({}, CONSTANTS.USERS_COLLECTION);
		let res = {};

		for (let i = 0; i < users.length; i++) {
			let user = users[i];
			if(user.name) {
				let orders = [];
				let bots = user.bots;
				for (let j = 0; j < bots.length; j++) {
					let bot = bots[j];
					let processes = bot.processes;

					for (let processId in processes) {
						orders.push(...processes[processId].orders);
					}
	
				}
				await Mongo.syncUpdate({ name: user.name }, { orderList: orders }, CONSTANTS.USERS_DATA_COLLECTION);
				res[user.name] = { //!!!!!!!!!!!!!user.userId
					orderList: orders
				};
			}
		}
		console.timeEnd('updateUsersStatistic');
		setTimeout(() => {
			this.updateUsersStatistic() }
			, CONSTANTS.UPDATE_ORDERS_LIST_SLEEP);
	}

	
}

module.exports = new Statistics();