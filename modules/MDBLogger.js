const Mongo = require('./Mongo');
const CONSTANTS = require('../constants');

class MDBLogger {

	constructor() {

	}

	getDate(time = Date.now()) {
		time = new Date(time);
		let d = new Date().getUTCDate();
		let h = new Date().getUTCHours();
		let m = new Date().getUTCMinutes();
		let y = new Date().getUTCFullYear();
		let M = new Date().getUTCMonth() + 1;
		let s = new Date().getUTCSeconds();
		return `${h}:${m}:${s} ${d}/${M}/${y}`;
	}

	info(mess = '') {
		let _log = {
			message: mess,
			time: this.getDate(),
			level: 'info'
		};
		this.saveLog(_log);
	}

	error(mess = '') {
		let _log = {
			message: mess,
			time: this.getDate(),
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