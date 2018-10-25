var express = require('express');
var router = express.Router();
var Mongo = require('../modules/Mongo');
var qrs = require("querystring");
var url = require("url");

router.get('/api/user/activate', (req, res, next) => {
    console.log('something');
    const query = qrs.parse(url.parse(req.url).query),
        response = {
            status: 'ok'
        };
    
    Mongo.select({ regKey: query.key }, 'users', (response_db) => {
        const user = response_db[0];

        if (!user) {
            res.send('Activation Failed!');
            return;
        }

        if (user.active == true) {
            res.send('User already activated!');
            return;
        }

        user.active = true;
        Mongo.update({ name: user.name }, user, "users", () => {
            res.send(response);
        });
    });
});

module.exports = router;