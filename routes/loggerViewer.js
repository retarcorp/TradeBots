const express = require('express');
const router = express.Router();
const LoggerViewer = require('../modules/LoggerViewer');
const Mongo = require('../modules/Mongo');
const LOGS = require('../constants').LOGS_COLLECTIONS;



router.post('/api/admin/loggerViewer', (req, res, next) => {
	LoggerViewer.getLogData(req.body, data => {res.json(data)});
	// var loggerData = [];

	// Mongo.select({}, LOGS, data => {
	// 	loggerData = [...data];
	// 	let {start, end} = req.body;
	// 	console.log(start, end);
	// 	let resData = [];
	// 	for (let i = start; i <= end; i++) {
	// 		if(loggerData[i]) {
	// 			resData.push(loggerData[i]);
	// 		} else {
	// 			break;
	// 		}
	// 	}
	// 	res.json({
	// 		status: 'ok',
	// 		amount: resData.length,
	// 		data: resData
	// 	});
	// })
	// Mongo.select({}, LOGS, data => {
	// 	res.json({
	// 		status: 'ok',
	// 		amount: data.length,
	// 		data
	// 	});
	// })
});


module.exports = router;