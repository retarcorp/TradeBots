var express = require('express');
var router = express.Router();

var Users = require('../modules/Users');

router.get('/registration', (req, res, next) => {
	res.sendFile('registration.html', { root: 'public/'});
});

router.post('/registration', (req, res, next) => {
	let user = {
		password: req.body.pass
		,name: req.body.email
	}

	Users.create(user, 'users', (data) => {
		res.send(JSON.stringify( data ));
	});
	// console.log(req.body)
});

module.exports = router;