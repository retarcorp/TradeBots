const express = require('express');
const router = express.Router();
const Pages = require('../modules/Pages');

router.post('/api/admin/pages/create', (req, res, next) => {
	let admin = req.cookies.admin;
	Pages.createPage(admin, req.body, data => res.json(data));
});

router.get('/api/admin/pages/getPages', (req, res, next) => {
	let admin = req.cookies.admin;
	Pages.getPages(admin, data => res.json(data));
});

router.post('/api/admin/pages/remove', (req, res, next) => {
	let admin = req.cookies.admin;
	Pages.removePage(admin, req.body, data => res.json(data));
});

router.post('/api/admin/pages/update', (req, res, next) => {
	let admin = req.cookies.admin;
	Pages.updatePage(admin, req.body, data => res.json(data));
});

module.exports = router;