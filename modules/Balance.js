const Mongo = require('./Mongo');
const CONSTANTS = require('../constants');
const Bitaps = require('./Bitaps');
const M = require('./Message');
const uniqid = require('uniqid');
const { bitaps } = require('../config/config');

class Balance {

	async getUserWalletInfo(user = {}, callback = (data = {}) => {}) {
		if(user.name) {
			user = { name: user.name };
	
			let userData = await Mongo.syncSelect(user, CONSTANTS.USERS_COLLECTION);
			if(userData.length) {
				userData = userData[0];

				let walletInfo = {
					walletBalance: userData.walletBalance,
					walletAddress: userData.walletAddress
				}
				callback(M.getSuccessfullyMessage({ data: walletInfo }));
			} else callback(M.getFailureMessage({ message: 'Пользователь не найден!' }));
		} else callback(M.getFailureMessage({ message: 'Пользователь не найден!' }));
	}

	async createWallet(user = {}, callback = (data = {}) => {}) {
		user = { userId: user.userId };

		let paymentWallet = await Bitaps.createWallet(user);
		if(paymentWallet) {
			callback(paymentWallet.address);
			return paymentWallet.address;
		}
		callback(false);
		return false;
	}

	async confirmPayment(user = {}, confirmData = {}, callback = (data = {}) => {}) {
		// tx_hash={transaction hash}
		// address={address}
		// invoice={invoice}
		// code={payment code}
		// amount={amount} # Satoshi
		// confirmations={confirmations}
		// payout_tx_hash={transaction hash} # payout transaction hash
		// payout_miner_fee={amount}
		// payout_service_fee={amount} 
		Mongo.insert({ user: user, payment: confirmData }, CONSTANTS.PAYMENTS_COLLECTION, data => console.log(data, "PAYMENT SAVE"));
		if(user.userId) {
			user = { userId: user.userId };

			let userData = await Mongo.syncSelect(user, CONSTANTS.USERS_COLLECTION);
				// exchangeRates = await Bitaps.getExchangeRates();

			if(userData.length && confirmData.invoice && (Number(confirmData.confirmations) === bitaps.confirmations) ) {
				userData = userData[0];	
				let confirmAddress = confirmData.address,
					confirmAmount = Number(confirmData.amount),
					confirmValue = confirmAmount * bitaps.satoshi,
					currentBalance = Number(userData.walletBalance),
					udpatedBalance = currentBalance + confirmValue;
				
				if(confirmAddress === userData.walletAddress) {
					let change = {
						walletBalance: udpatedBalance
					};
					
					await Mongo.syncUpdate(user, change, CONSTANTS.USERS_COLLECTION);
				}
			}
		}

		callback(confirmData.invoice);
	}
}

module.exports = new Balance();