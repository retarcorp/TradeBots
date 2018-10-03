var express = require('express');
var router = express.Router();

var Users = require('../modules/Users');


router.get('/signout', (req, res, next) => {
	Users.closeSession(req, res, (err) => {
        if (err) console.log(err);

        res.clearCookie("user");
        res.send({
			status: 'ok'
		});
    });
});

router.post('/signin', (req, res, next) => {
	let user = {
		password: req.body.password,
		name: req.body.email
	}
	Users.find(user, 'users', (data) => {
		if (data.length) {
			if (Users.checkCredentials(data[0], user)) {
				Users.createSession(req, res, next, data[0], (data) => {
					res.send({status: 'ok', data: { email: data.name }});
				});
			} else {
				res.send({status: 'error', message: 'Ошибка: введен неверный логин или пароль.'});
			}
		} else {
			res.send({status: 'error', message: 'Пользователь не найден.' });
		}
	});
});

module.exports = router;