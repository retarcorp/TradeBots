const Mongo = require('./Mongo');
const file = './logger.txt';
const fs = require('fs');

var lineReader = require('readline').createInterface({
		input: fs.createReadStream(file)
	});	

class LoggerViewer {

	constructor() {
		this.lines = [];
	}

	getLogData() {
		lineReader.on('line', (line) => {
			this.lines.push(line);
		});
	}

	getLastLine(lineInd = 0, callback = () => {}) {
		callback(this.lines[lineInd]);
	}

};

const newLV = new LoggerViewer();
newLV.getLogData();

module.exports = newLV;