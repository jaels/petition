
var express = require('express');
var router = express.Router();
module.exports = router;
var bcrypt = require('bcrypt');

var db=require('../config/db');

var counter=0;

bodyParser = require('body-parser');
var csrf = require('csurf');
var csrfProtection = csrf({cookie: true});
var parseForm = bodyParser.urlencoded({extended: false});

router.get('/', function(req,res) {
    res.redirect('/petition');
});

router.get('/petition', function(req,res) {
    if(!(req.session.user)) {
        res.redirect('/petition/register');
    }
    else {
        res.redirect('/petition/form');
    }
});

router.get('/petition/register', function(req, res) {
    if(req.session.user) {
        res.redirect('/petition/form');
    }
    else {
        res.render('register', {
            layout:'main',
            csrfToken: req.csrfToken()
        });
    }
});

router.post('/registering', function(req,res) {
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var email = req.body.email;
    var password = req.body.password;

    if((req.body.email).indexOf('@')>-1 && firstname && lastname && email && password ) {
        db.checkEmail(email).then(function(result) {
            if(result.rows.length===0) {
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
                    }).catch(function(err) {
                        console.log(err);
                    });
                }).catch(function(err) {
                    console.log(err);
                });
            }
            else res.send('Email already exists. Please sign in');
        });
    }
    else res.send('Your email is not correct');

});

router.get('/petition/login', function(req,res) {
    res.render('login', {
        layout:'main',
        csrfToken: req.csrfToken()
    });
});

router.get('/petition/more-info', function(req,res) {
    res.render('more-info', {
        layout:'main',
        csrfToken: req.csrfToken()
    });
});

router.post('/petition/pre-form', function(req,res) {

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

router.post('/check-user', function(req,res) {

    var requestedPassword = req.body.password;
    var requestedEmail = req.body.email;

    db.checkIfEmailExists(requestedEmail).then(function(result) {
        if (result.rows.length===0) {
            res.send('No such user, please register');
        }
        else {
            var listedPassword = result.rows[0].password;
            var id=result.rows[0].id;
            var firstname=result.rows[0].firstname;
            var lastname=result.rows[0].lastname;
            var email=result.rows[0].emai;
            checkPassword(requestedPassword,listedPassword).then(function(doesMatch) {
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
                    // db.wrongPassword();
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


router.get('/petition/already-signed', function(req,res) {
    if(!(req.session.user)) {
        res.redirect('/petition');
    }
    else {
        var temp=req.session.user.id;
        db.showSignature(temp).then(function(signature) {
            return db.countSigners().then(function(count) {
                res.render('already_signed', {
                    layout: 'main',
                    signature:signature,
                    count:count
                });
            });
        }).catch(function(err) {
            console.log(err);
        });
    }
});


router.get('/petition/form', function(req, res) {
    if(!(req.session.user)) {
        res.redirect('/petition');
    }
    else if(req.session.user.signatureId) {
        res.redirect('/petition/already-signed');
    }
    else {
        res.render('form', {
            layout: 'main',
            csrfToken: req.csrfToken()
        });

    }


});

router.post('/signing', function(req,res) {
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

router.get('/petition/thanks', function(req, res) {
    if(!(req.session.user)) {
        res.redirect('/petition/register');
    }
    else {
        db.countSigners().then(function(count) {
            res.render('thanks', {
                layout: 'main',
                count:count,
                csrfToken: req.csrfToken()

            });
        }).catch(function(err) {
            console.log(err);
        });
    }
});




router.get('/petition/signers',function(req, res) {
    if(!(req.session.user)) {
        res.redirect('/petition/register');
    }
    else {
        db.getTheInfo().then(function(result) {
            var results=result.rows;
            res.render('signers', {
                layout: 'main',
                results:results,
                csrfToken: req.csrfToken()

            });
        }).catch(function() {
            res.render('error' , {
                layout: 'main'
            });
        });
    }
});

router.get('/petition/signers/:city', function(req,res) {
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
            cityResults:cityResults,
            csrfToken: req.csrfToken()

        });
    }).catch(function() {
        res.render('error' , {
            layout: 'main'
        });
    });
});

router.get('/petition/logout', function(req,res) {
    req.session = null;
    res.render('loged-out' , {
        layout: 'main'
    });
});

router.get('/petition/edit', function(req, res) {
    var arr=[req.session.user];
    res.render('update', {
        layout: 'main',
        arr:arr,
        csrfToken: req.csrfToken()
    });
});

router.post('/petition/updating', function(req, res) {

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

router.post('/petition/delete', function(req,res) {
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
