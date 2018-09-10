var express = require('express');
var router = express.Router();

const Parse = require('../modules/Parse.js');

router.post('/parse', (req, res, next) => {
	// let user = {name: req.cookies.user.name}
  console.log( req.body)
  let test = Parse.lol({from:'BNB',to:'BTC'})
  res.send(req.body)
})

module.exports = router;
