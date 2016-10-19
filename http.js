
var express = require('express');
var app = express();
var hb = require('express-handlebars');
var pg = require('pg');
var cookieSession = require('cookie-session');
var bcrypt = require('bcrypt');
var csrf = require('csurf');
var client = new pg.Client('postgres://spicedling:036363976@localhost:5432/signatures');
var router = require('./routes/router');

var csrfProtection = csrf({ cookie: true });

var bodyParser = require('body-parser');

client.connect(function(err) {
    console.log(err);
});


app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(require('cookie-parser')());
app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

app.use(cookieSession({
    secret: 'ssss',
    maxAge: 1000 * 60 * 60 * 24 * 14
}));

app.use(csrfProtection);

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static('./public'));

app.use('/', router);


app.listen(process.env.PORT || 8080);
