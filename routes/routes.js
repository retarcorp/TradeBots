var express = require('express');
var router = express.Router();
const account = require('./account');
const admin = require('./admin');
const bots = require('./bots');
const signin = require('./signin');
const signup = require('./signup');
const statistics = require('./statistics');
const symbolsList = require('./symbolsList');
const income = require('./income');
// const Mongo = require('../modules/Mongo');
// const uniqid = require('uniqid');

router.use(account);
router.use(admin);
router.use(bots);
router.use(signin);
router.use(signup);
router.use(statistics);
router.use(symbolsList);
router.use(income);

router.get('/test', (req, res, next) => {
	// let change = {},
	// 	l = `binanceAPI.na${'m'}e`
	// change[l] = 'asdasd';
	// Mongo.update({name: 'q@q.q'}, change, 'users', data => res.json(data))


	// res.json({
	// 	a: uniqid(),
	// 	a1: uniqid('asd'),
	// 	b: uniqid.process(),
	// 	b1: uniqid.process('asd'),
	// 	c: uniqid.time(),
	// 	c1: uniqid.time('asd')
	// });
})


module.exports = router;