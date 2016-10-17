var express = require('express');
router = express.Router();
module.exports = router;



router.get('/petition/edit', function(req, res) {
        res.render('update', {
            layout: 'main',
        });
});
