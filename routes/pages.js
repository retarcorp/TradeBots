const express = require('express');
const router = express.Router();
const Pages = require('../modules/Pages');

router.post('/api/admin/pages/create', (req, res, next) => {
	let admin = req.cookies.admin;
	Pages.createPage(admin, req.body, data => res.json(data));
});

router.get('/api/admin/pages/getPages', (req, res, next) => {

});

router.post('/api/admin/pages/remove', (req, res, next) => {

});

router.post('/api/admin/pages/update', (req, res, next) => {

});

module.exports = router;