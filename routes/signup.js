var express = require('express');
var router = express.Router();
var Recaptcha = require('express-recaptcha').Recaptcha;

var recaptcha = new Recaptcha('6Le_9HcUAAAAADuYPBK5e7NQzw1V3_IH29iOQivV', '6Le_9HcUAAAAAGiOcpsGhm9qy7YR7pRf5TJqAMtS');

var Users = require('../modules/Users');

router.post('/api/signup', recaptcha.middleware.verify, (req, res, next) => {
	let user = {
		password: req.body.password,
		name: req.body.name
	}

	if (req.recaptcha.error) {
		res.send({
			status: 'error',
			message: "Recaptcha didn't verified"
		});

		return null;
	}
	
	Users.create(user, 'users', (data) => {
		data.captcha = req.recaptcha;
		res.send(data);
	});
	
});

module.exports = router;