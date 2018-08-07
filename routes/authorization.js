var express = require('express');
var router = express.Router();

var Users = require('../modules/Users');

router.get('/authorization', (req, res, next) => {
	if(req.cookies.user || req.session.user){
		res.redirect(303, '/');
	}
	res.sendFile('authorization.html', { root: 'public/'});
});

router.get('/authorization/logout', (req, res, next) => {
	Users.closeSession(req, res, (err) => {
        if (err) console.log(err);

        res.clearCookie("user");
        res.redirect('/');
    });
});

router.post('/authorization', (req, res, next) => {
	let user = {
		password: req.body.pass
		,name: req.body.email
	}
	Users.find(user, 'users', (data) => {
		if (data.length) {
			if (Users.checkCredentials(data[0], user)) {
				Users.createSession(req, res, next, data[0], (data) => {
					res.redirect(303, '/');
					// res.send({status: true});
				});
			} else {
				res.redirect('/authorization');
				// res.send({status: false, message: 'Error: Check your login or password!'});
			}
		} else {
			res.redirect('/registration');
			// res.send({status: false, message: 'User not found' });
		}
	});
});

module.exports = router;