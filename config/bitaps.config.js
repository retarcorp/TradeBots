let { url } = require('./url.config');
module.exports = {
	payout_address: '1EHjNxEeDUpGKCHUW47jEPx4UqVwFb8sFu',

	payment_url: 'https://bitaps.com/api/create/payment/',

	callback_url:  url + '/api/bitaps/addBalance?userId=',

	satoshi: 0.00000001,

	confirmations: 3,

	fee_level: {
		low: 'low'
	}
};