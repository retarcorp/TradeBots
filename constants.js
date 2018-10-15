const CONSTANTS = {
	TIMEFRAME: {
		m1: '1m',
		m5: '5m',
		m15: '15m',
		h1: '1h',
		h4: '4h',
		d1: '1d',
		w1: '1w',
		M1: '1M'
	},

	TRANSACTION_TERMS: {
		BUY: 'Buy',
		STRONG_BUY: 'Strong Buy',
		SELL: 'Sell',
		STRONG_SELL: 'Strong Sell',
		NEUTRAL: 'Neutral'
	},

	VOLUME_LIMIT: {
		BTC: { NAME: 'BTC', VALUE: 0.001 },
		ETH: { NAME: 'ETH', VALUE: 0.01 },
		BNB: { NAME: 'BNB', VALUE: 1 },
		USDT: { NAME: 'USDT', VALUE: 10 }
	},

	// PAIRS: {
	// 	ETHBTC: 'ETHBTC',
	// 	BNBBTC: 'BNBBTC',
	// 	BNBETH: 'BNBETH',
	// 	BTCUSDT: 'BTCUSDT',
	// 	ETHUSDT: 'ETHUSDT',
	// 	BNBUSDT: 'BNBUSDT'
	// },

	PAIRS: [
		'ETHBTC',
		'BNBBTC',
		'BNBETH',
		'BTCUSDT',
		'ETHUSDT',
		'BNBUSDT'
	],

	BOT_STATE: {
		AUTO: '0',
		MANUAL: '1'
	},

	BOT_STATUS: {
		INACTIVE: false,//'0',
		ACTIVE: true//'1'
	},

	BOT_FREEZE_STATUS: {
		INACTIVE: '0',
		ACTIVE: '1'
	},

	ORDER_STATE: {
		OPENED: 0,
		PROCESSED: 1,
		COMPLETED: 2,
		FAILED: 3
	},

	BINANCE_FEE: 0.1,

	ORDER_STATUS: {
		NEW: 'NEW',
		PARTIALLY_FILLED: 'PARTIALLY_FILLED',
		FILLED: 'FILLED',
		CANCELED: 'CANCELED',
		PENDING_CANCEL: 'PENDING_CANCEL',
		REJECTED: 'REJECTED',
		EXPIRED: 'EXPIRED'
	},

	ORDER_SIDE: {
		BUY: 'BUY',
		SELL: 'SELL'
	},

	ORDER_TYPE: {
		LIMIT: 'LIMIT',
		MARKET: 'MARKET'
	},

	SYMBOLS_FILTERS: {
		PRICE_FILTER: 'PRICE_FILTER',

		LOT_SIZE: 'LOT_SIZE',

		MIN_NOTIONAL: 'MIN_NOTIONAL',

		ICEBERG_PARTS: 'ICEBERG_PARTS',

		MAX_NUM_ALGO_ORDERS: 'MAX_NUM_ALGO_ORDERS'
	},

	PRC: 'PRC-', //Process

	BT: 'BOT-', //Bot

	TF: 'TF-', //Tariff

	US: 'US-', //User 

	DL: 'DL-', //Deal

	PM: 'PM-', //Payment

	DISABLE_FLAG: 'disable',

	CONTINUE_FLAG: true,
 
	TIMEOUT: 500,

	ORDER_TIMEOUT: 1000,

	BOT_SLEEP: 5000,

	SLEEP: 5000,

	UPDATE_ORDERS_LIST_SLEEP: 15000,

	TRADING_SIGNALS_COLLECTION: 'tradingSignals',

	SYMBOLS_LIST_COLLECTION: 'symbolsList',

	SYMBOLS_PRICE_FILTER_COLLECTION: 'exchangeInfoSymbols',

	USERS_COLLECTION: 'users',

	TARIFFS_COLLECTION: 'tariffs',

	HISTORY_LOG: 'historyLog',

	STATISTICS_COLLECTION: 'statistics',

	USERS_DATA_COLLECTION: 'usersData',

	PAYMENTS_COLLECTION: 'payments'
}
module.exports = CONSTANTS
