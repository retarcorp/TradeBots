const Mongo = require('../modules/Mongo');
const CONSTANTS = require('../constants');
const User = require('../modules/Users');
const readline = require('readline');
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

Mongo.init().then( () => {
	let name = 'trade.bots.info@gmail.com';
	let password = '?bXRk#TqZN7#k%1';

	rl.question('Введите логин админа: ', (answer = '') => {

		if(answer) {
			name = answer;
		} else {
			console.log('логин админа по умолчанию - trade.bots.info@gmail.com');
		}

		rl.question('Введите пароль админа: ', (answer = '') => {

			if(answer) {
				password = answer;
			} else {
				console.log('пароль админа по умолчанию - ?bXRk#TqZN7#k%1');
			}

			User.create({ name, password, admin: true}, CONSTANTS.USERS_COLLECTION, data => {
				if(data.status !== 'error') {
					console.log('админ создан');
				} else {
					console.log(data)
				}
			})

		});
	})



});