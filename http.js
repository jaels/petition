

var express = require('express');
var app = express();
app.use(require('cookie-parser')());

app.use(require('body-parser').urlencoded({
    extended: false
}));

app.use(require('cookie-parser')());
var hb = require('express-handlebars');
app.engine('handlebars', hb());
app.set('view engine', 'handlebars');


var pg = require('pg');

var client = new pg.Client('postgres://spicedling:036363976@localhost:5432/signatures');

client.connect(function(err) {
    console.log(err);
});

var db=require('./db.js');


var cookieSession = require('cookie-session');



var first;
var last;
var sign;

app.use(cookieSession({
    secret: 'sign-cook',
    maxAge: 1000 * 60
}));


app.use(express.static('./public'));

app.get('/petition', function(req,res) {
    if (req.session && req.session.signatureId) {
        var temp = req.session.signatureId;
        console.log(temp);
        db.showSignatures(temp).then(function(signature) {
            console.log(signature);
            res.render('already_signed', {
                layout: 'main',
                signature:signature
            });

        });


    }


    else res.render('form', {
        layout: 'main'
    });


});


app.post('*', function(req,res) {
    first = req.body.firstname;
    last = req.body.lastname;
    sign = req.body.signature;


    if(first && last && sign) {
        db.insertData(first,last,sign).then(function(id) {
            req.session.signatureId = id;
            res.redirect('/petition/thanks');

        });
        // .catch(function(err) {
        //     res.render()
        // })

    }


     else res.status(206).send('You need to fill all the fields before submitting');


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

    });
});




app.listen(8080);
