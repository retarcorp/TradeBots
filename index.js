var express = require('express');
var bodyParser = require('body-parser');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser');

//Modules
var Mongo = require('./modules/Mongo').init();
var Users = require('./modules/Users');
var Crypto = require('./modules/Crypto');

//Routers
var authorization = require('./routes/authorization');
var registration = require('./routes/registration');
var bots = require('./routes/bots');
var account = require('./routes/account');
var index = require('./routes/index');

var app = express();

app.use(cookieParser());
app.use(expressSession({secret: 'kitty secret'}));
app.use(express.static(__dirname + '/public'));
app.use('/*', bodyParser.urlencoded({ extended: true }));
app.disable('x-powered-by');

app.set('port', process.env.PORT || 8072);

app.get('/test', (req, res, next) => {
	res.send('test');
});

app.get('/', index);
app.get('/bots', bots);
app.get('/account', account);
app.post('/account/api', account);
app.delete('/account/api', account);
app.get('/authorization', authorization);
app.get('/authorization/logout', authorization);
app.post('/authorization', authorization);
app.get('/registration', registration);
app.post('/registration', registration);



// пользовательская страница 404 
app.use(function(req, res){        
	res.status(404);        
	res.sendFile('404.html', {root: 'public/'}); 
});

// пользовательская страница 500 
app.use(function(err, req, res, next){        
	console.error(err.stack);        
	res.status(500);        
	res.sendFile('500.html', {root: 'public/'});  
}); 

app.listen(app.get('port'), () => {
	console.log(`server start at port ::${app.get('port')}`);
});