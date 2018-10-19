const CONSTANTS = require('../constants');
const Mongo = require('./Mongo');
const STATISTICS_COLLECTION = CONSTANTS.STATISTICS_COLLECTION;
const sleep = require('system-sleep')

class Statistics {
	constructor() {

	}

	async getUserStatistic(user = {}, callback = (data = {}) => {}) {

	}

	async setUserStatistic(user = {}, userStatData = {}, callback = (data = {}) => {}) {

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