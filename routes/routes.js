const express = require('express');
const router = express.Router();
const account = require('./account');
const admin = require('./admin');
const bots = require('./bots');
const signin = require('./signin');
const signup = require('./signup');
const statistics = require('./statistics');
const symbolsList = require('./symbolsList');
const income = require('./income');
const tariffs = require('./tariffs');
const userActivation = require('./userActivation');

const Mongo = require('../modules/Mongo');
const url = require('url');
const qrs = require('querystring');
const Tariffs = require('../modules/Tariffs');
const binanceAPI = require('binance-api-node').default;
// const uniqid = require('uniqid');

router.use(account);
router.use(admin);
router.use(bots);
router.use(signin);
router.use(signup);
router.use(statistics);
router.use(symbolsList);
router.use(income);
router.use(tariffs);
router.use(userActivation);

router.get('/test', (req, res, next) => {
	const query = qrs.parse(url.parse(req.url).query);
	

	res.send(query);
	// let admin = req.cookies.admin;
	// Tariffs.setTariff(admin, {title: 'ЯЯЯ'}, data => res.json(data));
	// Tariffs.removeTariff(admin, {title: 'aa'}, data => res.json(data));
	// Tariffs.getTariffList(admin, data => res.json(data));
	// let n = { title: 'untitled tariff',
	// 	tariffId: 'TF-jmvxcyg6',
	// 	price: 100,
	// 	maxBotAmount: 1,
	// 	expirationDate: 90 }
	// Tariffs.editTariff(admin, n, data => res.json(data));
	// let user = {name: req.cookies.user.name};

	// Mongo.update(user, {'bots.0': -1}, 'users', d => res.json(d));
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