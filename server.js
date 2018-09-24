const express   = require('express'),
    app         = express(),
    server      = require('http').Server(app),
    mongoose    = require('mongoose'),
    cors        = require('cors'),
    bodyParser  = require('body-parser'),
    mysql       = require('mysql'),
    dbConf      = require('./config/config').dbConf,
    io          = require('socket.io')(server);

var User        = require('./router/user');

var myngoose        = require('./models/user');
// mongoose.connect(dbConf.)

app.use(cors());
app.use(bodyParser.json())
app.use('/static', express.static(__dirname+ '/static'));

app.use('/user', User);

app.get('/' ,(req, res) => {
    res.sendFile(__dirname + '/src/index.html');
});


io.on('connection', (socket) => {
    console.log('Someone Connected');

    socket.on('createRoom', (data) => {
        socket.emit('hi', {user_id: data.user_id});
    });
    socket.on('test_me', (data) => {
        setInterval(function(){
            socket.emit('test_me_resp', {user: 123, nama: "Robith"});
        },2000);
        
    });

    socket.on('disconnect', () => {
        console.log('disconnected');
    });
});
server.listen('3000', () => {
    console.log('Server running  on 3000');
});