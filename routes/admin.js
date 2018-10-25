var express = require('express');
var router = express.Router();
let Users = require('../modules/Users');

router.get('/api/admin/signout', (req, res, next) => {
	Users.closeSession(req, res, (err) => {
        if (err) console.log(err);

        res.clearCookie("admin");
        res.send({
			status: 'ok'
		});
    });
});

router.post('/api/admin/signin', (req, res, next) => {
	let admin = req.body;
	Users.find(admin, 'users', data => {
		if (data.length) {
			if (Users.checkCredentials(data[0], admin)) {
				Users.createAdminSession(req, res, next, data[0], (data) => {
					res.send({status: 'ok', data: { email: data.name }});
				});
			} else {
				res.send({status: 'error', message: 'Error: Check your login or password!'});
			}
		} else {
			res.send({status: 'error', message: 'Admin not found' });
		}
	});
});

router.get('/api/admin/getUsersList', (req, res, next) => {
	let admin = req.cookies.admin;
	Users.getUsersList(admin, data => res.json(data));
});

router.post('/api/admin/deleteUser', (req, res, next) => {
	let admin = req.cookies.admin;
	Users.deleteUser(admin, req.body, data => res.json(data));
});

router.post('/api/admin/changeUserData', (req, res, next) => {
	let admin = req.cookies.admin;
	Users.changeUserData(admin, req.body, data => res.send(data));
});

router.post('/api/admin/signinAsUser', (req, res, next) => {
	res.json({
		status: 'ok'
	});
});

router.get('/api/admin/getWallet', (req, res, next) => {
	let admin = req.cookies.admin;
	Users.getWalletInfo(admin, data => res.send(data));
});

module.exports = router;