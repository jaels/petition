
var pg = require('pg');

var client = new pg.Client('postgres://spicedling:036363976@localhost:5432/signatures');
client.connect(function(err) {
    console.log(err);
});

exports.insertData = function(first,last,sign,userId) {
    return getFromDb('INSERT into signatures(firstname, lastname, signature,user_id) VALUES($1, $2, $3, $4) RETURNING id',[first,last,sign,userId]).then(function(result) {
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
    return getFromDb('SELECT signature FROM signatures WHERE id=' + temp).then(function(result) {
        return result.rows[0].signature;
    });
};


exports.insertUserData = function(first,last,email,hashedPassword) {

    return getFromDb('INSERT into users(firstname, lastname, email, password) VALUES($1, $2, $3, $4) RETURNING id',[first,last,email,hashedPassword]).then(function(result) {
        return result.rows[0].id;
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
