var express = require('express');
var router = express.Router();
const account = require('./account');
const bots = require('./bots');
const incomes = require('./incomes');
const signin = require('./signin');
const signup = require('./signup');
const statistics = require('./statistics');
const symbolsList = require('./symbolsList');
const income = require('./income');

router.use(account);
router.use(bots);
router.use(incomes);
router.use(signin);
router.use(signup);
router.use(statistics);
router.use(symbolsList);
router.use(income);


module.exports = router;