const express = require('express');
const crypto = require('crypto');

module.exports = {

	ALGORITHM: 'aes192'

	,cipher(data, key) {
		const cipher = crypto.createCipher(this.ALGORITHM, key);
		let encrypted = cipher.update(data, 'utf8', 'hex');
		
		encrypted += cipher.final('hex');
		return encrypted;
	}

	,decipher(data, key) {
		const decipher = crypto.createDecipher(this.ALGORITHM, key);
		const encrypted = data;
		let decrypted = decipher.update(encrypted, 'hex', 'utf8');
		decrypted += decipher.final('utf8');
		return decrypted;
	}
}