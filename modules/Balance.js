const Mongo = require('./Mongo');
const CONSTANTS = require('../constants');
const Bitaps = require('./Bitaps');
const uniqid = require('uniqid');

class Balance {

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

}

module.exports = new Balance();