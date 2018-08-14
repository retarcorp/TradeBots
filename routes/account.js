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
	Users.setBinance(user, req.body, data => res.send(data));
});

router.delete('/account/api', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	Users.setBinance(user, null, data => res.send({status: 'ok'}));
});

module.exports = router;