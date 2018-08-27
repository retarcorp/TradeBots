var express = require('express');
let Users = require('../modules/Users');
var router = express.Router();

router.get('/statistics', (req, res, next) => {
	let user = {name: req.cookies.user.name}
	Users.getClientStatistics(user, data => res.json(data))
});

module.exports = router;