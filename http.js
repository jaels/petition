

var express = require('express');
var app = express();
var hb = require('express-handlebars');
var pg = require('pg');
var cookieSession = require('cookie-session');
var bcrypt = require('bcrypt');
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
    res.redirect('/petition/register');
});

app.get('/petition/register', function(req, res) {
    res.render('register', {
        layout:'main'
    });
});

app.post('/registering', function(req,res) {
    if((req.body.email).indexOf('@')>-1) {
        var first = req.body.firstname;
        var last = req.body.lastname;
        var email = req.body.email;
        var password = req.body.password;

        if(first&&last&&email&&password) {

            hashPassword(password).then(function(hash) {
                var hashedPassword = hash;
                db.insertUserData(first,last,email,hashedPassword).then
                (function(id){
                    req.session.user = {
                        id:id,
                        first:first,
                        last:last
                    };
                });
            });

            res.redirect('/petition/form');

        }

    }
    else res.send('Your email is not correct');

});

app.get('/petition/login', function(req,res) {
    res.render('login', {
        layout:'main'
    });

});

app.post('/check-user', function(req,res) {

    var requestedPassword = req.body.password;
    var requestedEmail = req.body.email;
    console.log(requestedEmail);

    client.query('SELECT password FROM users WHERE email=$1', [requestedEmail], function(err, result) {
        if (err) {
            res.send('No such user, please register');
        }
        else {
            var listedPassword = result.rows[0].password;
            checkPassword(requestedPassword,listedPassword).then(function(doesMatch) {
                if(doesMatch===true) {
                    res.redirect('/petition/form');
                }
            });
        }
    });


});

app.get('/petition/form', function(req, res) {
    if (req.session.signatureId) {
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



app.post('/signing', function(req,res) {
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



function hashPassword(password) {
    return new Promise(function(resolve, reject) {
        bcrypt.genSalt(function(err, salt) {
            if (err) {
                reject(err);
            }
            bcrypt.hash(password, salt, function(err, hash) {
                if (err) {
                    reject(err);
                }
                else  {
                    resolve(hash);
                }
            });
        });
    });
}


function checkPassword(requestedPassword, listedPassword) {
    return new Promise(function(resolve, reject) {
        bcrypt.compare(requestedPassword, listedPassword, function(err, doesMatch) {
            if (err) {
                reject(err);
            }
            else {
                resolve(doesMatch);
            }
        });
    });
}




app.listen(8080);
