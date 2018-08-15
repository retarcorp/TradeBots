var md5 = require('md5');

var Mongo = require('./Mongo');
var Bot = require('../modules/Bot');
var Crypto = require('./Crypto');
var Binance = require('./Binance');

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
					secret: '***'
				}
			}
			if(callback) callback({
				status: 'ok',
				data: retData
			});
		});
	}

	,Bots: {
		getBotList(user, callback) {
			Mongo.select(user, 'users', (data) => {
				data = data[0];
				if(callback) 
					callback({
						status: 'ok',
						data: data.bots || []
					});
			});
		}
		
		,setBot(user, botData, callback) {
			Mongo.select(user, 'users', (data) => {
				data = data[0];
				let tempBot;
				console.log(botData);
				if(typeof botData === 'object'){
					tempBot = new Bot(botData);
					data.bots.push(tempBot);
				}
				else {
					let tempBots = [];
					data.bots.forEach(bot => {
						if(bot.botID !== botData) tempBots.push(bot);
					});
					data.bots = tempBots;
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
				const index = data.bots.findIndex(bot => {
					return bot.botID === tempBot.botID
				});
				data.bots[index] = tempBot;
				Mongo.update({name: data.name}, data, 'users', (data) => {
					callback({
						status: 'ok',
						data: tempBot
					});
				});
			});
		}

		,setStatus(user, botData, callback) {
			Mongo.select(user, 'users', (data) => {
				data = data[0]
				const index = data.bots.findIndex(bot => bot.botID === botData.botID)
				data.bots[index] = new Bot(data.bots[index]);
				data.bots[index].changeStatus(botData.status)
				Mongo.update({name: data.name}, data, 'users', (data) => {
					callback({
						status: 'ok',
						data: { status: botData.status }
					})
				})
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
		console.log(user1, session)
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