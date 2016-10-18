
var express = require('express');
var app = express();
var hb = require('express-handlebars');
var pg = require('pg');
var cookieSession = require('cookie-session');
var bcrypt = require('bcrypt');
var client = new pg.Client('postgres://spicedling:036363976@localhost:5432/signatures');
var db=require('./db.js');

// var router = require('./routes/router');


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



// app.use('/', router);

app.use(express.static('./public'));

app.get('/petition', function(req,res) {
    console.log(req.session.user);
    if(!(req.session.user)) {
        res.redirect('/petition/register');
    }
    else {
        console.log('redirecting to form');
        res.redirect('/petition/form');
    }
});

app.get('/petition/register', function(req, res) {
    if(req.session.user) {
        res.redirect('/petition/form');
    }
    else {
        res.render('register', {
            layout:'main'
        });
    }
});

app.post('/registering', function(req,res) {
    if((req.body.email).indexOf('@')>-1) {
        var firstname = req.body.firstname;
        var lastname = req.body.lastname;
        var email = req.body.email;
        var password = req.body.password;


        // db.checkEmail(email).then(function(result){
        //     console.log('hey');
        //     console.log(result);
        // });
        //

        if(firstname&&lastname&&email&&password) {
            hashPassword(password).then(function(hash) {
                var hashedPassword = hash;
                db.insertUserData(firstname,lastname,email,hashedPassword).then
                (function(id){
                    req.session.user = {
                        id:id,
                        firstname:firstname,
                        lastname:lastname,
                        email:email
                    };
                    return req.session.user;
                }).then(function() {
                    var tempId=req.session.user.id;
                    console.log('user_id when registering is ' + tempId);
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
    var city = (req.body.city).toUpperCase();
    var homepage = req.body.homepage;
    var user_id = req.session.user.id;
    req.session.user.age=age;
    req.session.user.city=city;
    req.session.user.homepage=homepage;
    console.log('the user id in more info is' + user_id);
    db.insertMoreInfo(age,city,homepage,user_id);
    res.redirect('/petition/form');
});

app.post('/check-user', function(req,res) {

    var requestedPassword = req.body.password;
    var requestedEmail = req.body.email;

    db.checkIfEmailExists(requestedEmail).then(function(result) {
        if (result.rows.length===0) {
            res.send('No such user, please register');
        }
        else {
            var listedPassword = result.rows[0].password;
            console.log(listedPassword);
            var id=result.rows[0].id;
            var firstname=result.rows[0].firstname;
            var lastname=result.rows[0].lastname;
            var email=result.rows[0].emai;
            checkPassword(requestedPassword,listedPassword).then(function(doesMatch) {
                console.log(doesMatch);
                if(doesMatch===true) {
                    req.session.user = {
                        id:id,
                        firstname:firstname,
                        lastname:lastname,
                        email:email
                    };

                    var user_id = req.session.user.id;
                    db.checkIfsignature(user_id).then(function(result) {
                        if(result.rows.length===0) {
                            res.redirect('/petition/form');
                        }
                        else {
                            req.session.user.signatureId = result.rows[0].id;
                            res.redirect('/petition/already-signed');
                        }
                    });
                }

                else {
                    res.send('Wrong password, try again');
                }
            });
        }
    }).catch(function(err) {
        console.log(err);
        res.render('error' , {
            layout: 'main'
        });

    });
});


app.get('/petition/already-signed', function(req,res) {
    if(!(req.session.user)) {
        res.redirect('/petition');
    }
    else {
        var temp=req.session.user.id;
        db.showSignatures(temp).then(function(signature) {
            return db.countSigners().then(function(count) {
                res.render('already_signed', {
                    layout: 'main',
                    signature:signature,
                    count:count
                });
            });
        }).catch(function(err) {
            console.log(err);
        })
    }

});


app.get('/petition/form', function(req, res) {
    if(!(req.session.user)) {
        res.redirect('/petition');
    }
    else if(req.session.user.signatureId) {
        console.log('redirecting to already signed');
        res.redirect('/petition/already-signed');
    }
    else {
        res.render('form', {
            layout: 'main'
        });

    }


});



app.post('/signing', function(req,res) {
    var firstname = req.session.user.firstname;
    var lastname = req.session.user.lastname;
    var sign = req.body.signature;
    var userId = req.session.user.id;

    if(sign) {
        db.insertData(sign,userId).then(function(id) {
            req.session.user.signatureId = id;
            res.redirect('/petition/thanks');

        }).catch(function(err) {
            console.log(err);
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
        });
    }
});




app.get('/petition/signers', function(req, res) {
    if(!(req.session.user)) {
        res.redirect('/petition/register');
    }
    else {
        db.getTheInfo().then(function(result) {
            var results=result.rows;
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

app.get('/petition/signers/:city', function(req,res) {
    var city = req.params.city;
    db.getTheInfo().then(function(result) {
        var results = result.rows;
        var cityResults = [];
        for (var i=0;i<results.length;i++) {
            if(results[i].city===city) {
                cityResults.push(results[i]);
            }
        }
        return cityResults;
    }).then(function(cityResults) {
        res.render('sameCity', {
            layout: 'main',
            cityResults:cityResults
        });
    }).catch(function() {
        res.render('error' , {
            layout: 'main'
        });
    });
});

app.get('/petition/logout', function(req,res) {
    req.session = null;
    console.log('after deleting ' + req.session);
    res.render('loged-out' , {
        layout: 'main'
    });

});

app.get('/petition/edit', function(req, res) {
    var arr=[req.session.user];
    res.render('update', {
        layout: 'main',
        arr:arr
    });
});

app.post('/petition/updating', function(req, res) {
    console.log('updating');

    var firstname=req.body.firstname;
    var lastname=req.body.lastname;
    var email=req.body.email;
    var password=req.body.password;
    var age=req.body.age;
    var city=req.body.city.toUpperCase();
    var homepage=req.body.homepage;
    var user_id=req.session.user.id;
    req.session.user.firstname=req.body.firstname;
    req.session.user.lastname=req.body.lastname;
    req.session.user.email=req.body.email;
    req.session.user.age=req.body.age;
    req.session.user.city=req.body.city;
    req.session.user.homepage=req.body.homepage;


    if(password.length>0) {
        hashPassword(password).then(function(hash){
            var hash=hash;
            db.updatePassword(hash, user_id);
        });
    }

    db.updateData(firstname,lastname,email,user_id)
    .then(function() {
        db.updateMoreData(age,city,homepage,user_id);
    }).then(function() {
        res.redirect('/petition/form');

    });

});

app.post('/petition/delete', function(req,res) {
    var signatureId=req.session.user.signatureId;
    db.deleteSignature(signatureId).then(function(result) {
        req.session.user.signatureId=null;
        res.redirect('/petition/form');
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
                console.log(doesMatch);
                resolve(doesMatch);
            }
        });
    });
}


app.listen(8080, function() {
    console.log('listening');
});
