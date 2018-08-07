var express = require('express');
var router = express.Router();

// router.get('/', (req, res, next) => {
// 	res.sendFile('bots.html', { root: 'public/'});
// });

router.get('/bots', (req, res, next) => {
	if(!(req.cookies.user || req.session.user)){
		return res.redirect(303, '/');
	}
	res.sendFile('bots.html', { root: 'public/'});
});

module.exports = router;