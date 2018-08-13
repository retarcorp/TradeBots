var express = require('express');
var Users = require('../modules/Users');
var router = express.Router();

router.use('/*', (req, res, next) => {
	if(!(req.cookies.user || req.session.user)){
	}
	next();
});

//BinanceAPI page
router.post('/account/api', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	let binanceData = {
		name: req.body.name,
		key: req.body.key,
		secret: req.body.secret
	};
	Users.setBinance(user, binanceData, data => res.send(data));
});

router.delete('/account/api', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	Users.setBinance(user, null, data => res.send(data));
});
//BinanceAPI end


module.exports = router;