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

	async setTariff(admin = {}, tariffData = {}, callback = (data = {}) => {console.log(data)}) {
		if(await this.authenticationAdmin(admin)) {
			let newTariff = new Tariff(tariffData);

			if(!(await this.isTariffExist(newTariff))) {
				await Mongo.syncInsert(newTariff, CONSTANTS.TARIFFS_COLLECTION);
				callback(this.getSuccessfullyMessage());
			} else {
				callback(this.getSuccessfullyMessage({ message: 'Тариф уже существует!' }));
			}


		} else {
			callback(this.getFailureMessage());
		}
	}

	async getTariffList(admin = {}, callback = (data = {}) => {console.log(data)}) {
		if(await this.authenticationAdmin(admin)) {
			let tariffList = await Mongo.syncSelect({}, CONSTANTS.TARIFFS_COLLECTION);
			callback(this.getSuccessfullyMessage({ data: tariffList }));
		} else {
			callback(this.getFailureMessage());
		}
	}

	async removeTariff(admin = {}, removedTariff = {}, callback = (data = {}) => {console.log(data)}) {
		if(await this.authenticationAdmin(admin)) {
			removedTariff = new Tariff(removedTariff);
			if(await this.isTariffExist(removedTariff)) {
				await Mongo.syncDelete({ tariffId: removedTariff.tariffId }, CONSTANTS.TARIFFS_COLLECTION);
				callback(this.getSuccessfullyMessage());
			} else {
				callback(this.getFailureMessage({ message: 'Запрашиваемый тариф не существует!' }));
			}
		} else {
			callback(this.getFailureMessage());
		}
	}

	async editTariff(admin = {}, nextTariffData = {}, callback = (data = {}) => {console.log(data)}) {
		if(await this.authenticationAdmin(admin)) {
			nextTariffData = new Tariff(nextTariffData);
			await Mongo.syncUpdate({ tariffId: nextTariffData.tariffId }, nextTariffData, CONSTANTS.TARIFFS_COLLECTION);
			callback(this.getSuccessfullyMessage({ data: nextTariffData }));
		}	
		else {
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

	async isTariffExist(tariff = {}) {
		tariff = { title: tariff.title };
		let tariffsArray = await Mongo.syncSelect(tariff, CONSTANTS.TARIFFS_COLLECTION);
		return tariffsArray.length;
	}
}

module.exports = new TariffList();