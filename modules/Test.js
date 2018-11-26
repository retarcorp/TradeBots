
const binanceAPI = require('binance-api-node').default;
class Test {
	constructor() {

	}

	async init() {
		console.log('init');

		// let mas = [0, 10, 60, 9, 199];
		// let mas1 = [70, 5, 0, 39, 19];
		// let order = {};
		// let f = (data, name, callback = () => {}) => {
		// 	if(data.data === 'error') {
		// 		this.getOrder(++data.el, f, name, callback);
		// 	} else {
		// 		order = data;
		// 		console.log(order, name);
		// 		callback();
		// 	}
		// }
		// this.getOrder(9, f, 'a', () => {
		// 	console.log(order)
		// });
		// this.masObh(mas, f).then(console.log);
		// this.masObh(mas1, f).then(console.log);
		// console.log(this.testRet( () => {
		// 	return 'aaa';
		// } ))
	}

	testRet(clb) {
		setTimeout( () => {
			console.log(clb());
		}, 2000)
	}

	async getOrder_callback(result, orderId, handler_callback) {
		if(result.status === 'error') {
			this.getOrder(orderId, f, handler_callback);
		} else if(result.status === 'ok') {
			handler_callback(result.order);
		}
	}

	async masObh(mas = [], fnc = () => {}) {
		return new Promise( async (resolve, reject) => {
			let am = 0, cam = mas.length;
			for(let i = 0; i < mas.length; i++) {
				this.getOrder(mas[i], fnc, mas[i], () => {
					am++;
					if(am === cam) {
						resolve('okkeee');
					} else if(am > cam) {
						reject('OYY');
					}
				});
			}
		});
	}

	async getOrder(n = 0, callback = () => {}, name, _callback = () => {}) {
		this.getOrder_helper(n)
			.then( result => {
				callback(result, name, _callback);
			})
			.catch( error => {
				callback(error, name, _callback)
			});
	}

	async getOrder_helper(amount = 0) {
		return new Promise( (resolve, reject) => {
			if(amount === 200) {
				resolve('ok ' + amount);
			} else {
				reject({data: 'error', el: amount});
			}
		});
	}

	test() {
		this.testPromise()
			.then(d => {
				console.log(d, 'then');
			})
			.catch(d => {
				console.log(d, 'catch')
			})
	}

	testPromise() { 
		return new Promise( (resolve, reject) => {
			setTimeout( () => {
				let d = Date.now();
				if(d%2) {
					resolve(d);
				} else {
					reject(d);
				}
			}, 1000)
		});
	}

	testBuy() {
		let c = binanceAPI({
			apiKey: 'pMK15sHEO3jS9RE9x4KA5zFfdxCKcxk9gDgyf4BhvGrhvEUn3wiZMTYcuqLEAkNh',
			apiSecret: 'A7pvWxoe0JzHfM1rvF7D2ymM3ZFUvdlOyLRmjeZ7m4gfCWaTOmLBwHcwMUSw3Znp'
		});

		// c.order({
		// 	symbol: 'TRXUSDT',
		// 	side: 'BUY',
		// 	type: 'LIMIT',
		// 	price: 0.01194,
		// 	quantity: 921.2
		// }).then(console.log);
		c.getOrder({
			symbol: 'TRXUSDT',
			orderId: 21467783
		}).then(console.log)
	}
}

let t = new Test();

t.testBuy();