const CONSTANTS = require('../constants');
const Mongo = require('./Mongo');
const HISTORY_LOG = CONSTANTS.HISTORY_LOG;

class HistoryLog {
	async _log({
		message = '',
		data = {}
	}) {
		let date = this.getDate(),
			nextHlog = {};
		
		nextHlog.date = date;
		nextHlog.message = message;
		nextHlog.data = data;

		await this.insertHlog(nextHlog);
	}

	async insertHlog(nextHlog = {}) {
		try {
			await Mongo.syncInsert(nextHlog, HISTORY_LOG);
		} catch(err) {
			console.log(err);
		}
	}

	getDate(date = Date.now()) {
		date = new Date(date);
		let hh = String(date.getHours()),
			ss = String(date.getSeconds()),
			DD = String(date.getDay()),
			mm = String(date.getMinutes()),
			MM = String(date.getMonth()),
			YYYY = date.getFullYear();

		hh = hh.length < 2 ? '0' + hh : hh;
		mm = mm.length < 2 ? '0' + mm : mm;
		ss = ss.length < 2 ? '0' + ss : ss;
		DD = DD.length < 2 ? '0' + DD : DD;
		MM = MM.length < 2 ? '0' + MM : MM;

		return `${hh}:${mm}:${ss} ${DD}.${MM}.${YYYY}`;
	}
};

module.exports = new HistoryLog();