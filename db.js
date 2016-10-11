
var pg = require('pg');

var client = new pg.Client('postgres://spicedling:036363976@localhost:5432/signatures');

client.connect(function(err) {
    console.log(err);
});



exports.insertData = function(first,last,sign) {

    return new Promise(function(resolve, reject) {

        client.query('INSERT into signatures(firstname, lastname, signature) VALUES($1, $2, $3) RETURNING id', [first, last, sign],
        function(err,result) {
            if(err) {
                reject(err);
            }

            else {
                resolve(result.rows[0].id);
            }

        });


    });
};


exports.countSigners = function () {
    return new Promise(function(resolve, reject) {
        client.query("SELECT COUNT(id) FROM signatures", function(err, result) {
            if(err) {
                reject(err);
            }
            else {
                var count = result.rows[0].count;
                resolve(count);

            }
        });

    });

};


exports.showSigners = function () {
    return new Promise(function(resolve, reject) {
        client.query("SELECT firstname, lastname FROM signatures", function(err, result) {
            if(err) {
                reject(err);
            }
            else {
                var results=result.rows;
                resolve(results);
            }
        });

    });

};

exports.showSignatures = function (temp) {
    return new Promise(function(resolve, reject) {

        client.query('SELECT signature FROM signatures WHERE id=' + temp, function(err, result) {
            if(err) {
                reject(err);
            }
            else {
                resolve(result.rows[0].signature);
            }
        });


    });

};
