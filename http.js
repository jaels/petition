
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
    secret: 'ssss',
    maxAge: 1000 * 60 * 60 * 24 * 14
}));




app.use(express.static('./public'));

app.get('/petition', function(req,res) {
    if(!(req.session.user)) {
        res.redirect('/petition/register');
    }
    else res.redirect('/petition/form');
});

app.get('/petition/register', function(req, res) {
    // if(req.session.user) {
    //     res.redirect('/petition/form');
    // }
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
                        last:last,
                        email:email
                    };
                    return req.session.user;
                }).then(function() {
                    res.redirect('/petition/more-info');
                });
            });
        }
    }
    else res.send('Your email is not correct');

});

app.get('/petition/login', function(req,res) {
    res.render('login', {
        layout:'main'
    });

});


app.get('/petition/more-info', function(req,res) {
    res.render('more-info', {
        layout:'main'
    });


});

app.post('/petition/pre-form', function(req,res) {

    var age = req.body.age;
    var city = req.body.city;
    var homepage = req.body.homepage;
    var user_id = req.session.user.id;
    console.log(user_id);
    db.insertMoreInfo(age,city,homepage,user_id);
    res.redirect('/petition/form');
});

app.post('/check-user', function(req,res) {

    var requestedPassword = req.body.password;
    var requestedEmail = req.body.email;
    console.log(requestedEmail);

    client.query('SELECT * FROM users WHERE email=$1', [requestedEmail], function(err, result) {
        if (err) {
            res.send('No such user, please register');
        }
        else {
            if (result.rows.length===0) {
                res.send('No such user, please register');
            }
            else {
                var listedPassword = result.rows[0].password;

                req.session.user = {
                    id:result.rows[0].id,
                    first:result.rows[0].firstname,
                    last:result.rows[0].lastname,
                    email:result.rows[0].email
                };
                checkPassword(requestedPassword,listedPassword).then(function(doesMatch) {
                    if(doesMatch===true) {

                        client.query('SELECT * FROM signatures WHERE user_id=$1', [result.rows[0].id], function(err,result) {
                            if (err) {
                                console.log('Could not find signature');
                            }

                            else {
                                if(result.rows.length===0) {
                                    res.redirect('/petition/form');
                                }

                                else {
                                    req.session.user.signatureId = result.rows[0].id;
                                    // var temp=result.rows[0].id;
                                    res.redirect('/petition/already-signed');
                                }
                            }
                        });
                    }

                    else res.send('Wrong user or password');

                });
            }
        }
    });
});



app.get('/petition/already-signed', function(req,res) {
    if(!(req.session.user)) {
        res.redirect('/petition');
    }
    else {
        var temp=req.session.user.signatureId;
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

});


app.get('/petition/form', function(req, res) {
    if(!(req.session.user)) {
        res.redirect('/petition');
    }
    else if(req.session.user.signatureId) {
        res.redirect('/petition/already-signed');
    }
    else res.render('form', {
        layout: 'main'
    });

});



app.post('/signing', function(req,res) {
    var first = req.body.firstname;
    var last = req.body.lastname;
    var sign = req.body.signature;
    var userId = req.session.user.id;

    if(first && last && sign) {
        db.insertData(first,last,sign,userId).then(function(id) {
            req.session.user.signatureId = id;
            res.redirect('/petition/thanks');

        }).catch(function() {
            res.render('error' , {
                layout: 'main'
            });
        });
    }
});

app.get('/petition/thanks', function(req, res) {
    if(!(req.session.user)) {
        res.redirect('/petition/register');
    }
    else {
        db.countSigners().then(function(count) {
            res.render('thanks', {
                layout: 'main',
                count:count
            });
    }).catch(function(err) {
        console.log(err);
    })
}
});






    // db.countSigners().then(function(count) {
    //     console.log('getting info');
    //     db.getTheInfo().then(function(result) {
    //         var results=result.rows;
    //         console.log(results);
    //         res.render('thanks', {
    //             layout: 'main',
    //             count:count
    //         });
    // }).catch(function(err) {
    //     console.log(err);
    // });



app.get('/petition/signers', function(req, res) {
    if(!(req.session.user)) {
        res.redirect('/petition/register');
    }
    else {
        db.getTheInfo().then(function(result) {
            var results=result.rows;
            console.log(results);
            res.render('signers', {
                layout: 'main',
                results:results
            });
        }).catch(function() {
            res.render('error' , {
                layout: 'main'
            });
        });
    }
});

// app.get('/petition/signers/:city', function(req,res) {
//
//
// }

app.get('/petition/logout', function(req,res) {
    req.session = null;
    res.render('loged-out' , {
        layout: 'main'
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
