
var pg = require('pg');

var dbUrl = process.env.DATABASE_URL ||'postgres://spicedling:036363976@localhost:5432/signatures';

dbUrl = require('url').parse(dbUrl);

var dbUser = dbUrl.auth.split(':');

var dbConfig = {
    user: dbUser[0],
    database: dbUrl.pathname.slice(1),
    password: dbUser[1],
    host: dbUrl.hostname,
    port: dbUrl.port,
    max: 10,
    idleTimeoutMillis: 30000
};

var pool = new pg.Pool(dbConfig);

pool.on('error', function(err) {
    console.log(err);
});

exports.checkEmail = function(email) {
    return getFromDb('SELECT * FROM users WHERE email=$1',[email]).then(function(result) {
        return result;
    });
};

exports.insertData = function(sign,userId) {
    return getFromDb('INSERT into signatures(signature,user_id) VALUES($1, $2) RETURNING id',[sign,userId]).then(function(result) {
        return result.rows[0].id;
    });
};


exports.countSigners = function () {
    return getFromDb("SELECT COUNT(id) FROM signatures").then(function(result) {
        return result.rows[0].count;
    });
};


exports.showSignature = function (temp) {
    return getFromDb('SELECT * FROM signatures WHERE user_id=$1', [temp]).then(function(result) {
        return result.rows[0].signature;
    });
};


exports.insertUserData = function(firstname,lastname,email,hashedPassword) {
    return getFromDb('INSERT into users(firstname, lastname, email, password) VALUES($1, $2, $3, $4) RETURNING id',[firstname,lastname,email,hashedPassword]).then(function(result) {
        return result.rows[0].id;
    });
};

exports.insertMoreInfo = function(age,city,homepage,user_id) {
    return getFromDb('INSERT into user_profiles(age, city, homepage, user_id) VALUES($1, $2, $3, $4) RETURNING id',[age, city, homepage,user_id]).then(function(result) {
        return result.rows[0].id;
    });
};

exports.getTheInfo = function() {
    return getFromDb('SELECT users.firstname AS firstname, users.lastname As lastname, user_profiles.age AS age, user_profiles.city AS city, user_profiles.homepage AS homepage FROM signatures LEFT JOIN users ON users.id=signatures.user_id LEFT JOIN user_profiles ON users.id = user_profiles.user_id ').then(function(result) {

        return result;
    }).catch(function(err){
        if (err) {
            console.log(err);
        }
    })
};



exports.updatePassword = function(hash, user_id) {
    return getFromDb('UPDATE users SET password=$1 WHERE user_id=$2 RETURNING id', [hash,user_id]);
};


exports.updateData = function(firstname,lastname,email,user_id) {
    return getFromDb('UPDATE users SET (firstname, lastname, email)=($1,$2,$3) WHERE id=$4 RETURNING id',[firstname, lastname, email, user_id]).then(function(result) {
        return result;
    });
};


exports.updateMoreData = function(age, city, homepage, user_id) {
    return getFromDb('SELECT * FROM user_profiles WHERE user_id=$1', [user_id]).then(function(result) {
        if(result.rows.length>0) {
            console.log('just updating');
            getFromDb('UPDATE user_profiles SET (age,city,homepage)=($1,$2,$3) WHERE user_id=$4 RETURNING id', [age,city,homepage,user_id]);
        }
        else {
            console.log('inserting');
            getFromDb('INSERT into user_profiles (age,city,homepage,user_id) VALUES ($1,$2,$3,$4) RETURNING id', [age,city, homepage, user_id]);
        }
    }).catch(function(err) {
        console.log(err);
    })

};


exports.deleteSignature = function(signatureId) {
    return getFromDb('DELETE FROM signatures WHERE id=$1', [signatureId]).then(function(result) {
        return result;
    });
};


exports.checkIfEmailExists = function(requestedEmail) {
    return getFromDb('SELECT * FROM users WHERE email=$1', [requestedEmail]).then(function(result) {
        return result;
    });

};

exports.checkIfsignature = function(user_id) {
    return getFromDb('SELECT * FROM signatures WHERE user_id=$1', [user_id]).then(function(result) {
        return result;
    });
};


function getFromDb(str, params) {
    return new Promise(function(resolve, reject) {
        pool.connect(function(err, client, done) {
            if (err) {
                reject(err);
                return;
            }
            client.query(str, params || [], function(err, result) {
                if(err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }

                done();
            });

        });
    });
}
