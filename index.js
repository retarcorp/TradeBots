var express = require('express');
var bodyParser = require('body-parser');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser')
var Mongo = require('./modules/Mongo').init();

//Routers
var authorization = require('./routes/authorization');
var registration = require('./routes/registration');
var bots = require('./routes/bots');
var index = require('./routes/index');

var app = express();
var urlencodedParser = bodyParser.urlencoded({extended: false});

// app.use(session({secret: 'keyboard cat', cookie: {}}));
app.use(cookieParser());
app.use(expressSession({secret: 'kitty secret'}));
app.use(express.static(__dirname + '/public'));
app.use('/*', bodyParser.urlencoded({ extended: true }));

app.set('port', process.env.PORT || 3000);



app.get('/', index);
app.get('/bots', bots);
app.get('/authorization', authorization);
app.post('/authorization', authorization);
app.get('/registration', registration);
app.post('/registration', registration);





// пользовательская страница 404 
app.use(function(req, res){        
	res.status(404);        
	res.send('404'); 
});

// пользовательская страница 500 
app.use(function(err, req, res, next){        
	console.error(err.stack);        
	res.status(500);        
	res.send('500'); 
}); 

app.listen(app.get('port'), () => {
	console.log(`server start at port ::${app.get('port')}`);
});