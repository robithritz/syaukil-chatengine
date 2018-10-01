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
                connection.query("INSERT INTO users(user_name, username, user_password, user_phonenum) VALUES('" + data.user_name + "', '" + data.username + "', '" + data.password + "', '" + data.user_phonenum + "')", (err, res, fields) => {
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
module.exports.getUserByPhonenum = function(data, callback){
    pool.getConnection(function(err, connection) {
        if (err) throw err; // not connected!

        // Use the connection
        connection.query("SELECT user_id, user_name, user_phonenum FROM users WHERE user_phonenum='"+ data.user_phonenum +"'", function (error, results, fields) {
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
module.exports.changeProfile = function(data, callback){
    var q_string = "";
    data.field_array.forEach((element, idx) => {
        q_string += " " + element + "='" + data.value_array[idx] + "',";
    });

    q_string = q_string.replace(/\,+$/g,'');

    pool.getConnection(function(err, connection) {
        if (err) throw err; // not connected!

        // Use the connection
        connection.query("UPDATE users SET "+ q_string + " WHERE user_id='" + data.user_id + "'", function (error, results, fields) {
            if(err){
                connection.release();
                callback(-1, null);
            }else{
                connection.query("SELECT user_id, user_name, user_phonenum FROM users WHERE user_id='"+ data.user_id +"'", function (error, results, fields) {
                    if(results.length > 0) {
                        connection.release();
                        callback(err, results[0]);
                    }else{
                        connection.release();
                        callback(-2, null);
                    }
                });
            }
        });
    });
}