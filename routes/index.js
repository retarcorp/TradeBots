var express = require('express');
var router = express.Router();

router.get('/', (req, res, next) => {
	if(!(req.cookies.user || req.session.user)) {
		return res.redirect(303, '/registration')
	}
	res.redirect(303, '/account');
});

module.exports = router;