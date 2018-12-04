const Mongo = require('../modules/Mongo');
const CONSTANTS = require('../constants');
const User = require('../modules/Users');
const readline = require('readline');
const { mailer } = require('../config/config');
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

Mongo.init().then( () => {
	let name = mailer.user;
	let password = mailer.pass;

	rl.question('Введите логин админа: ', (answer = '') => {

		if(answer) {
			name = answer;
		} else {
			console.log('логин админа по умолчанию - ' + name);
		}

		rl.question('Введите пароль админа: ', (answer = '') => {

			if(answer) {
				password = answer;
			} else {
				console.log('пароль админа по умолчанию - ' + password);
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