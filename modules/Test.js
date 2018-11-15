// // const Binance = require('binance-api-node').default;

// // let client = Binance({
// // 	apiKey: 'pMK15sHEO3jS9RE9x4KA5zFfdxCKcxk9gDgyf4BhvGrhvEUn3wiZMTYcuqLEAkNh',
// // 	apiSecret: 'A7pvWxoe0JzHfM1rvF7D2ymM3ZFUvdlOyLRmjeZ7m4gfCWaTOmLBwHcwMUSw3Znp'
// // });

// // client.getOrder({
// // 	symbol: "TUSDBTC",
// // 	orderId: 25709028
// // }).then(console.log).catch(console.log);

// // const sleep = require('system-sleep');
// // let qq = 0;
// // class Test {
// // 	constructor () {
// // 	}	

// // 	async init() {
// // 		let arr = [...Array(10)].map(elem => { 
// // 			return {a: null} 
// // 		});
// // 		console.log(arr);
// // 		await this.updateInfo(arr)/*.then(data => {
// // 			console.log(data);*/
// // 			console.log(arr);
// // 		// })
// // 	}

// // 	async updateInfo(arr = []) {
// // 		return new Promise( (resolve, reject) => {
// // 			for (let i = 0; i < arr.length; i++) {
// // 				if(i === arr.length - 1) {
// // 					console.log('asd')
// // 					this.updateElem(i, arr[i], resolve, reject);
// // 				} else {
// // 					console.log('asd1')
// // 					this.updateElem(i, arr[i]);
// // 				}
// // 			}
// // 		})
// // 	}

// // 	async updateElem(i = 'xh', elem = {}, resolve, reject) {

// // 		let a = await this.checkLol1(i)
// // 		console.log(a);
// // 		elem.a = a;
// // 		if(resolve) resolve(true);
// // 	}


// // 	async checkLol1(i = 'xm1') {
// // 		return new Promise( (resolve, reject) => {
// // 			this.subCheckLol1(i, undefined, undefined, resolve, reject);
// // 		});
// // 	}

// // 	subCheckLol1(i, time = Date.now(), nextTime = time, resolve, reject) {
// // 		qq++;
// // 		if(nextTime - time >= 1000) {
// // 			resolve(time);
// // 		} else {
// // 			setTimeout(() => {
// // 				this.subCheckLol1(i, time, Date.now(), resolve, reject);
// // 			}, 200);
// // 		}
// // 	}



// // 	async checkLol(i = 'xm1', time = Date.now(), nextTime = time) {
// // 		qq++;
// // 		console.log('tick', i, qq)
// // 		if(nextTime - time >= 10000) {
// // 			return time;
// // 		} else {
// // 			sleep(100);
// // 			return this.checkLol(i, time, Date.now());
// // 		}
// // 	}
// // }

// // let t = new Test();

// // t.init();

// const binanceAPI = require('binance-api-node').default;

// let client = binanceAPI({
// 	apiKey: 'pMK15sHEO3jS9RE9x4KA5zFfdxCKcxk9gDgyf4BhvGrhvEUn3wiZMTYcuqLEAkNh',
// 	apiSecret: 'A7pvWxoe0JzHfM1rvF7D2ymM3ZFUvdlOyLRmjeZ7m4gfCWaTOmLBwHcwMUSw3Znp'
// });

// client.accountInfo().then(data => {
// 	console.log(data.canTrade)
// 	console.log(data.balances)
// })






