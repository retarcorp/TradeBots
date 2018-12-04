const Mongo = require('../modules/Mongo');
const Balance = require('../modules/Balance');
const CONSTANTS = require('../constants');

Mongo.init().then(() => {
	console.log('start address redefinition...');
	Mongo.drop(CONSTANTS.LOGS_COLLECTIONS, res => {
		console.log(res);
		console.log('логи успешно очищены');
	});
});
