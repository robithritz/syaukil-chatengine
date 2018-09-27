const express   = require('express'),
    app         = express(),
    server      = require('http').Server(app),
    mongoose    = require('mongoose'),
    cors        = require('cors'),
    bodyParser  = require('body-parser'),
    mysql       = require('mysql'),
    passport    = require('passport'),
    jwt         = require('jsonwebtoken'),
    mongodbConf      = require('./config/config').mongoDbConf,
    secretKey   = require('./config/config').secretKey,
    io          = require('socket.io')(server);

var User        = require('./router/user');

var myngoose        = require('./models/user');
mongoose.connect(mongodbConf);
var room_info = require('./models/chatRoom');
const __roomPrefix = 'R';

app.use(cors());
app.use(bodyParser.json())
app.use('/static', express.static(__dirname+ '/static'));

app.use('/user', User);
require('./libs/passport-jwt')(passport)

app.get('/' ,(req, res) => {
    res.sendFile(__dirname + '/src/index.html');
});
app.get('/2' ,(req, res) => {
    res.sendFile(__dirname + '/src/index2.html');
});

io.on('connection', (socket) => {
    console.log('Someone Connected');

    socket.on('setProfile', (token) => {
        // DISINI TERJADI PREPARING DATA DARI SERVER UNTUK CLIENT
        // MELIPUTI 1. PENGAMBILAN DATA SELURUH ROOM DIMANA USER SPECIFIC TERDAPAT DIDALAM NYA, LALU USER SPECIFIC DI JOINKAN KEDALAM SELURUH ROOM TSBT
        // 2. PENGAMBILAN DATA UNDELIVERED CHAT USER SPECIFIC LALU MENGIRIM SEMUA CHAT NYA ( fcm berperan menentukan delivered dan tidak nya chat)
        jwt.verify(token.replace("JAuth ", ""), secretKey, function(err, decoded){
            if(err){
                socket.emit('setProfile:response', {code: -1, message: 'Invalid token'});
            }else{
                socket.user_profile = decoded;
                // socket.user_name = decoded.user_name;
                socket.join(decoded.user_id); // identifier untuk server ketika mau kirim message ke specific user by id
                room_info.getAllMyRoom({user_id: decoded.user_id}, function(err, result){
                    // console.log(JSON.stringify(result));
                    // MENJOIN KAN KE SEMUA ROOM
                    result.forEach(element => {
                        socket.join(__roomPrefix + element.id);
                        console.log('joined ' + __roomPrefix + element.id);
                    });
                });
                socket.emit('setProfile:response', {code: 1, message: 'Authorized token', undelivered_chat: []});
            }
        })
    });
    socket.on('createPrivateRoom', (data) => {
        // user creator got from token
        // console.log('someone createdroom ' + JSON.stringify(socket.user_profile));
        room_info.createRoom({room_type: 'private', user_creator: socket.user_profile.user_id}, function(err, result){ 
            if(!err) {
                room_info.roomAddUser({room_id: result.room_id, user_id: data.participant_id, role: 'Admin'}, function(err, result2){
                     // why role Admin because it's private room, if it isn't then role is null, client can set role with roomSetUserRole
                    if(!err) {
                        // JOINING ALL USER TO THIS ROOM
                        myngoose.getUserById({user_id: socket.id}, (err, prof) => {
                            socket.join(__roomPrefix + result.room_id);
                            io.to(data.participant_id).emit('invitedToRoom',{room_id: __roomPrefix + result.room_id, inviter_profile: prof })
                            socket.emit('createPrivateRoom:response', {code: 1, message: 'Successful', data: {room_id: __roomPrefix + result.room_id}});
                        });
                    }
                });
            }else{
                socket.emit('createPrivateRoom:response', {code: -1, message: 'Failed'});
            }
        });
    });
    socket.on('joinMeToRoom', (data) => {
        socket.join(data.room_id.replace("R", ""));
    });
    socket.on('sendChat', (data) => {
        console.log(JSON.stringify(data));
        socket.broadcast.to(data.room_id).emit('receiveChat', { room_id: data.room_id, sender: socket.user_profile.user_id, value: data.message});
    });
    socket.on('spookyRoom', (data) => {
        // socket.user = data.user_id;
        // socket.join('spookyRoom')
        socket.user_name = data.user_id;
        socket.join('R5baa246d6bfca414f46d96dd');
        socket.join('R5666');
        console.log('joined R5baa246d6bfca414f46d96dd');
        console.log('joined R5666');
    });
    socket.on('spookyRoom:chat', (data) => {
        console.log('kena');
        socket.broadcast.to('spookyRoom').emit('spookyRoom:chat', {sender: socket.user, value: data});
    })


    socket.on('disconnect', () => {
        console.log('disconnected');
    });
});

// setInterval(function(){
//     io.to('spookyRoom').emit('forSpookers', 'hai');
// },2000);

server.listen('3000', () => {
    console.log('Server running  on 3000');
});