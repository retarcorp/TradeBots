const express = require('express');
const crypto = require('crypto');
var md5 = require('md5');

module.exports = {

	ALGORITHM: 'aes192'

	,getKey(date, email) {
		return md5(date + email);
	}

	,cipher(data, key) {
		const cipher = crypto.createCipher(this.ALGORITHM, key);
		let encrypted = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
		return encrypted;
	}

	,decipher(data, key) {
		const decipher = crypto.createDecipher(this.ALGORITHM, key);
		let decrypted = decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
		return decrypted;
	}
}