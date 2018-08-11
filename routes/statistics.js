var express = require('express');
var router = express.Router();

router.get('/statistics', (req, res, next) => {
	if(!(req.cookies.user || req.session.user)) {
		return res.redirect(303, '/')
	}
	res.sendFile('statistics.html', { root: 'public/'});
});

module.exports = router;