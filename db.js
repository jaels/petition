
var pg = require('pg');

var client = new pg.Client('postgres://spicedling:036363976@localhost:5432/signatures');
client.connect(function(err) {
    console.log(err);
});

exports.insertData = function(first,last,sign) {
    return getFromDb('INSERT into signatures(firstname, lastname, signature) VALUES($1, $2, $3) RETURNING id',[first,last,sign]).then(function(result) {
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
