var mysql       = require('mysql'),
    dbConf      = require('../config/config').dbConf;

var pool  = module.exports =  mysql.createPool(dbConf);

module.exports.addUser = function(data, callback){
    pool.getConnection(function(err, connection) {
        if (err) throw err; // not connected!

        // Use the connection
        connection.query("SELECT username FROM users WHERE username='"+ data.username +"'", function (error, results, fields) {
            if(results.length > 0) {
                connection.release();
                callback(-1, null);
            }else{
                connection.query("INSERT INTO users(user_name, username, user_password) VALUES('" + data.user_name + "', '" + data.username + "', '" + data.password + "')", (err, res, fields) => {
                    connection.release();
                    callback(err, res);
                })
            }
        });
    });
}

module.exports.getUser = function(data, callback){
    pool.getConnection(function(err, connection) {
        if (err) throw err; // not connected!

        // Use the connection
        connection.query("SELECT * FROM users WHERE username='"+ data.username +"'", function (error, results, fields) {
            if(results.length > 0) {
                connection.release();
                callback(err, results[0]);
            }else{
                connection.release();
                callback(-2, null);
            }
        });
    });
}
module.exports.getUserById = function(data, callback){
    pool.getConnection(function(err, connection) {
        if (err) throw err; // not connected!

        // Use the connection
        connection.query("SELECT user_id, user_name, user_phonenum FROM users WHERE user_id='"+ data.user_id +"'", function (error, results, fields) {
            if(results.length > 0) {
                connection.release();
                callback(err, results[0]);
            }else{
                connection.release();
                callback(-2, null);
            }
        });
    });
}