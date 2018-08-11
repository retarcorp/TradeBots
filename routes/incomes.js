var express = require('express');
var router = express.Router();

router.get('/incomes', (req, res, next) => {
	if(!(req.cookies.user || req.session.user)) {
		return res.redirect(303, '/')
	}
	res.sendFile('incomes.html', { root: 'public/'});
});

module.exports = router;