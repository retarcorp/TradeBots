var express = require('express');
var router = express.Router();

var Users = require('../modules/Users');

router.post('/signup', (req, res, next) => {
	let user = {
		password: req.body.password,
		name: req.body.name
	}
	Users.create(user, 'users', (data) => {
		res.send(data);
	});
	
});

module.exports = router;