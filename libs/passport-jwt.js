var JwtStrategy     = require('passport-jwt').Strategy,
    JwtExtract      = require('passport-jwt').ExtractJwt,
    myngoose        = require('../models/user');
    secretKey       = require('../config/config').secretKey;

var opts = {}
opts.jwtFromRequest = JwtExtract.fromAuthHeaderWithScheme('JAuth');
opts.secretOrKey = secretKey;
// opts.issuer = 'accounts.examplesoft.com';
// opts.audience = 'yoursite.net';
module.exports = function(passport){
    passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
        console.log(jwt_payload);
        myngoose.getUser({username: jwt_payload.username}, function(err, data){
            if (err) {
                return done(err, false);
            }
            if (data) {
                return done(null, data);
            } else {
                return done(null, false);
                // or you could create a new account
            }
        });
    }));
}