

var express = require('express');
var app = express();
var hb = require('express-handlebars');
var pg = require('pg');
var cookieSession = require('cookie-session');
var client = new pg.Client('postgres://spicedling:036363976@localhost:5432/signatures');
var db=require('./db.js');

client.connect(function(err) {
    console.log(err);
});

app.use(require('body-parser').urlencoded({
    extended: false
}));
app.use(require('cookie-parser')());
app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

app.use(cookieSession({
    secret: 'sign-cook',
    maxAge: 1000 * 60
}));


app.use(express.static('./public'));

app.get('/petition', function(req,res) {
    if (req.session && req.session.signatureId) {
        var temp = req.session.signatureId;
        db.showSignatures(temp).then(function(signature) {
            db.countSigners().then(function(count) {
                res.render('already_signed', {
                    layout: 'main',
                    signature:signature,
                    count:count
                });
            });
        });
    }
    else res.render('form', {
        layout: 'main'
    });
});

app.post('*', function(req,res) {
    var first = req.body.firstname;
    var last = req.body.lastname;
    var sign = req.body.signature;

    if(first && last && sign) {
        db.insertData(first,last,sign).then(function(id) {
            req.session.signatureId = id;
            res.redirect('/petition/thanks');

        }).catch(function() {
            res.render('error' , {
                layout: 'main'
            });
        });
    }
});

app.get('/petition/thanks', function(req, res) {
    db.countSigners().then(function(count) {
        res.render('thanks', {
            layout: 'main',
            count:count
        });
    });
});

app.get('/petition/signers', function(req, res) {
    db.showSigners().then(function(results) {
        res.render('signers', {
            layout: 'main',
            results:results
        });
    }).catch(function() {
        res.render('error' , {
            layout: 'main'
        });
    });
});


app.listen(8080);
