var express = require('express');
var Mongo = require('../modules/Mongo');
var router = express.Router();

router.get('/account', (req, res, next) => {
	if(!(req.cookies.user || req.session.user)){
		return res.redirect(303, '/registration')
	}
	res.sendFile('account.html', { root: 'public/' });
});

router.post('/account/api', (req, res, next) => {
	// let obj = {
	// 	name: req.body.name
	// 	,key: Crypto.cipher(req.body.key, 'key')
	// }
	let keys = req.body;
	let user = {name: req.cookies.user.name};
	console.log(user, keys)
	Mongo.select(user, 'users', (data) => {
		data = data[0];
		data.keys = keys;
		console.log(data);
		Mongo.update({name: data.name}, data, 'users', (data) => {
			res.send(JSON.stringify( data ));
		});
	})
});

router.delete('/account/api', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	Mongo.select(user, 'users', (data) => {
		data = data[0];
		data.keys = {};
		Mongo.update({name: data.name}, data, 'users', (data) => {
			res.send(JSON.stringify( data ));
		});
	})
});

module.exports = router;