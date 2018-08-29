let Pair = require('./Pair');
let DateInfo = require('./DateInfo');
let binanceAPI = require('binance-api-node');
/*
{ symbol: 'ETHBTC',
  orderId: 196357393,
  clientOrderId: 'eTFfTS43QuiYSzwpQ4Xw7a',
  transactTime: 1535028826765,
  price: '0.04200000',
  origQty: '0.02400000',
  executedQty: '0.00000000',
  cummulativeQuoteQty: '0.00000000',
  status: 'NEW',
  timeInForce: 'GTC',
  type: 'LIMIT',
  side: 'BUY',
  fills: [] }
*/
const ORDER_STATE = require('../constants').ORDER_STATE;

module.exports = class Order {
	constructor({
		symbol = null,
		orderId,
		clientOrderId = null,
		transactTime = null,
		price = null,
		origQty = null,
		executedQty = null,
		cummulativeQuoteQty = null,
		status = null,
		time = null,
		timeInForce = null,
		type = null,
		side = null,
		fills = null,
		isUpdate = false
	}) {
		this.symbol = symbol
		this.orderId = orderId
		this.clientOrderId = clientOrderId
		this.transactTime = transactTime
		this.price = price
		this.origQty = origQty
		this.executedQty = executedQty
		this.cummulativeQuoteQty = cummulativeQuoteQty
		this.status = status
		this.timeInForce = timeInForce
		this.type = type
		this.side = side
		this.fills = fills
		this.time = time
		this.isUpdate = isUpdate
	}
}