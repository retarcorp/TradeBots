var express = require('express');
var Users = require('../modules/Users');
var router = express.Router();
let HistoryLog = require('../modules/HistoryLog');
let log = (data) => HistoryLog._log(data);

router.get('/account/api', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	Users.getBinance(user, data => {
		// log(data);
		res.json(data);
	});
});

router.post('/account/api', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	Users.setBinance(user, req.body, data => {
		log(data);
		res.json(data);
	});
});

router.delete('/account/api', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	Users.setBinance(user, null, data => {
		log(data);
		res.json(data);
	});
});

router.get('/api/account/getEmail', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	Users.getEmail(user, data => {
		// log(data);
		res.json(data);
	});
});

router.post('/api/account/setNewPassword', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	Users.setNewPassword(user, req.body, data => {
		// log(data);
		res.json(data);
	});
});

module.exports = router;