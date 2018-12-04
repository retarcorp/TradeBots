const Mongo = require('../modules/Mongo');
const CONSTANTS = require('../constants');
const readline = require('readline');
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
Mongo.init().then(d => {
	Mongo.select({}, 'users', users => {

		rl.question("Введите имя пользователя, чьи процессы хотите очистить: ", answer => {

			if(answer.length) {

				Mongo.select({ name: answer }, CONSTANTS.USERS_COLLECTION, userData => {

					if(userData.length && (userData = userData[0])) {

						let amountComplited = 0;
						if(userData.bots.length) {
							for (let i = 0; i < userData.bots.length; i++) {
								console.log();
								console.log(userData.name, userData.bots[i].title,  userData.bots[i].botID, Object.keys(userData.bots[i].processes).length);
								userData.bots[i].processes = {};
								userData.bots[i].status = false;
								console.log(userData.name, userData.bots[i].title, userData.bots[i].botID, Object.keys(userData.bots[i].processes).length);
							}
							amountComplited++;
							Mongo.update({name: userData.name}, {bots: userData.bots}, CONSTANTS.USERS_COLLECTION, (res) => {console.log(userData.name, 'ok', 'amountComplited - ' + amountComplited)});
						} else {
							console.log('Процессов и так нет')
						}

					} else {
						console.log('Пользователь не найден');
					}

				});


			} else {
				console.log('Неверно введены данные.');
			}

		});
	});
});