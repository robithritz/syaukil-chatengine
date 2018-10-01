var express     = require('express'),
    bcrypt      = require('bcryptjs'),
    myngoose    = require('../models/user'),
    jwt         = require('jsonwebtoken'),
    passport    = require('passport'),
    PNF         = require('google-libphonenumber').PhoneNumberFormat,
    phoneUtil   = require('google-libphonenumber').PhoneNumberUtil.getInstance(),
    secretKey   = require('../config/config').secretKey,
    router      = express.Router();


router.post('/addUser', (req, res) => {
    console.log(req.body);
    var phone;

    if(req.body.user_phonenum){
        const number = phoneUtil.parseAndKeepRawInput(req.body.user_phonenum, 'ID');
        const phone  = phoneUtil.format(number, PNF.INTERNATIONAL);
    }

    bcrypt.genSalt(10, (err, salted) => {
        bcrypt.hash(req.body.password, salted, (err, hashed) => {
            myngoose.addUser({user_name: req.body.user_name, username: req.body.username, password: hashed, user_phonenum: phone}, (err, result) => {
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
                console.log(err);
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

router.post('/changeProfile', passport.authenticate('jwt', { session: false }), (req, res) => {
    var field_array = [];
    var value_array = [];
    var query_string ="";

    if(req.body.user_name) {
        field_array.push("user_name");
        value_array.push(req.body.user_name);
    }
    if(req.body.user_phonenum) {
        field_array.push("user_phonenum");
        const number = phoneUtil.parseAndKeepRawInput(req.body.user_phonenum, 'ID');
        value_array.push(phoneUtil.format(number, PNF.INTERNATIONAL));
    }

    myngoose.changeProfile({user_id: req.user.user_id, field_array: field_array, value_array: value_array}, (err, result) => {
        if(!err){
            res.json({status: true, message: "Updated", data: result});
        }else{
            res.json({status: false, message: "Something went wrong"});
        }
    });
});
router.post('/findUser', passport.authenticate('jwt', { session: false }), (req, res) => {
    if(!req.body.user_phonenum){
        res.json({status: false, message: "Field incomplete"}); return;
    }
    var phone =  req.body.user_phonenum;
    const number = phoneUtil.parseAndKeepRawInput(phone, 'ID');

    myngoose.getUserByPhonenum({user_phonenum: phoneUtil.format(number, PNF.INTERNATIONAL)}, (err, result) => {
        if(err == -2){
            // USER NOT FOUND
            res.json({status: false, message: "User not found."}); return;
        }else{
            res.json({status: true, message: "User found.", data: result}); return;
        }
    });
});
router.post('/findUserById', passport.authenticate('jwt', { session: false }), (req, res) => {
    if(!req.body.user_id){
        res.json({status: false, message: "Field incomplete"}); return;
    }

    myngoose.getUserById({user_id: req.body.user_id}, (err, result) => {
        if(err == -2){
            // USER NOT FOUND
            res.json({status: false, message: "User not found."}); return;
        }else{
            res.json({status: true, message: "User found.", data: result}); return;
        }
    });
});

module.exports = router;