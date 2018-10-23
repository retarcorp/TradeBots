const { logger } = require('../config/config');
const fs = require('fs');
const mkdirp = require('mkdirp');


class Logger {
	constructor() {
	}

	getPath(path = '') {
		return logger.root + path;
	}

	syncAppend(path = logger.trash_root, file = logger.trash_file, data = '') {
		mkdirp.sync(path)
		if(path === logger.trash_root) path += "/Trash.txt";
		else path += file;
		
		return fs.appendFileSync(path, data);
	}

	append(path = logger.trash_root, file = logger.trash_file,  data = '') {
		return new Promise((resolve, reject) => {
			mkdirp.sync(path)
			if(path === logger.trash_root) path += "/Trash.txt";
			else path += file;

			let fileData = data
			try {
				fileData = fs.readFileSync(path, logger.utf8);
				fileData = fileData.split('\r\n').reverse();
				let sentence = fileData[0].split('  ')[1];
				let dataT = data.split('  ')[1];
	
				if(dataT === sentence) {
					data = data.replace('\r\n', '');
					fileData[0] = data;
					fileData = fileData.reverse().join('\r\n');
				}  else {
					fileData = fileData.reverse();
					fileData.push(data);
					fileData = fileData.join('\r\n');
				}
			} catch(err) {
				console.log(err);
			}
			
			fs.writeFile(path, fileData, (err) => {
				if(err) reject({status: "error", error: err});
				resolve({status: 'ok'});
			});
		});
	}

	syncWrite(path = logger.trash_root, file = logger.trash_file, data = '') {
		mkdirp.sync(path)
		if(path === logger.trash_root) path += "/Trash.txt";
		else path += file;

		return fs.writeFileSync(path, data);
	}

	write(path = logger.trash_root, file = logger.trash_file, data = '') {
		return new Promise((resolve, reject) => {
			mkdirp.sync(path)
			if(path === logger.trash_root) path += "/Trash.txt";
			else path += file;

			fs.writeFile(path, data, (err) => {
				if(err) reject({status: "error", error: err});
				resolve({status: 'ok'});
			});
		});
	}

	syncRead(path = logger.trash_root) {
		if(path === logger.trash_root) path += "/Trash.txt";
		try {
			return fs.readFileSync(path, logger.utf8);
		} catch(err) {
			console.log(err);
			return "";
		}
	}

	read(path = logger.trash_root) {
		return new Promise((resolve, reject) => {
			if(path === logger.trash_root) path += "/Trash.txt";
			fs.readFile(path, logger.utf8, (err, data) => {
				if(err) reject({status: "error", error: err});
				resolve({status: 'ok', data: data});
			});
		});
	}

}

module.exports = new Logger();