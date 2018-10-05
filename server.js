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
var chatEntity = require('./models/chatEntity');
// const __roomPrefix = 'R';

app.use(cors());
app.use(bodyParser.json())
app.use('/static', express.static(__dirname+ '/src'));

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
                        socket.join(element.id);
                        console.log('joined ' + element.id);
                    });
                    chatEntity.getMyUndelivered({user_id: decoded.user_id}, function(err, result2){
                        socket.emit('setProfile:response', {code: 1, message: 'Authorized token', undelivered_chat: result2});
                    });
                });
            }
        })
    });
    socket.on('createPrivateRoom', (data) => {
        if(socket.user_profile === undefined){
            socket.emit('unauthorize', {code: 401, message: 'Socket Unauthorized'});
            return;
        }
        // user creator got from token
        // console.log('someone createdroom ' + JSON.stringify(socket.user_profile));
        room_info.createRoom({room_type: 'private', user_creator: socket.user_profile.user_id, user_invited: data.participant_id}, function(err, result){ 
            if(!err) {
                room_info.roomAddUser({room_id: result.room_id, user_id: data.participant_id, role: 'Admin'}, function(err, result2){
                     // why role Admin because it's private room, if it isn't then role is null, client can set role with roomSetUserRole
                    if(!err) {
                        // JOINING ALL USER TO THIS ROOM
                        myngoose.getUserById({user_id: socket.user_profile.user_id}, (err, prof) => {
                            socket.join(result.room_id);
                            io.to(data.participant_id).emit('invitedToRoom',{room_id: result.room_id, inviter_profile: prof })
                            socket.emit('createPrivateRoom:response', {code: 1, message: 'Successful', data: {room_id: result.room_id}});
                        });
                    }
                });
            } if(err == 101){
                myngoose.getUserById({user_id: socket.user_profile.user_id}, (err, prof) => {
                    socket.join(result.room_id);
                    io.to(data.participant_id).emit('invitedToRoom',{room_id: result.room_id, inviter_profile: prof })
                    socket.emit('createPrivateRoom:response', {code: 1, message: 'Successful', data: {room_id: result.room_id}});
                });
            }else{
                socket.emit('createPrivateRoom:response', {code: -1, message: 'Failed'});
            }
        });
    });

    // CLASSMILES PURPOSES //

    socket.on('createSingleRoom', (data) => {
        if(socket.user_profile === undefined){
            socket.emit('unauthorize', {code: 401, message: 'Socket Unauthorized'});
            return;
        }
        // user creator got from token
        // console.log('someone createdroom ' + JSON.stringify(socket.user_profile));
        room_info.createSingleRoom({room_id: data.room_id, room_type: 'group', user_creator: socket.user_profile.user_id, role: 'normal'}, function(err, result){
            socket.join(data.room_id);
            socket.emit('createSingleRoom:response', {code: 1, message: 'Successful'});
        });
    });
    // END CLASSMILES PURPOSES //

    socket.on('joinMeToRoom', (data) => {
        if(socket.user_profile === undefined){
            socket.emit('unauthorize', {code: 401, message: 'Socket Unauthorized'});
            return;
        }
        socket.join(data.room_id);
    });
    socket.on('sendChat', (data) => {
        if(socket.user_profile === undefined){
            socket.emit('unauthorize', {code: 401, message: 'Socket Unauthorized'});
            return;
        }
        console.log(JSON.stringify(data));
        // SAVE MESSAGE TO UNDELIVERED_TABLE OF EACH PARTICIPANT

        chatEntity.pushChat({room_id: data.room_id, user_id: socket.user_profile.user_id, chat_type: 'text', chat_value: data.message }, function(err, result){
            socket.emit('sendChat:response', {chat_id: result._id});
            socket.broadcast.to(data.room_id).emit('receiveChat', { room_id: data.room_id, chat_id: result._id, sender: socket.user_profile.user_id, chat_type: 'text', chat_value: data.message});
        });
    });
    socket.on('chat_ack:delivered', (data) => {
        if(socket.user_profile === undefined){
            socket.emit('unauthorize', {code: 401, message: 'Socket Unauthorized'});
            return;
        }
        console.log('ack:delivered by ' + socket.user_profile.user_id + ' , chat '+ data.chat_id);
        // MENGHAPUS DATA DARI TABLE UNDELIVERED, NOTIFY USER CREATOR BAHWA MESSAGE DELIVERED
        chatEntity.ackDelivered({chat_id: data.chat_id, user_id: socket.user_profile.user_id}, function(err, result){
            io.to(result.user_creator).emit('chat_ack:delivered', {chat_id: data.chat_id, target_user_delivered: socket.user_profile.user_id});
        });
    });
    socket.on('chat_ack:read', (data) => {
        if(socket.user_profile === undefined){
            socket.emit('unauthorize', {code: 401, message: 'Socket Unauthorized'});
            return;
        }
        console.log('ack:read by ' + socket.user_profile.user_id + ' , room '+ data.room_id);
        // MENGHAPUS DATA CHAT DARI TABLE UNREAD DI ROOM DAN TARGET USER YANG BERSANGKUTAN, MENGAMBIL DATA CHAT NYA DAN MENOTIFY MASING2 CREATOR NYA
        chatEntity.ackRead({room_id: data.room_id, user_id: socket.user_profile.user_id}, function(err, result){
            console.log('ackRead CB : ' + JSON.stringify(result));
            result.chat_list.forEach(element => {
                io.to(element.creator_user_id).emit('chat_ack:read', {room_id: data.room_id, chat_id: element.chat_id, target_user_delivered: socket.user_profile.user_id});    
            });
            
        });
    });
    socket.on('get_chat_history', (data) => {
        if(socket.user_profile === undefined){
            socket.emit('unauthorize', {code: 401, message: 'Socket Unauthorized'});
            return;
        }

        amt = data.amt || 10;
        pg = data.pg || 1;

        // POOL CHAT HISTORY DESCENDING NEWEST VALIDASI APAKAH user yang merequest itu benar ada di room_id requested
        chatEntity.getChatHistory({room_id: data.room_id, user_request: socket.user_profile.user_id, amt: amt, pg: pg}, function(err, result){
            socket.emit('get_chat_history:response', {message: 'Successful', data: result});
        });
    });



    socket.on('disconnect', () => {
        console.log('disconnected');
    });
});



server.listen('3000', () => {
    console.log('Server running  on 3000');
});