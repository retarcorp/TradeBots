const CONSTANTS = {
	TIMEFRAME: {
		M1: '1M',
		M3: '3M',
		M5: '5M',
		M15: '15M',
		M30: '30M',
		H1: '1H',
		H2: '2H',
		H4: '4H',
		H6: '6H',
		H12: '12H',
		D1: '1D',
		W1: '1W'
	},

	TRANSACTION_TERMS: {
		BUY: 0,
		STRONG_BUY: 1
	},

	VOLUME_LIMIT: {
		BTC: { NAME: 'BTC', VALUE: 0.001 },
		ETH: { NAME: 'ETH', VALUE: 0.01 },
		BNB: { NAME: 'BNB', VALUE: 1 },
		USDT: { NAME: 'USDT', VALUE: 10 }
	},

	BOT_STATE: {
		HAND: 1,
		AUTO: 0
	},

	BOT_STATUS: {
		INACTIVE: 0,
		ACTIVE: 1,
		FROZEN: 2
	},

	ORDER_STATE: {
		OPENED: 0,
		PROCESSED: 1,
		COMPLETED: 2,
		FAILED: 3
	}
};

module.exports = CONSTANTS;