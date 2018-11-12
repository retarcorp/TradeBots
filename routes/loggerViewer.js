const express = require('express');
const router = express.Router();
const LoggerViewer = require('../modules/LoggerViewer');

router.get('/api/admin/loggerViewer', (req, res, next) => {
	res.send([]);
});


module.exports = router;