var express = require('express');
var Users = require('../modules/Users');
var router = express.Router();

router.use('/*', (req, res, next) => {
	if(!(req.cookies.user || req.session.user)){}
	next();
});

//BinanceAPI page
router.get('/account/api', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	Users.getBinance(user, data => res.json(data));
});

router.post('/account/api', (req, res, next) => {
	console.log(req.body)
	let user = {name: req.cookies.user.name};
	// let binanceData = {
	// 	name: req.body.name,
	// 	key: req.body.key,
	// 	secret: req.body.secret
	// };
	Users.setBinance(user, req.body, data => res.send(data));
});

router.delete('/account/api', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	Users.setBinance(user, null, data => res.send({status: 'ok'}));
});
//BinanceAPI end


module.exports = router;