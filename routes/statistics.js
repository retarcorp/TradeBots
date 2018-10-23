var express = require('express');
let Users = require('../modules/Users');
let Statistics = require('../modules/Statistics');
var router = express.Router();

router.get('/api/user/getStatistics', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	Statistics.getUserStatistic(user, data => res.json(data));
	// Users.getClientStatistics(user, data => res.json(data))

});

module.exports = router;