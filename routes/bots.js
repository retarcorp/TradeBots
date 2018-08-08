var express = require('express');
var Mongo = require('../modules/Mongo');
var Bot = require('../modules/Bot');
var router = express.Router();

// router.get('/', (req, res, next) => {
// 	res.sendFile('bots.html', { root: 'public/'});
// });

router.use('/*', (req, res, next) => {
	if(!(req.cookies.user || req.session.user)){
		return res.redirect(303, '/');
	}
	next();
});

router.get('/bots', (req, res, next) => {
	res.sendFile('bots.html', { root: 'public/'});
});

router.post('/bots-add', (req, res, nex) => {
	let user = {name: req.cookies.user.name};
	Mongo.select(user, 'users', (data) => {
		data = data[0];
		let bot = new Bot({});
		data.bots.push(bot);
		Mongo.update({name: data.name}, data, 'users', (data) => {
			res.send(200/*JSON.stringify( data )*/);
		});
	})
});

module.exports = router;