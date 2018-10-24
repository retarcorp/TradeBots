const md5 = require('md5');
const Mongo = require('./Mongo');
const Bot = require('../modules/Bot');
const Crypto = require('./Crypto');
const CONSTANTS = require('../constants');
const Balance = require('./Balance');
const Binance = require('./Binance');
const Mailer = require('./Mailer').init();
const uniqid = require('uniqid');
const Templates = require('./Templates');
let binanceAPI = require('binance-api-node').default;
const config = require('../config/config');
const Logger = require('./Logger');
const US = CONSTANTS.US;

let Users = {

	adminLogin(admin, adminData, callback) {
	}

	,find(user, collection, callback) {
		Mongo.select({ name: user.name }, collection, callback);
	}

	,async getWalletInfo(admin = {}, callback = (data = 0) => {}) {
		if(admin.name && admin.admin) {
			admin = { name: admin.name };
			let _admin = await Mongo.syncSelect(admin, CONSTANTS.USERS_COLLECTION);
			if(_admin.length) {

				let users = await Mongo.syncSelect({}, CONSTANTS.USERS_COLLECTION);
				let usersWalletAddress = [];

				users.forEach(user => {
					let obj = {
						name: user.name,
						userId: user.userId,
						walletAddress: user.walletAddress
					};
					usersWalletAddress.push(obj);
				});
				let walletAddress = config.bitaps.payout_address;

				callback({
					status: 'ok',
					data: {
						walletAddress: walletAddress,
						usersWalletAddress: usersWalletAddress
					}
				})

			} else callback({
				status: 'error',
				message: 'Недостаточно прав!'
			});

		} else callback({
			status: 'error',
			message: 'Недостаточно прав'
		});
	}

	,async changeUserData(admin = {}, nextUserData = {}, callback = (data = 0) => {}) {
		if(admin.name && admin.admin) {
			admin = { name: admin.name };
			let _admin = await Mongo.syncSelect(admin, CONSTANTS.USERS_COLLECTION);

			if(_admin.length) {
				let user = { name: nextUserData.name }, 
					change = Object.assign({}, nextUserData);

				delete change.name;
				delete change.botsCount;
				change.expirationDate = Number(change.expirationDate);
				change.maxBotAmount = Number(change.maxBotAmount);

				await Mongo.syncUpdate(user, change, CONSTANTS.USERS_COLLECTION);

				callback({
					status: 'ok',
					message: 'Выполнено успешно!'
				});

			} else {
				callback({
					status: 'error',
					message: 'Недостаточно прав!'
				});
			}
		} else {
			callback({
				status: 'error',
				message: 'Недостаточно прав'
			});
		}
	}

	,deleteUser(admin, userData, callback) {
		Mongo.select(admin, CONSTANTS.USERS_COLLECTION, data => {
			let res = {};
			if(data.length) {
				Mongo.delete({name: userData.name}, CONSTANTS.USERS_COLLECTION, d => {
					Mongo.delete({ name: userData.name }, CONSTANTS.USERS_DATA_COLLECTION, dd => {
						res = {
							status: 'ok',
							data: {
								d: d,
								dd: dd
							},
							message: `Пользователь ${userData.name} успешно удален!` 
						};
						if(callback) callback(res);
					});
				});
			} else {
				res = {
					status: 'info',
					message: 'Недостаточно прав для выполнения операции.'
				};
				if(callback) callback(res);
			}
		});
	}

	,getUsersList(admin, callback) {
		Mongo.select(admin, 'users', data => {
			if(data.length) {
				Mongo.select({}, 'users', data => {
					data = data.filter(elem  => !elem.admin)
					data = data.map(({
						name,
						regDate,
						maxBotAmount,
						expirationDate,
						tariffs,
						walletAddress,
						walletBalance,
						active,
						userId,
						bots
					}) => {
						return {
							name: name,
							regDate: regDate,
							maxBotAmount: maxBotAmount,
							expirationDate: expirationDate, 
							tariffs,
							walletAddress,
							walletBalance,
							active,
							userId,
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

	,async create(user, collection, callback) {
		let salt = md5(this.genSalt()),
			name = user.name,
			userId = uniqid(US),
			password = md5(salt + user.password + salt),
			admin = (user.admin) ? true : false,
			regDate = Date.now(),
			month = 2592000000,
			expirationDate = regDate/* + month*/,
			walletAddress = await Balance.createWallet({userId: userId});

			User = {
				name: name
				,userId: userId
				,regDate: regDate
				,expirationDate: expirationDate
				,password: password
				,salt: salt
				,admin: admin
				,ordersList: {}
				,tariffs: []
				,bots: []
				,maxBotAmount: 0
				,regKey: md5(Users.genSalt(16))
				,active: false
				,walletAddress: walletAddress || ''
				,walletBalance: 0
				,binanceAPI: {
					name: null,
					key: null,
					secret: null,
					options: null
				}
			}

		this.find( { name: name }, collection, (data) => {

			if (!data.length) {
				Mongo.insert({ name: User.name, userId: User.userId }, CONSTANTS.USERS_DATA_COLLECTION, data => console.log(data, "ISERT TO USERSDATA"));
				Mongo.insert(User, collection, callback);

				// Mailer.send({
                //     html : Templates.getRegistrationMail(user)
                //     ,subject : "Registrating in TradeBots"
				// 	,to: user.name
				// });

				Mailer.send({
					from: 'potato_1234@mail.ru'
					,to: user.name
					,subject: 'Testing'
					,html: Templates.getUserActivationHtml(User.regKey)
				});

			} else {
				callback({ status: 'error', message: "Такой пользователь уже существует!" });
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

	,getMaxBotAmount(user = {}, callback = (data = {}) => {}) {
		if(user.name) {
			Mongo.select(user, CONSTANTS.USERS_COLLECTION, data => {
				if(data.length) {
					data = data[0];
					let res = {
						status: 'ok',
						data: {
							maxBotAmount: data.maxBotAmount
						}
					};
					callback(res);

				} else {
					callback({
						status: 'error',
						message: 'Такого пользователя не существует'
					});
				}
			});
		} else callback({status: 'error'});
	}

	,getEmail(user = {}, callback) {
		if(user.name) {
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
		} else callback({status: 'error'});
	}

	,setBinance(user, binanceData, callback) {
		Mongo.select(user, 'users', (data) => { 

			if(data.length) {
				data = data[0];
				if(!binanceData) binanceData = {};

				if(binanceData && binanceData.name) {
					let c = binanceAPI({
						apiKey: binanceData.key,
						apiSecret: binanceData.secret
					});

					c.accountInfo()
						.then(result => {
							if(result.balances) {
								binanceData.data = {
									name: data.name,
									regDate: data.regDate
								}
								Mongo.update(user, { binanceAPI: new Binance(binanceData) }, CONSTANTS.USERS_COLLECTION, d => {
									callback({status: 'ok', message: 'Ключи успешно сохранены.'});
								});


							} else callback({status: 'error', message: 'Невалидные ключи!'});
						})
						.catch(err => {
							callback({
								status: 'error',
								message: 'Произошла ошибка при проверке бинанс ключей',
								error: err
							});
						});
				} else {
					Mongo.update(user, { binanceAPI: {} }, CONSTANTS.USERS_COLLECTION, d => {
						callback({status: 'ok', message: 'Невалидные ключи!'});
					});
				}

			} else {
				callback({
					status: 'error',
					message: 'Пользователь не найден!'
				});
			}
		});
	}

	,getBinance(user, callback) {
		Mongo.select(user, 'users', (data) => {
			if(data.length) {
				data = data[0];
				let retData = {};
				if(data.binanceAPI && data.binanceAPI.key) {
					retData = {
						name: data.binanceAPI.name,
						key: Crypto.decipher(data.binanceAPI.key, Crypto.getKey(data.regDate, data.name)),
						secret: '***'
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

		,async setBotsArray() {
			let users = await Mongo.syncSelect({}, 'users');
			users.forEach(user => {
				for (let i = 0; i < user.bots.length; i++) {
					let bot = Object.assign({}, user.bots[i]);
					bot = new Bot(bot);
					bot.continueTrade(user);
					this.Bots.push(bot);
				}
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

		,async getBotLog(user = {}, botData = '', callback = () => {}) {
			if(user.name && botData.botID) {
				let userId = await Mongo.syncSelect(user, CONSTANTS.USERS_COLLECTION);
				if(userId.length) {
					userId = userId[0].userId;
					let processesLog = [];
					for(let i = 0; i < botData.processes.length; i++) {
						let path = Logger.getPath(`/Users/${user.name}(${userId})/${botData.botID}/${botData.processes[i]}/log.txt`);
						let fileData = Logger.syncRead(path);
						processesLog.push({
							processeId: botData.processes[i],
							log: fileData
						});
					}
					callback({status: 'ok', data: processesLog});


				} else {
					callback({status: 'error', message: 'Пользователь не найден или неккоректный botID', botID: botID});
				}
			} else {
				callback({status: 'error', message: 'Пользователь не найден или неккоректный botID', botID: botID});
			}
		}

		,getBotList(user, callback = (data = {}) => {}) {
			Mongo.select(user, 'users', (data) => {
				if(data.length) {
					data = data[0];
					let bots = [];
					data.bots.forEach(bot => {
						if(!bot.isDeleted) bots.push(bot);
					});
					callback({
						status: 'ok',
						data: bots
					});
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
						let res = {
							status: 'ok',
							message: `Новый бот успешно создан (${tempBot.botID})`,
							data: tempBot
						};
						callback(res);
					});
				}
				else {
					console.log("---------------------DELTEBOT");
					let tempBots = [];
					data.bots.forEach(bot => {
						if(bot.botID !== botData) tempBots.push(bot);
					});
					data.bots = tempBots;
					
					const index = this.Bots.findIndex(bot => {
						return bot.botID === botData
					});
					if(index >= 0) {
						this.Bots[index].deleteBot(user)
							.then(res => {
								if(res.status === 'ok') {
									this.Bots.splice(index, 1);
									// Mongo.update(user, {bots: data.bots}, 'users', (data) => {
									// 	let res = {
									// 		status: 'ok',
									// 		message: `Бот ${botData.botID} успешно удален`,
									// 		data: botData
									// 	};
									// 	callback(res);
									// });
								}
							})
					} else {
						let res = {
							status: 'error',
							message: `Ошибка при удалении бота`,
							index: index,
							data: botData
						};
						callback(res);
					}
				}
			});
		}

		,updateBot(user, botData, callback) {
			// if(callback) callback({
			// 	status: 'error',
			// 	message: 'на данный момент этот функционал не работает.'
			// })
			Mongo.select(user, 'users', (data) => {
				if(data.length) {
					data = data[0];
					let tempBot = new Bot(botData);
					const index = data.bots.findIndex(bot => bot.botID === tempBot.botID);
					const newIndex = this.Bots.findIndex(bot => bot.botID === tempBot.botID);
	
					this.Bots[newIndex].updateLocalBot(tempBot, d => {
						let changeObj = {},
							change = `bots.${index}`;
						
						changeObj[change] = d.data;
						if(d.status === 'ok') {
							Mongo.update(user, changeObj, 'users', (data) => {
								if(callback) callback(d);
							});
						} else {
							if(callback) callback(d);
						}
					});
				} else {
					callback({
						status: 'error',
						message: 'Пользователь не найден. Невозможно обновить бота.'
					});
				}
			});
		}

		,setStatus(user, botData, callback) {
			try {
				Mongo.select(user, 'users', (data) => {
					data = data[0]

					const index = this.Bots.findIndex(bot => bot.botID === botData.botID)
					this.Bots[index].changeStatus(botData.status, data)
						.then( d => callback(d));

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
					.then(d => callback(d))
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

		,cancelAllOrdersWithoutSell(user = {}, reqData = {}, callback = (data = {}) => {}) {
			console.log('CANCEL ALL ORDERS WITHOUT SELL______________________________________________________________________');
			try {
				Mongo.select(user, CONSTANTS.USERS_COLLECTION, userData => {
					if(userData.length) {
						userData = userData[0];
						const index = this.Bots.findIndex(bot => bot.botID === reqData.botID);
						this.Bots[index].cancelAllOrdersWithoutSell(user, reqData.processeId)
							.then(d => callback(d))
							.catch(error =>
								callback({
									status: 'error',
									error: error,
									message: 'Завершение всех ордеров прошло неудачно'
								}));
					} else {
						callback({
							status: 'error',
							message: 'Пользователь не найден.'
						});
					}
				});
			} catch(error) {
				callback({
					status: 'error',
					message: error
				})
			}
		}

		,cancelAllOrders(user, reqData, callback) {
			console.log('CANCEL ALL ORDERS ______________________________________________________________________')
			try {
				Mongo.select(user, 'users', (data) => {
					data = data[0]
					// const index = data.bots.findIndex(bot => bot.botID === reqData.botID)
					// let bot = new Bot(data.bots[index], data)
					const index = this.Bots.findIndex(bot => bot.botID === reqData.botID)
					this.Bots[index].cancelAllOrders(user, reqData.processeId)
						.then(d => {
							callback(d);
						})
						.catch(error => {
							callback({
								status: 'error',
								message: error
							});
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
		get(user, callback = (data = {}) => console.log(data)) {
			Mongo.select(user, CONSTANTS.USERS_COLLECTION, data => {
				
				if(data.length) {
					data = data[0];
					const ordersList = data.ordersList;
					let Income = {
						dayIncome: this.coutDayIncome(ordersList),
						allIncome: this.countAllIncome(ordersList)
					};
	
					const res = {
						status: 'ok',
						data: {
							income: Income
						}
					};
					
					if(callback) callback(res)
					// callback(data);
				} else {
					callback({
						status: 'error',
						message: 'Пользователь не найден.'
					});
				}
				
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
			try {
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
			} catch(err) {
				console.log(err);
				return {};
			}
		},

		setSymbolIncome(income = {}, order = {}) {
			try {
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
				
				if(order.side === CONSTANTS.ORDER_SIDE.BUY && order.status === CONSTANTS.ORDER_STATUS.FILLED) {
					income[curSymbol].value -= Number(order.cummulativeQuoteQty);
				}
				else if(order.side === CONSTANTS.ORDER_SIDE.SELL && order.status === CONSTANTS.ORDER_STATUS.FILLED) {
					income[curSymbol].value  += Number(order.cummulativeQuoteQty);
				}

				return income;
			} catch(err) {
				return {};
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

		return {
			status: 'ok',
			data: statistics
		}
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

	,genSalt(size = 8) {
		let salt = "",
			code = 0;

		for (let i = 0; i < size; i++) {
			code = Math.round(Math.random() * 76 + 48);
			salt += String.fromCharCode(code);
		}

		return salt;
	}
}

module.exports = Users;
