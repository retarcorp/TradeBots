var express = require('express');
var Mongo = require('../modules/Mongo');
var Crypto = require('../modules/Crypto');
var router = express.Router();

router.get('/account', (req, res, next) => {
	if(!(req.cookies.user || req.session.user)){
		return res.redirect(303, '/registration')
	}
	res.sendFile('account.html', { root: 'public/' });
});

router.post('/account/api', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	Mongo.select(user, 'users', (data) => {
		data = data[0];
		data.binanseAPI = {
			name: req.body.name
			,key: Crypto.cipher(req.body.key, Crypto.getKey(data.regDate, data.name))
			,secret: Crypto.cipher(req.body.secret, Crypto.getKey(data.regDate, data.name))
		};
		Mongo.update({name: data.name}, data, 'users', (data) => {
		res.send(200/*JSON.stringify( data )*/);
		});
	})
});

router.delete('/account/api', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	Mongo.select(user, 'users', (data) => {
		data = data[0];
		data.binanseAPI = {};
		Mongo.update({name: data.name}, data, 'users', (data) => {
			res.send(200/*JSON.stringify( data )*/);
		});
	})
});

module.exports = router;