var express = require('express');
// var Mongo = require('../modules/Mongo');
// var Crypto = require('../modules/Crypto');
var Users = require('../modules/Users');
var router = express.Router();

router.use('/*', (req, res, next) => {
	if(!(req.cookies.user || req.session.user)){
		return res.redirect(303, '/');
	}
	next();
});

router.get('/account', (req, res, next) => {
	res.sendFile('account.html', { root: 'public/' });
});

router.post('/account/api', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	let binanceData = {
		name: req.body.name,
		key: req.body.key,
		secret: req.body.secret
	};
	Users.setBinance(user, binanceData, data => res.send(data));
});

router.delete('/account/api', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	Users.setBinance(user, null, data => res.send(data));
});

module.exports = router;