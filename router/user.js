var express     = require('express'),
    bcrypt      = require('bcryptjs'),
    myngoose    = require('../models/user'),
    jwt         = require('jsonwebtoken'),
    secretKey   = require('../config/config').secretKey,
    router      = express.Router();


router.post('/addUser', (req, res) => {
    console.log(req.body);

    bcrypt.genSalt(10, (err, salted) => {
        bcrypt.hash(req.body.password, salted, (err, hashed) => {
            myngoose.addUser({user_name: req.body.user_name, username: req.body.username, password: hashed}, (err, result) => {
                if(err){
                    if(err == -1){
                        console.log(err);
                        res.json({status: false, message: "Username already taken."}); return;
                    }
                    console.log(err);
                    res.json({status: false, message: "Internal server error"}); return;
                }
                res.json({status: true, message: 'Successful'}); return;
            });
        })
    })
})

router.post('/login', (req, res) => {
    console.log(req.body);

    myngoose.getUser({username: req.body.username}, (err, result) => {
        if(err == -2){
            // USER NOT FOUND
            res.json({status: false, message: "Wrong username or password."}); return;
        }else{
            bcrypt.compare(req.body.password, result.user_password, function(err, bcryptResult) {
                if(bcryptResult === true) {
                    data = {user_id: result.user_id, user_name: result.user_name, username: result.username, user_phonenum: result.user_phonenum};
                    jwt.sign(data, secretKey, (err, token) => {
                        if(err){
                            res.json({status: false, message: "Something went wrong"});
                            return;
                        }
                        res.json({status: true, message: "Successfully Logged In.", auth_token: "JAuth "+token, data: data}); return;
                        return;
                    })
                }else{
                    res.json({status: false, message: "Wrong username or password."}); return;
                }
            });
        }
    });

})

module.exports = router;