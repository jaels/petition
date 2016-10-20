
var redis = require('redis');
var client = redis.createClient({
    host: 'localhost',
    port: 6379
});

client.on('error', function(err) {
    console.log(err);
});




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
        client.del('signers');
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
        client.del('signers');
        return result.rows[0].id;
    });
};

exports.insertMoreInfo = function(age,city,homepage,user_id) {
    return getFromDb('INSERT into user_profiles(age, city, homepage, user_id) VALUES($1, $2, $3, $4) RETURNING id',[age, city, homepage,user_id]).then(function(result) {
        return result.rows[0].id;
    });
};

exports.getTheInfo = function() {
    return new Promise(function(resolve, reject) {
        client.get('signers', function(err,data) {
            if(err) {
                reject(err);
            }
            else if (data) {
                console.log(data, typeof data);

                resolve(JSON.parse(data));
            }
            else return getFromDb('SELECT users.firstname AS firstname, users.lastname As lastname, user_profiles.age AS age, user_profiles.city AS city, user_profiles.homepage AS homepage FROM signatures LEFT JOIN users ON users.id=signatures.user_id LEFT JOIN user_profiles ON users.id = user_profiles.user_id ').then(function(result) {
                client.setex('signers', 1800, JSON.stringify(result), function(err) {
                    if (err) {
                        return console.log(err);
                    }
                });
                resolve(result);
            });
        });
    }).catch(function(err){
        console.log(err);
    });
};



exports.updatePassword = function(hash, user_id) {
    return getFromDb('UPDATE users SET password=$1 WHERE user_id=$2 RETURNING id', [hash,user_id]);
};


exports.updateData = function(firstname,lastname,email,user_id) {
    return getFromDb('UPDATE users SET (firstname, lastname, email)=($1,$2,$3) WHERE id=$4 RETURNING id',[firstname, lastname, email, user_id]).then(function(result) {
        client.del('signers');
        return result;
    });
};


exports.updateMoreData = function(age, city, homepage, user_id) {
    return getFromDb('SELECT * FROM user_profiles WHERE user_id=$1', [user_id]).then(function(result) {
        if(result.rows.length>0) {
            getFromDb('UPDATE user_profiles SET (age,city,homepage)=($1,$2,$3) WHERE user_id=$4 RETURNING id', [age,city,homepage,user_id]);
        }
        else {
            getFromDb('INSERT into user_profiles (age,city,homepage,user_id) VALUES ($1,$2,$3,$4) RETURNING id', [age,city, homepage, user_id]);
        }
        client.del('signers', function(err) {
            console.log(err);
        });
    });

};


exports.deleteSignature = function(signatureId) {
    return getFromDb('DELETE FROM signatures WHERE id=$1', [signatureId]).then(function(result) {
        client.del('signers');
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

exports.checkRedis = function() {
    return new Promise(function(resolve, reject) {
        client.get('wrong', function(err, data) {
            if(err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
};

exports.wrongPassword = function() {
    client.get('wrong', function(err,data) {
        if(err) {
            console.log(err);
        }
        else if (data) {
            var num = JSON.parse(data);
            num+=1;
            if (num<3) {
                client.setex('wrong', 60, JSON.stringify(num), function(err, data) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        console.log(data);
                    }
                });
            }
            else {
                client.ttl('wrong', function(err, data) {
                    if(err) {
                        console.log(err);
                    }
                    else {
                        var temp=data+90*(Math.pow(2, num-3));
                        console.log('time left is ' + temp);
                        console.log('number of failed trials is ' + num);
                        client.setex('wrong', temp, JSON.stringify(num), function(err, data) {
                            if (err) {
                                console.log(err);
                            }
                            else {
                                console.log(data);
                            }
                        });
                    }
                });
            }
        }
        else {
            client.setex('wrong', 60, JSON.stringify(1), function(err, data) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log('data in the first');
                    console.log(data);
                }
            });
        }
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
