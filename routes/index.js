var express = require('express');
var router = express.Router();

router.get('/', function(req, res)
{
	res.sendfile('./views/tohru.html');
});

router.get('/test', function(req, res)
{
	res.sendfile('./views/test.html');
});

router.get('/lay', function(req, res)
{
	res.sendfile('./views/laytest.html');
});

router.get('/pagelayout', function(req, res)
{
	res.sendfile('./views/PageLayout.html');
});

router.get('/getthesockets', function(req, res)
{
	res.sendfile('./node_modules/socket.io/node_modules/socket.io-client/socket.io.js');
});

module.exports = router;