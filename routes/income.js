let express = require('express');
var router = express.Router();
let Users = require('../modules/Users');

router.get('/api/income/get', (req, res, next) => {
	let user = {name: req.cookies.user.name};
	Users.Income.get(user, data => res.json(data));
})

module.exports = router;