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
const bitaps = require('./bitaps');
const pages = require('./pages');
const rp = require('request-promise');


const Mongo = require('../modules/Mongo');
const url = require('url');
const qrs = require('querystring');
const Tariffs = require('../modules/Tariffs');
const binanceAPI = require('binance-api-node').default;
const Logger = require('../modules/Logger');
const Statistics = require('../modules/Statistics');
// const uniqid = require('uniqid');

router.use(account);
router.use(admin);
router.use(bitaps);
router.use(bots);
router.use(income);
router.use(pages);
router.use(signin);
router.use(signup);
router.use(statistics);
router.use(symbolsList);
router.use(tariffs);
router.use(userActivation);

router.get('/test', (req, res, next) => {
	let user = { name: req.cookies.user.name };



	Mongo.select(user, 'users', userData => {

		userData = userData[0];

		let bots = userData.bots.filter(bot => !bot.isDeleted);

		Mongo.update(user, {bots: bots}, 'users', data => res.json({d: data, bots: bots}));


	});

	// Users.Bots.getBotList(user, data => {
	// 	// log(data);
	// 	res.json(data);
	// });
	// const query = qrs.parse(url.parse(req.url).query);
	// console.log(query.userId)
	// res.json(query);
	// let user = { name: req.cookies.user.name };
	// Statistics.getUserStatistic(user, data => res.send(data));
});

module.exports = router;