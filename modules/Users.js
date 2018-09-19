const md5 = require('md5')
const Mongo = require('./Mongo')
const Bot = require('../modules/Bot')
const Crypto = require('./Crypto')
const CONSTANTS = require('../constants')
const Binance = require('./Binance')
let binanceAPI = require('binance-api-node').default

let Users = {

	adminLogin(admin, callback) {
		this.find(admin, 'admin', callback);
	}

	,find(user, collection, callback) {
		Mongo.select({ name: user.name }, collection, callback);
	}

	,create(user, collection, callback) {
		let salt = md5(this.genSalt()),
			name = user.name,
			password = md5(salt + user.password + salt),
			admin = (user.admin) ? true : false,
			regDate = Date.now();

			User = {
				name: name
				,regDate: regDate
				,password: password
				,salt: salt
				,admin: admin
				,ordersList: {}
				,bots: []
				,binanceAPI: {
					name: null,
					key: null,
					secret: null,
					options: null
				}
			}

		this.find( { name: name }, collection, (data) => {

			if (!data.length) {
				Mongo.insert(User, collection, callback);

				// Mailer.send({
                //     html : Templates.getRegistrationMail(user)
                //     ,subject : "Registrating in TradeBots"
				// 	,to: user.name
				// });

				// Mailer.send({
				// 	from: 'serehactka@gmail.com'
				// 	,to: user.name
				// 	,subject: 'Testing'
				// 	,html: Templates.getRegistrationMail(user)
				// });

			} else {
				callback({ status: 'error', message: "User already exist!" });
			}
		});
	}

	,setBinance(user, binanceData, callback) {
		Mongo.select(user, 'users', (data) => {
			data = data[0];
			if(binanceData){
				binanceData.data = data;
				data.binanceAPI = new Binance(binanceData);
			}
			else data.binanceAPI = {};
			Mongo.update({name: data.name}, data, 'users', (data) => {
				callback({
					status: 'ok',
					data: data.binanceAPI
				});
			});
		});
	}

	,getBinance(user, callback) {
		Mongo.select(user, 'users', (data) => {
			data = data[0];
			let retData = {};
			if(data.binanceAPI.key) {
				retData = {
					name: data.binanceAPI.name,
					key: Crypto.decipher(data.binanceAPI.key, Crypto.getKey(data.regDate, data.name)),
					secret: '*******'
				}
			}
			if(callback) callback({
				status: 'ok',
				data: retData
			});
		});
	}

	,Bots: {
		Bots: []

		,setBotsArray() {
			Mongo.select({}, 'users', (users) => {
				users.forEach(user => {
					user.bots.forEach(bot => {
						bot = new Bot(bot)
						this.Bots.push(bot)
						bot.continueTrade(user)
					})
				})
			})
		}

		,get(user, botID, callback) {
			Mongo.select(user, 'users', (data) => {
				data = data[0];
				if(callback) {
					const i = data.bots.findIndex(bot => Number(bot.botID) === Number(botID))
					callback({
						status: 'ok',
						data: data.bots[i] || {}
					})
				}
			})
		}

		,getBotList(user, callback) {
			Mongo.select(user, 'users', (data) => {
				data = data[0];
				if(callback)
					callback({
						status: 'ok',
						data: data.bots || []
					})
			})
		}

		,setBot(user, botData, callback) {
			Mongo.select(user, 'users', (data) => {
				data = data[0];
				let tempBot;
				// console.log(botData);
				if(typeof botData === 'object'){
					tempBot = new Bot(botData);
					data.bots.push(tempBot);
					this.Bots.push(tempBot)
				}
				else {
					let tempBots = [];
					data.bots.forEach(bot => {
						if(bot.botID !== botData) tempBots.push(bot);
					});
					data.bots = tempBots;

					const index = this.Bots.findIndex(bot => bot.botID === botData)
					this.Bots.splice(index, 1)
				}
				Mongo.update({name: data.name}, data, 'users', (data) => {
					if(typeof botData === 'object') {
						callback({
							status: 'ok',
							data: tempBot
						});
					}
					else {
						callback({
							status: 'ok',
							data: {
								botID: botData
							}
						});
					}
				});
			});
		}

		,updateBot(user, botData, callback) {
			Mongo.select(user, 'users', (data) => {
				data = data[0];
				let tempBot = new Bot(botData);
				const index = data.bots.findIndex(bot => bot.botID === tempBot.botID);
				data.bots[index] = tempBot;

				const newIndex = this.Bots.findIndex(bot => bot.botID === tempBot.botID)
				this.Bots[newIndex] = tempBot

				Mongo.update({name: data.name}, data, 'users', (data) => {
					if(callback)
						callback({
							status: 'ok',
							data: tempBot
						});
				});
			});
		}

		,setStatus(user, botData, callback) {
			try {
				Mongo.select(user, 'users', (data) => {
					data = data[0]

					const index = this.Bots.findIndex(bot => bot.botID === botData.botID)
					console.log(botData)
					this.Bots[index].changeStatus(botData.status, data)
					.then( d => callback(d) )

					// const index = data.bots.findIndex(bot => bot.botID === botData.botID)
					// let newBot = new Bot(data.bots[index])
					// data.bots[index] = newBot
					// data.bots[index].changeStatus(botData.status, data)
					// .then((d) => {
					// 	Mongo.update({name: data.name}, data, 'users', (data) => {
					// 		callback(d)
					// 	})
					// })
				})
			}
			catch(error) {
				callback({
					status: 'error',
					message: error
				})
			}
		}

		,cancelOrder(user, reqData, callback) {
			try {
				// console.log('cancel order')
				Mongo.select(user, 'users', (data) => {
					data = data[0]
					// const index = data.bots.findIndex(bot => bot.botID === reqData.botID)
					const index = this.Bots.findIndex(bot => bot.botID === reqData.botID)

					// let bot = new Bot(data.bots[index], data)

					this.Bots[index].cancelOrder(reqData.orderId)
					.then(d => {
						callback({
							status: d.status,
							message: d.message,
							data: d.order
						})
					})
					.catch(error => callback({
						status: 'error',
						message: error
					}))
				})
			}
			catch(error) {
				// console.log(error)
				callback({
					status: 'error',
					message: error
				})
			}
		}

		,cancelAllOrders(user, reqData, callback) {
			try {
				// console.log('cancel all orders')
				Mongo.select(user, 'users', (data) => {
					data = data[0]
					// const index = data.bots.findIndex(bot => bot.botID === reqData.botID)
					// let bot = new Bot(data.bots[index], data)
					const index = this.Bots.findIndex(bot => bot.botID === reqData.botID)

					this.Bots[index].cancelAllOrders(user)
					.then(d => {
						callback(d)
					})
					.catch(error => {
						callback({
							status: 'error',
							message: error
						})
					})
				})
			}
			catch(error) {
				// console.log(error)
				callback({
					status: 'error',
					message: error
				})
			}
		}

		,freezeBot(user, reqData, callback) {
			try {
				console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~') 
				console.log(this.Bots)
				Mongo.select(user, 'users', (data) => {
					data = data[0]
					// const index = data.bots.findIndex(bot => bot.botID === reqData.botID)
					const index = this.Bots.findIndex(bot => bot.botID === reqData.botID)
					// let bot = new Bot(data.bots[index], data)
					// data.bots[index] = bot
					this.Bots[index].changeFreeze(reqData.freeze, data)
					.then(d => callback(d) )
					.catch(error => callback({
						status: 'error',
						message: error
					}))
				})
			}
			catch(error) {
				// console.log(error)
				callback({
					status: 'error',
					message: error
				})
			}
		}

	}

	,async sendClientStatistics(userData) {
		let statistics = [],
			ordersList = userData.ordersList 

		if(ordersList) {
			for(bot in ordersList) {
				statistics.push(...ordersList[bot])
			}
		}

		// let Client = this.getClientAPI(user)

		// let statistics = []
		// for(let i = 0; i < CONSTANTS.PAIRS.length; i++) {
		// 	let symbol = CONSTANTS.PAIRS[i]
		// 	let list = []
		// 	try {
		// 		list = await Client.allOrders({symbol})
		// 	}
		// 	catch(error) {
		// 		// console.log(error)
		// 	}
		// 	statistics.push(...list)
		// }
		return {
			status: 'ok',
			data: statistics
		}
	}

	,getClientAPI(user) {
		let key = Crypto.decipher(user.binanceAPI.key,  Crypto.getKey(user.regDate, user.name))
		let secret = Crypto.decipher(user.binanceAPI.secret,  Crypto.getKey(user.regDate, user.name))

		return binanceAPI({
			apiKey: key,
			apiSecret: secret
		})
	}

	,getClientStatistics(user, callback) {
		try {
			Mongo.select(user, 'users', (data) => {
				data = data[0]
				this.sendClientStatistics(data).then(res => {
					callback(res)
				})
			})
		}
		catch(error) {
			// console.log(error)
			callback({
				status: 'error',
				message: error
			})
		}
	}

	,createSession(req, res, next, user, callback) {
		//console.log(req.session)

	    let session = req.session;
		let user1 = {
			name: user.name,
			admin: user.admin
		};
		session.logged = true;
		session.user = session.user || user1;
		// console.log(user1, session)
		if (!req.cookies.user){
			res.cookie('user', user1);
		}

		if (callback) callback();
	}

	,closeSession(req, res, callback) {
        req.session.destroy(callback);
	}

	,checkCredentials(check, User) {
		//console.log(md5(check.salt + User.password + check.salt));
		return check.password == md5(check.salt + User.password + check.salt);
	}

	,genSalt() {
		let salt = "",
			code = 0;

		for (let i = 0; i < 8; i++) {
			code = Math.round(Math.random() * 76 + 48);
			salt += String.fromCharCode(code);
		}

		return salt;
	}
}

module.exports = Users;
