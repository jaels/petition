


var pg = require('pg');

var client = new pg.Client('postgres://spicedling:036363976@localhost:5432/signatures');
client.connect(function(err) {
    console.log(err);
});

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

exports.showSigners = function () {
    return getFromDb("SELECT firstname, lastname FROM signatures").then(function(result) {
        var results=result.rows;
        return results;
    });
};

exports.showSignatures = function (temp) {
    return getFromDb('SELECT * FROM signatures WHERE user_id=' + temp).then(function(result) {
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
    return getFromDb('SELECT users.firstname AS firstname, users.lastname As lastname, user_profiles.age AS age, user_profiles.city AS city, user_profiles.homepage AS homepage FROM users LEFT JOIN user_profiles ON users.id = user_profiles.user_id').then(function(result) {
        return result;
    });
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
    return getFromDb('SELECT * FROM user_profiles WHERE user_id=' + user_id).then(function(result) {
        if(result.rows.length>0) {
            getFromDb('UPDATE user_profiles SET (age,city,homepage)=($1,$2,$3) WHERE user_id=$4 RETURNING id', [age,city,homepage,user_id]);
        }
        else {
            getFromDb('INSERT into user_profiles (age,city,homepage,user_id) VALUES ($1,$2,$3,$4) RETURNING id', [age,city, homepage, user_id]);
        }
    });

};


exports.deleteSignature = function(signatureId) {
    return new Promise(function(resolve, reject) {
        client.query('DELETE FROM signatures WHERE id=' + signatureId, function(err,result) {
            if(err) {
                reject(err);
            }
            else {
                resolve(result);
            }
        });
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
        client.query(str, params || [], function(err, result) {
            if(err) {
                reject(err);
            }
            else {
                resolve(result);
            }
        });
    });
}
