const Mongo = require('./Mongo');
// const file = './logger.txt';
const fs = require('fs');
const LOGS = require('../constants').LOGS_COLLECTIONS;

// var lineReader = require('readline').createInterface({
// 		input: fs.createReadStream(file)
// 	});	

class LoggerViewer {

	constructor() {
		this.lines = [];
	}

	syncLogData() {
		Mongo.select({}, LOGS, data => {
			this.lines = data;
		});
		setTimeout(() => {
			this.syncLogData();
		}, 100000);
	}

	getLogData({start = 0, end = 10}, callback = () => {}) {
		let resData = [];
		for (let i = start; i <= end; i++) {
			if(this.lines[i]) {
				resData.push(this.lines[i]);
			} else {
				break;
			}
		}
		callback({
			status: 'ok',
			amount: resData.length,
			data: resData
		});
	}
};

const newLV = new LoggerViewer();
// newLV.getLogData();

module.exports = newLV;