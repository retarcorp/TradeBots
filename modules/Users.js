var md5 = require('md5');

var Mongo = require('./Mongo');
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
				callback({ status: false, message: "User already exist!" });
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
				callback(data);
			});
		});
	}

	,getBinance(user, callback) {
		Mongo.select(user, 'users', (data) => {
			data = data[0];
			if(callback) callback({
				api: data.binanceAPI,
				name: data.name,
				regDate: data.regDate
			});
		});
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

		if (!req.cookies.user)
			res.cookie('user', user1);

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