const md5 = require('md5')
const Mongo = require('./Mongo')
const Bot = require('../modules/Bot')
const Crypto = require('./Crypto')
const CONSTANTS = require('../constants')
const Binance = require('./Binance')
let binanceAPI = require('binance-api-node').default

let Users = {

	adminLogin(admin, adminData, callback) {
	}

	,find(user, collection, callback) {
		Mongo.select({ name: user.name }, collection, callback);
	}

	,deleteUser(admin, userData, callback) {
		Mongo.select(admin, 'users', data => {
			if(data.length) {
				Mongo.delete({name: userData.name}, 'users', data => {
					if(callback) callback({
						status: 'ok',
						data: data,
						message: `Пользователь ${userData.name} успешно удален!` 
					})
				})
			} else {
				if(callback) callback({
					status: 'info',
					message: 'Недостаточно прав для выполнения операции.'
				});
			}
		})
	}

	,getUsersList(admin, callback) {
		Mongo.select(admin, 'users', data => {
			if(data.length) {
				Mongo.select({}, 'users', data => {
					data = data.filter(elem  => !elem.admin)
					data = data.map(({
						name,
						regDate,
						bots
					}) => {
						return {
							name: name,
							regDate: regDate,
							botsCount: bots.length
						}
					})
					if(callback) callback({
						status: 'ok',
						data: {
							usersList: data
						}
					});
				});

			} else {
				if(callback) callback({
					status: 'info',
					message: 'Недостаточно прав для получения данных.'
				});
			}
		})
	}

	,create(user, collection, callback) {
		let salt = md5(this.genSalt()),
			name = user.name,
			password = md5(salt + user.password + salt),
			admin = (user.admin) ? true : false,
			regDate = Date.now(),
			month = 2592000000,
			expirationDate = regDate + month;

			User = {
				name: name
				,regDate: regDate
				,expirationDate: expirationDate
				,password: password
				,salt: salt
				,admin: admin
				,ordersList: {}
				,bots: []
				,maxBotAmount: 0
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

	,setNewPassword(user, newPasswordData, callback) {
		Mongo.select(user, 'users', data => {
			data = data[0];
			let salt = data.salt,
				curPass = md5(salt + newPasswordData.currentPass + salt)
				newPass = md5(salt + newPasswordData.newPass + salt);

			if(curPass === data.password && 
				newPasswordData.newPass === newPasswordData.confirmedNewPass &&
				newPass !== data.password
			) {
				Mongo.update(user, { password: newPass }, 'users', res => {
					if(callback) callback({
						status: 'ok',
						message: 'Пароль успешно изменен!'
					})
				})
			}
			else {
				if(callback) callback({
					status: 'error',
					message: newPass === data.password ? 'Новый пароль не должен быть таким-же как раньше!' : 'Данные введены неверно!'
				})
			}
		})
	}

	,getEmail(user, callback) {
		Mongo.select(user, 'users', data => {
			if(data.length) {
				data = data[0];
				let res = data.name ? data.name : '';
				if(callback) callback({
					status: 'ok',
					data: {
						email: res
					}
				})
			}
			else {
				if(callback)
					callback({
						status: 'error',
						message: 'Такого пользователя не существует'
					});
			}
		})
	}

	,setBinance(user, binanceData, callback) {
		Mongo.select(user, 'users', (data) => {
			data = data[0];
			if(binanceData){
				binanceData.data = data;
				data.binanceAPI = new Binance(binanceData);
			}
			else data.binanceAPI = {};
			Mongo.update(user, {binanceAPI: data.binanceAPI}, 'users', (data) => {
				callback({
					status: 'ok',
					data: data.binanceAPI
				});
			});
		});
	}

	,getBinance(user, callback) {
		Mongo.select(user, 'users', (data) => {
			if(data.length) {
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
			}
			else {
				if(callback)
					callback({
						status: 'error',
						message: 'Такого пользователя не существует'
					});
			}
		});
	}

	,Bots: {
		Bots: []

		,setBotsArray() {
			Mongo.select({}, 'users', (users) => {
				users.forEach(user => {
					user.bots.forEach(bot => {
						bot = new Bot(bot);
						this.Bots.push(bot);
						bot.continueTrade(user);
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
				if(data.length) {
					data = data[0];
					if(callback)
						callback({
							status: 'ok',
							data: data.bots || []
						})
				}
				else {
					if(callback) 
						callback({
							status: 'error',
							message: 'Такого пользователя не существует.'
						});
				}
			})
		}

		,setBot(user, botData, callback) {
			Mongo.select(user, 'users', (data) => {
				data = data[0];
				let tempBot;
				if(typeof botData === 'object'){
					tempBot = new Bot(botData);
					data.bots.push(tempBot);
					this.Bots.push(tempBot)
					Mongo.update(user, {bots: data.bots}, 'users', (data) => {
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
				}
				else {
					let tempBots = [];
					data.bots.forEach(bot => {
						if(bot.botID !== botData) tempBots.push(bot);
					});
					data.bots = tempBots;

					const index = this.Bots.findIndex(bot => bot.botID === botData)
					this.Bots[index].cancelAllOrders(user)
						.then(res => {
							this.Bots[index].deleteBot()
								.then(res => {
									this.Bots.splice(index, 1);
									Mongo.update(user, {bots: data.bots}, 'users', (data) => {
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
								})
						})
				}
				
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

				Mongo.update(user, {bots: data.bots}, 'users', (data) => {
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
				Mongo.select(user, 'users', (data) => {
					data = data[0]
					// const index = data.bots.findIndex(bot => bot.botID === reqData.botID)
					const index = this.Bots.findIndex(bot => bot.botID === reqData.botID)

					// let bot = new Bot(data.bots[index], data)
					this.Bots[index].cancelOrder(reqData.orderId, reqData.processeId)
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
				callback({
					status: 'error',
					message: error
				})
			}
		}

		,cancelAllOrders(user, reqData, callback) {
			try {
				Mongo.select(user, 'users', (data) => {
					data = data[0]
					// const index = data.bots.findIndex(bot => bot.botID === reqData.botID)
					// let bot = new Bot(data.bots[index], data)
					const index = this.Bots.findIndex(bot => bot.botID === reqData.botID)

					this.Bots[index].cancelAllOrders(user, reqData.processeId)
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
				callback({
					status: 'error',
					message: error
				})
			}
		}

		,freezeBot(user, reqData, callback) {
			try {
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
				callback({
					status: 'error',
					message: error
				})
			}
		}

	}

	,Income: {
		get(user, callback) {
			Mongo.select(user, 'users', data => {
				data = data[0];
				const ordersList = data.ordersList;

				let Income = {
					dayIncome: this.coutDayIncome(data.ordersList),
					allIncome: this.countAllIncome(data.ordersList)
				};

				const res = {
					status: 'ok',
					data: {
						income: Income
					}
				};

				if(callback) callback(res)
			});
		},

		countAllIncome(ordersList = {}) {
			let income = {
					BTC: {
						value: 0,
						name: 'BTC'
					},
					USDT: {
						value: 0,
						name: 'USDT'
					},
					BNB: {
						value: 0,
						name: 'BNB'
					},
					ETH: {
						value: 0,
						name: 'ETH'
					}
				};
			for (bot in ordersList) {
				let orders = ordersList[bot],
					botIncome = {
						BTC: {
							value: 0,
							name: 'BTC'
						},
						USDT: {
							value: 0,
							name: 'USDT'
						},
						BNB: {
							value: 0,
							name: 'BNB'
						},
						ETH: {
							value: 0,
							name: 'ETH'
						}
					};

				orders.forEach(order => {
					if(order.status === CONSTANTS.ORDER_STATUS.FILLED) {
						botIncome = this.setSymbolIncome(botIncome, order);
					}
				});

				for (symbol in income) {
					income[symbol].value += botIncome[symbol].value;
				}
			}
			return income;
		},

		coutDayIncome(ordersList = {}) {
			const oneDay = 86400000;
			let income = {
					BTC: {
						value: 0,
						name: 'BTC'
					},
					USDT: {
						value: 0,
						name: 'USDT'
					},
					BNB: {
						value: 0,
						name: 'BNB'
					},
					ETH: {
						value: 0,
						name: 'ETH'
					}
				},
				curDay = Date.now(),
				prevDay = curDay - oneDay; 

			for (bot in ordersList) {
				let orders = ordersList[bot],
					botIncome = {
						BTC: {
							value: 0,
							name: 'BTC'
						},
						USDT: {
							value: 0,
							name: 'USDT'
						},
						BNB: {
							value: 0,
							name: 'BNB'
						},
						ETH: {
							value: 0,
							name: 'ETH'
						}
					};
				orders.forEach(order => {
					if(order.time - prevDay <= oneDay) {
						botIncome = this.setSymbolIncome(botIncome, order);
					}
				});

				for (symbol in income) {
					income[symbol].value += botIncome[symbol].value;
				}
			}

			return income;
		},

		setSymbolIncome(income = {}, order = {}) {
			const symbols = ['BTC', 'BNB', 'ETH', 'USDT'],
				l = symbols.length;

			let curSymbol = '';

			for(let i = 0; i < l; i++) {
				let pos = order.symbol.indexOf(symbols[i]);

				if(pos > 1) {
					curSymbol = symbols[i];
					break;
				}
			}
			
			if(order.side === CONSTANTS.ORDER_SIDE.BUY) {
				income[curSymbol].value -= Number(order.cummulativeQuoteQty);
			}
			else if(order.side === CONSTANTS.ORDER_SIDE.SELL) {
				income[curSymbol].value  += Number(order.cummulativeQuoteQty);
			}

			return income
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
			callback({
				status: 'error',
				message: error
			})
		}
	}

	,createSession(req, res, next, user, callback) {
	    let session = req.session;
		let user1 = {
			name: user.name
			// ,
			// admin: user.admin
		};
		session.logged = true;
		session.user = session.user || user1;

		if (!req.cookies.user){
			res.cookie('user', user1);
		}

		if (callback) callback({ name: user.name }); 
	}

	,createAdminSession(req, res, next, admin, callback) {
	    let session = req.session;
		let admin1 = {
			name: admin.name,
			admin: admin.admin
		};
		session.logged = true;
		session.admin = session.admin || admin1;

		if (!req.cookies.admin){
			res.cookie('admin', admin1);
		}

		if (callback) callback({ name: admin.name }); 
	}

	,closeSession(req, res, callback) {
        req.session.destroy(callback);
	}

	,checkCredentials(check, User) {
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
