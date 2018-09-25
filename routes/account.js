var express = require('express');
var Users = require('../modules/Users');
var router = express.Router();

router.get('/account/api', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	Users.getBinance(user, data => res.json(data));
});

router.post('/account/api', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	console.log(req.body)
	Users.setBinance(user, req.body, data => res.json(data));
});

router.delete('/account/api', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	Users.setBinance(user, null, data => res.json({status: 'ok'}));
});

router.get('/api/account/getEmail', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	Users.getEmail(user, data => res.json(data));
});

router.post('/api/account/setNewPassword', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	Users.setNewPassword(user, req.body, data => res.json(data));
});

module.exports = router;