const Mongo = require('./Mongo');
const CONSTANTS = require('../constants');

class MDBLogger {

	constructor() {

	}

	info(mess = '') {
		let _log = {
			message: mess,
			level: 'info'
		};
		this.saveLog(_log);
	}

	error(mess = '') {
		let _log = {
			message: mess,
			level: 'error'
		};
		this.saveLog(_log);
	}

	saveLog(_log = {}) {
		Mongo.insert(_log, CONSTANTS.LOGS_COLLECTIONS);
	}
}

let newMDBLogger = new MDBLogger();

module.exports = newMDBLogger;