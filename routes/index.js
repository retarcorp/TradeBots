var express = require('express');
var router = express.Router();

router.get('/', (req, res, next) => {
	if(!req.cookies.user) {
		return res.redirect(303, '/registration')
	}
	res.sendFile('account.html', { root: 'public/'});
});

module.exports = router;