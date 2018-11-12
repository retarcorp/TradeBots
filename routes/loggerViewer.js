const express = require('express');
const router = express.Router();
const LoggerViewer = require('../modules/LoggerViewer');
const Mongo = require('../modules/Mongo');
const LOGS = require('../constants').LOGS_COLLECTIONS;

router.get('/api/admin/loggerViewer', (req, res, next) => {
	Mongo.select({}, LOGS, data => {
		res.json({
			status: 'ok',
			amount: data.length,
			data
		});
	})
});


module.exports = router;