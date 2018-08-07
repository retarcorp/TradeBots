var express = require('express');
var router = express.Router();

// router.get('/', (req, res, next) => {
// 	res.sendFile('bots.html', { root: 'public/'});
// });

router.get('/bots', (req, res, next) => {
	res.sendFile('bots.html', { root: 'public/'});
});

module.exports = router;