const VOLUME_LIMIT = {
	BTC: 0.001,
	ETH: 0.01,
	BNB: 1,
	USDT: 10
};

module.exports = class BotSettings {
	constructor() {
		this.VOLUME_LIMIT = VOLUME_LIMIT,
		this.s=0
				
	}
};
/*
var Martingale = {
	Value: number,
	Active: boolean
}
var SafeOrder = {
	Size: number,
	Amount: number
}
var TraidingSignals = {
	TermsOfATransaction: number,
	Timeframe: string
}
var BotSettings = {
	VolumeLimitBTC: 0,
	TraidingSignals: TraidingSignals,
	InitialOrder: number,
	SafeOrder: InitialOrder,
	Deviation: number,
	Martingale: Martingale,
	MaxOpenSafetyOrders: number,
	TakeProffit: number,
	StopLoss: number
}
*/