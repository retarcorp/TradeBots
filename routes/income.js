let express = require('express');
var router = express.Router();
// let Users = require('../modules/Users');
let Income = require('../modules/Income');

router.get('/api/income/getUserIncome', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	Income.getUserIncome(user, data => res.json(data));
});

router.get('/api/income/getAllUsersIncome', (req, res, next) => {
	let admin = req.cookies.admin;
	Income.getAllUsersIncome(admin, data => res.json(data));
});

module.exports = router;