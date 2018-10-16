const request = require('request');
const rp = require('request-promise');
const { bitaps } = require('../config/config');
const CONSTANTS = require('../constants');
const PM = CONSTANTS.PM;
const Mongo = require('./Mongo');
const uniqid = require('uniqid');

class Bitaps {	
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

	async saveNewPayment(user = {}, paymentData = {}, tariffData = {}) {
		let userData = await Mongo.syncSelect({ userId: user.userId }, CONSTANTS.USERS_DATA_COLLECTION);
		if(userData.length) {
			userData = userData[0];
			let userPaymentInfo = userData.paymentInfo,
				paymentId = uniqid(PM);
		
			!userPaymentInfo && (userPaymentInfo = {});

			// paymentData.tariffData = tariffData;

			userPaymentInfo[paymentId] = paymentData;
			
			await Mongo.syncUpdate({ userId: user.userId }, { paymentInfo: userPaymentInfo}, CONSTANTS.USERS_DATA_COLLECTION);
			return true;
		} 
		return false;
	}

	async createWallet(user = {}) {
		console.log("CREATE WALLET");
		if(user.userId) {
			let clb_url = this.getCallback(user.userId),
				paymentUrl = this.getPaymentUrl(clb_url);

			let paymentData = await rp({ uri: paymentUrl, method: "GET" });
			await this.saveNewPayment(user, paymentData);
			return JSON.parse(paymentData);
		}
		return false;
	}

	async createPayment(user = {}, tariffData = {}, callback = (data = {}) => {}) {
		console.log("CREATE PAYMENT")
		// мне приходит юзер и инфа о тарифе
		// -> создать запрос на создание временного адреса оплаты 
		// -> обработать ответ с запроса -> сохранить выставленный адрес, код платежа и счет
		// -> счет отправить покупателю в каллбеке запроса

		let clb_url = this.getCallback(user.userId),
			paymentUrl = this.getPaymentUrl(clb_url);
		console.log(paymentUrl)
		let paymentData = await rp({ uri: paymentUrl, method: 'GET' });
		paymentData = JSON.parse(paymentData);
		console.log(paymentData);
		if(await this.saveNewPayment(user, paymentData, tariffData)) {
			let data = {	
				data: {
					address: paymentData.address
				}
			};
			callback(this.getSuccessfullyMessage({ data: data }));
			return paymentData;
		} else {
			callback(this.getFailureMessage({ message: 'Ошибка при сохранении данных'}));
			return false;
		}
	}


	getPaymentUrl(callback = encodeURIComponent(`${bitaps.callback_url}null`), confirmations = 3, fee_level = 'low') {
		return   `${bitaps.payment_url}${bitaps.payout_address}/${callback}?confirmations=${confirmations}&fee_level=${fee_level}`;
	}

	getCallback(userId = '') {
		return encodeURIComponent(`${bitaps.callback_url}${userId}`);
	}

	async addBalance(user, body, callback = (data = {}) => {}) { // обработка каллбека после оплаты
		//обработать полученные данные, добавить пользователю тариф
		// ответить битапсу словом "invoice"?

		// tx_hash={transaction hash}
		// address={address}
		// invoice={invoice}
		// code={payment code}
		// amount={amount} # Satoshi
		// confirmations={confirmations}
		// payout_tx_hash={transaction hash} # payout transaction hash
		// payout_miner_fee={amount}
		// payout_service_fee={amount} 
		console.log(body);
		Mongo.insert(body, CONSTANTS.PAYMENTS_COLLECTION, data => console.log(data, "PAYMENT SAVE"));

		let paymentInfo = await Mongo.syncSelect({ userId: user.userId }, CONSTANTS.USERS_DATA_COLLECTION);
		let userTariffs = await Mongo.syncSelect({ userId: user.userId }, CONSTANTS.USERS_COLLECTION);

		if(paymentInfo.length && userTariffs.length) {
			paymentInfo = paymentInfo[0].paymentInfo; 
			userTariffs = userTariffs[0].tariffs;

			let curPaymentInfo = paymentInfo.find(elem => elem.address === body.address);
			let curTariffIndex = userTariffs.findIndex(elem => elem.tariffId === curPaymentInfo.tariffData.tariffId);

			// если цена оплаченная >= цены тарифа, то добавить тарифф юзеру
			let exhs = await rp({ uri: 'https://bitaps.com/api/ticker/average', method: 'GET' });
			exhs = JSON.parse(exhs);
			let usdExh = exhs.usd; 

			let tariffPrice = Number(curPaymentInfo.tariffData.price),
				paidPrice = Number(body.amount) * Number(usdExh),
				priceAlreadyPaid = Number(curPaymentInfo.paidPrice);

			let change = {};
			if(priceAlreadyPaid + paidPrice <= tariffPrice) {
				let keyStatus = `tariffs.${curTariffIndex}.status`,
					keyPaidPrice = `tariffs.${curTariffIndex}.paidPrice`;

				change[keyStatus] = true;
				change[keyPaidPrice] = priceAlreadyPaid + paidPrice;
			} else {
				let keyPaidPrice = `tariffs.${curTariffIndex}.paidPrice`;
				change[keyPaidPrice] = priceAlreadyPaid + paidPrice;
			}

			await Mongo.syncUpdate({ userId: user.userId }, change, CONSTANTS.USERS_COLLECTION);

		} 
		callback(body.invoice);
	}
}

module.exports = new Bitaps();
