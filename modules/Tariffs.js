const md5 = require('md5')
const Mongo = require('./Mongo')
const Bot = require('../modules/Bot')
const Crypto = require('./Crypto')
const CONSTANTS = require('../constants')
const Binance = require('./Binance')
const uniqid = require('uniqid');
const TF = CONSTANTS.TF;
let binanceAPI = require('binance-api-node').default;

class Tariff {
	constructor({
		title = 'untitled tariff',
		tariffId = uniqid.time(TF),
		price = 0,
		maxBotAmount = 0,
		termOfUse = 0
	} = {}) {
		this.title = title;
		this.tariffId = tariffId;
		this.price = price;
		this.maxBotAmount = maxBotAmount;
		this.termOfUse = termOfUse; 
	}
}

class TariffList {
	constructor() {
		this.FailureMessage = {
			status: 'error',
			message: 'Недостаточно прав!'
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

	async purchaseTariff(user = {}, tariffId = Number(), callback = (data = {}) => {}) {
		user = { name: user.name };
		if(await this.userExists(user)) {
			// user <- currentTariff <- tariffData
			let tariffList = await this.getTariffList(),
				currentTariff = tariffList.find(tariff => tariff.tariffId === tariffId);

			if(currentTariff) {
				let curUser = await Mongo.syncSelect(user, CONSTANTS.USERS_COLLECTION);
					curUser = curUser[0];
				let userTariffs = curUser.tariffs || [];

				userTariffs.push(currentTariff);

				await Mongo.syncUpdate(user, { tariffs: userTariffs }, CONSTANTS.USERS_COLLECTION);
				callback(this.getSuccessfullyMessage());

			} else {
				callback(this.getFailureMessage({ message: 'Выбранный тариф не существует!' }));
			}

		} else {
			callback(this.getFailureMessage({ message: 'Пользователь не найден!' }));
		}
	}

	async setTariff(admin = {}, tariffData = {}, callback = (data = {}) => {}) {
		if(await this.authenticationAdmin(admin)) {
			let newTariff = new Tariff(tariffData);

			if(!(await this.tariffExists(newTariff))) {
				await Mongo.syncInsert(newTariff, CONSTANTS.TARIFFS_COLLECTION);
				callback(this.getSuccessfullyMessage());
			} else {
				callback(this.getSuccessfullyMessage({ message: 'Тариф уже существует!' }));
			}


		} else {
			callback(this.getFailureMessage());
		}
	}

	async getUsersTariffs(user = {}, callback = (data = {}) => {}) {
		user = { name: user.name };
		if(await this.userExists(user)) {
			let curUser = await Mongo.syncSelect(user, CONSTANTS.USERS_COLLECTION);
				curUser = curUser[0];

			let userTariffs = curUser.tariffs || [];
			callback(this.getSuccessfullyMessage({ data: userTariffs }));

		} else {
			callback(this.getFailureMessage({ message: 'Пользователь не найден!' }));
		}
	}

	async getTariffList(admin = {}, callback = (data = {}) => {}) {
		// if(await this.authenticationAdmin(admin)) {
			let tariffList = await Mongo.syncSelect({}, CONSTANTS.TARIFFS_COLLECTION);
			callback(this.getSuccessfullyMessage({ data: tariffList }));
			return tariffList;
		// } else {
		// 	callback(this.getFailureMessage());
		// }
	}

	async removeTariff(admin = {}, removedTariff = {}, callback = (data = {}) => {}) {
		if(await this.authenticationAdmin(admin)) {
			removedTariff = new Tariff(removedTariff);
			if(await this.tariffExists(removedTariff)) {
				await Mongo.syncDelete({ tariffId: removedTariff.tariffId }, CONSTANTS.TARIFFS_COLLECTION);
				callback(this.getSuccessfullyMessage());
			} else {
				callback(this.getFailureMessage({ message: 'Запрашиваемый тариф не существует!' }));
			}
		} else {
			callback(this.getFailureMessage());
		}
	}

	async editTariff(admin = {}, nextTariffData = {}, callback = (data = {}) => {}) {
		if(await this.authenticationAdmin(admin)) {
			nextTariffData = new Tariff(nextTariffData);
			await Mongo.syncUpdate({ tariffId: nextTariffData.tariffId }, nextTariffData, CONSTANTS.TARIFFS_COLLECTION);
			callback(this.getSuccessfullyMessage({ data: nextTariffData }));
		} else {
			callback(this.getFailureMessage());
		}
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

	async userExists(user = {}) {
		user = { name: user.name };
		let userData = await Mongo.syncSelect(user, CONSTANTS.USERS_COLLECTION);
		return userData.length;
	}

	async tariffExists(tariff = {}) {
		tariff = { title: tariff.title };
		let tariffsArray = await Mongo.syncSelect(tariff, CONSTANTS.TARIFFS_COLLECTION);
		return tariffsArray.length;
	}
}

module.exports = new TariffList();