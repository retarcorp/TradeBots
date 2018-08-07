var express = require('express');
var router = express.Router();

var Users = require('../modules/Users');

router.get('/authorization', (req, res, next) => {
	console.log('auth get')
	res.sendFile('authorization.html', { root: 'public/'});
});

router.post('/authorization', (req, res, next) => {
	console.log('auth post')
	console.log(req.body)
	let user = {
		password: req.body.pass
		,name: req.body.email
	}
	Users.find(user, 'users', (data) => {
		console.log('мы поискали и решили что')
		if (data.length) {
			if (Users.checkCredentials(data[0], user)) {
				Users.createSession(req, res, next, data[0], (data) => {
					console.log(req.session.user)
					res.send({status: true});
				});
			} else {
				res.send({status: false, message: 'Error: Check your login or password!'});
			}
		} else {
			res.send({status: false, message: 'User not found' });
		}
	});
});

module.exports = router;