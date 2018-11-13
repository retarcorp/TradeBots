const Mongo = require('./Mongo');
const CONSTANTS = require('../constants');
const Bitaps = require('./Bitaps');
const Balance = require('./Balance');
const uniqid = require('uniqid');
const TF = CONSTANTS.TF;
const M = require('./Message');
let binanceAPI = require('binance-api-node').default;

class Tariff {
	constructor({
		title = 'untitled tariff',
		tariffId = uniqid.time(TF),
		price = 0,
		maxBotAmount = 0,
		termOfUse = 0,
		status = false,
		paidPrice = 0
	} = {}) {
		this.title = title;
		this.tariffId = tariffId;
		this.price = price;
		this.maxBotAmount = maxBotAmount;
		this.termOfUse = termOfUse; 
		this.status = status;
		this.paidPrice = paidPrice;
	}
}

class TariffList {
	async purchaseTariff(user = {}, tariffId = Number(), callback = (data = {}) => {}) {

		// @TODO 
		// мы покупаем тариф, если баланса хватает, то 
		// провеяем есть ли у нас уже тариф:
		// если есть
		// 		помечаем его как текущий и выставляем ему время завершения
		// если нету
		// 		помечаем его как будущий не выставляя ему время завершения
		// 
		// добавляем в тарифы юзера этот тариф, вычитаем баланс

		user = { name: user.name };
		let userData = {};
		
		if(userData = await this.userExists(user)) {
			userData = userData[0];

			let tariffList = await this.getTariffList(),
				currentTariff = tariffList.find(tariff => tariff.tariffId === tariffId);

			if(currentTariff) {
				let exhrs = await Bitaps.getExchangeRates(), // цены валют
					tariffPrice = Number(currentTariff.price),
					btcTariffPrice = tariffPrice / Number(exhrs.usd), 
					userWalletBalance = Number(userData.walletBalance);

				if(userWalletBalance >= btcTariffPrice) {

					let userTariffs = userData.tariffs || [],
						newUserWalletBalance = userWalletBalance - btcTariffPrice,
						userMaxBotAmount = userData.maxBotAmount,
						nextUserMaxBotAmount = userMaxBotAmount,
						purchaseDate = Date.now(),
						tariffExpirationDate = purchaseDate,
						isCurent = false;

					if(userTariffs.length) { // тарифы есть
						isCurent = false;

					} else { // тарифов нету
						let tariffMaxBotAmount = Number(currentTariff.maxBotAmount),
							extraDate = this.translationDaysToMilliseconds(Number(currentTariff.termOfUse));

						nextUserMaxBotAmount += tariffMaxBotAmount;
						tariffExpirationDate = purchaseDate + extraDate;
						isCurent = true;
					}

					currentTariff.purchaseDate = purchaseDate;
					currentTariff.expirationDate = tariffExpirationDate;
					currentTariff.expirationDatePattern = this.toPattern(tariffExpirationDate);
					currentTariff.isCurent = isCurent;
					currentTariff.paymentInfo = {
						userWalletBalance,
						btcTariffPrice,
						newUserWalletBalance
					}
					userTariffs.push(currentTariff);

					let change = {
						tariffs: userTariffs,
						walletBalance: newUserWalletBalance,
						maxBotAmount: nextUserMaxBotAmount
					};

					await Mongo.syncUpdate(user, change, CONSTANTS.USERS_COLLECTION);
					callback(M.getSuccessfullyMessage({ data: { walletBalance: newUserWalletBalance, purchasedTariff: currentTariff } }));

				} else callback(M.getFailureMessage({ message: 'Недостаточно средств на балансе!', data: { tariffPrice: btcTariffPrice, userBalance: userWalletBalance } }));
			} else callback(M.getFailureMessage({ message: 'Выбранный тариф не существует!' }));
		} else callback(M.getFailureMessage({ message: 'Пользователь не найден!' }));

		/*
		user = { name: user.name };
		let userData = {};

		if(userData = await this.userExists(user)) {
			userData = userData[0];
			// user <- currentTariff <- tariffData
			let tariffList = await this.getTariffList(),
				currentTariff = tariffList.find(tariff => tariff.tariffId === tariffId);

			if(currentTariff) {
				let exhrs = await Bitaps.getExchangeRates(),
					tariffPrice = Number(currentTariff.price),
					btcTariffPrice = tariffPrice / Number(exhrs.usd), 
					userWalletBalance = Number(userData.walletBalance);

				if(userWalletBalance > btcTariffPrice) {
					let userTariffs = userData.tariffs || [],
						newUserWalletBalance = userWalletBalance - btcTariffPrice,
						userMaxBotAmount = userData.maxBotAmount,
						tariffMaxBotAmount = Number(currentTariff.maxBotAmount),
						nextUserMaxBotAmount = userMaxBotAmount + tariffMaxBotAmount,
						purchaseDate = Date.now(),
						extraDate = this.translationDaysToMilliseconds(Number(currentTariff.termOfUse)),
						tariffExpirationDate = purchaseDate + extraDate,
						userExpirationDate = Number(userData.expirationDate),
						nextExpirationDate = (userExpirationDate <= tariffExpirationDate) ? tariffExpirationDate : userExpirationDate;

					currentTariff.purchaseDate = purchaseDate;
					currentTariff.expirationDate = tariffExpirationDate;
					userTariffs.push(currentTariff);

					let change = {
						tariffs: userTariffs,
						walletBalance: newUserWalletBalance,
						maxBotAmount: nextUserMaxBotAmount,
						expirationDate: nextExpirationDate,
						expirationDatePattern: this.toPattern(nextExpirationDate)
					};
	
					await Mongo.syncUpdate(user, change, CONSTANTS.USERS_COLLECTION);
					callback(M.getSuccessfullyMessage({ data: { walletBalance: newUserWalletBalance, purchasedTariff: currentTariff } }));
					
				} else callback(M.getFailureMessage({ message: 'Недостаточно средств на балансе!', data: { tariffPrice: btcTariffPrice, userBalance: userWalletBalance } }));
			} else callback(M.getFailureMessage({ message: 'Выбранный тариф не существует!' }));
		} else callback(M.getFailureMessage({ message: 'Пользователь не найден!' }));
		*/
	}

	translationDaysToMilliseconds(days = 0) {
		const oneDay = 86400000;
		return oneDay * days;
	}

	async setTariff(admin = {}, tariffData = {}, callback = (data = {}) => {}) {
		if(await this.authenticationAdmin(admin)) {
			let newTariff = new Tariff(tariffData);

			if(!(await this.tariffExists(newTariff))) {
				await Mongo.syncInsert(newTariff, CONSTANTS.TARIFFS_COLLECTION);
				callback(M.getSuccessfullyMessage());
			} else {
				callback(M.getSuccessfullyMessage({ message: 'Тариф уже существует!' }));
			}


		} else {
			callback(M.getFailureMessage());
		}
	}

	async getUsersTariffs(user = {}, callback = (data = {}) => {}) {
		user = { name: user.name };
		if(await this.userExists(user)) {
			let curUser = await Mongo.syncSelect(user, CONSTANTS.USERS_COLLECTION);
				curUser = curUser[0];

			let userTariffs = curUser.tariffs || [],
				userTariffsHistory = curUser.tariffHistory || [];

			callback(M.getSuccessfullyMessage({ data: { userTariffs, userTariffsHistory } }));

		} else {
			callback(M.getFailureMessage({ message: 'Пользователь не найден!' }));
		}
	}

	async getTariffList(admin = {}, callback = (data = {}) => {}) {
		// if(await this.authenticationAdmin(admin)) {
			let tariffList = await Mongo.syncSelect({}, CONSTANTS.TARIFFS_COLLECTION);
			callback(M.getSuccessfullyMessage({ data: tariffList }));
			return tariffList;
		// } else {
		// 	callback(M.getFailureMessage());
		// }
	}

	async removeTariff(admin = {}, removedTariff = {}, callback = (data = {}) => {}) {
		if(await this.authenticationAdmin(admin)) {
			removedTariff = new Tariff(removedTariff);
			if(await this.tariffExists(removedTariff)) {
				await Mongo.syncDelete({ tariffId: removedTariff.tariffId }, CONSTANTS.TARIFFS_COLLECTION);
				callback(M.getSuccessfullyMessage());
			} else {
				callback(M.getFailureMessage({ message: 'Запрашиваемый тариф не существует!' }));
			}
		} else {
			callback(M.getFailureMessage());
		}
	}

	async editTariff(admin = {}, nextTariffData = {}, callback = (data = {}) => {}) {
		if(await this.authenticationAdmin(admin)) {
			nextTariffData = new Tariff(nextTariffData);
			await Mongo.syncUpdate({ tariffId: nextTariffData.tariffId }, nextTariffData, CONSTANTS.TARIFFS_COLLECTION);
			callback(M.getSuccessfullyMessage({ data: nextTariffData }));
		} else {
			callback(M.getFailureMessage());
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
		return userData;
	}

	async tariffExists(tariff = {}) {
		tariff = { title: tariff.title };
		let tariffsArray = await Mongo.syncSelect(tariff, CONSTANTS.TARIFFS_COLLECTION);
		return tariffsArray.length;
	}

	toPattern(date = Date.now()) {
		date = new Date(date);
		let hh = String(date.getHours()),
			ss = String(date.getSeconds()),
			DD = String(date.getDate()),
			mm = String(date.getMinutes()),
			MM = String(date.getMonth() + 1),
			YYYY = date.getFullYear();

		hh = hh.length < 2 ? '0' + hh : hh;
		mm = mm.length < 2 ? '0' + mm : mm;
		ss = ss.length < 2 ? '0' + ss : ss;
		DD = DD.length < 2 ? '0' + DD : DD;
		MM = MM.length < 2 ? '0' + MM : MM;

		return `${MM}/${DD}/${YYYY} ${hh}:${mm}:${ss}`;
	}
}

module.exports = new TariffList();