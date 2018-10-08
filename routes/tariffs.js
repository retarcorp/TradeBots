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

module.exports = router;