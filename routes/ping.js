const express = require('epxress');
const router = express.Router();

router.get('/api/ping', (req, res, next) => {
    res.send(true);
});

module.exports = router;