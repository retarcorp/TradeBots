var express = require('express');
var router = express.Router();
let Tariffs = require('../modules/Tariffs');
let HistoryLog = require('../modules/HistoryLog');
let log = (data) => HistoryLog._log(data);

router.post('/api/admin/setTariff', (req, res, next) => {
	let admin = req.cookies.admin,
		reqTariff = req.body;

	Tariffs.setTariff(admin, reqTariff, data => {
		log(data);
		res.json(data);
	});
});

router.get('/api/admin/getTariffList', (req, res, next) => {
	let admin = req.cookies.admin;
	Tariffs.getTariffList(admin, data => res.json(data));
});

router.get('/api/user/getUsersTariffs', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	Tariffs.getUsersTariffs(user, data => res.json(data));
});

router.post('/api/admin/removeTariff', (req, res, next) => {
	let admin = req.cookies.admin,
		reqTariff = req.body;

	Tariffs.removeTariff(admin, reqTariff, data => {
		log(data);
		res.json(data);
	});
});

router.post('/api/admin/editTariff', (req, res, next) => {
	let admin = req.cookies.admin,
		reqTariff = req.body;

	Tariffs.editTariff(admin, reqTariff, data => {
		log(data);
		res.json(data);
	});
});

router.post('/api/user/purchaseTariff', (req, res, next) => {
	let user = {name: req.cookies.user.name},
		tariffId = req.body.id;
	
	Tariffs.purchaseTariff(user, tariffId, data => {
		log(data);
		res.json(data);
	});
});

module.exports = router;