var mongoose    = require('mongoose'),
    Schema      = mongoose.Schema;


var room_info = require('./chatRoom');

var chat_historySchema = new Schema({
    room_id: String,
    user_id: Number,
    chat_type: String,
    chat_value: String,
    created_at: {type: Date, default: Date.now}
}, {collection: 'chat_history'});

var chat_undeliveredSchema = new Schema({
    chat_id: Schema.Types.ObjectId,
    room_id: String,
    creator_user_id: Number,
    target_user_id: Number,
    chat_type: String,
    chat_value: String,
    created_at: {type: Date, default: Date.now}
}, {collection: 'chat_undelivered'});

var chat_unreadSchema = new Schema({
    chat_id: Schema.Types.ObjectId,
    room_id: String,
    creator_user_id: Number,
    target_user_id: Number,
    chat_type: String,
    chat_value: String,
    created_at: {type: Date, default: Date.now}
}, {collection: 'chat_unread'});


var chat_history = module.exports = mongoose.model('chat_history', chat_historySchema);
var chat_undelivered = module.exports = mongoose.model('chat_undelivered', chat_undeliveredSchema);
var chat_unread = module.exports = mongoose.model('chat_unread', chat_unreadSchema);

module.exports.pushChat = function(data, callback) {

    var n = new chat_history();
    n.room_id = data.room_id;
    n.user_id = data.user_id;
    n.chat_type = data.chat_type;
    n.chat_value = data.chat_value;
    n.save(function (err, small) {
        if (err) callback(handleError(err), {message: 'Something went wrong'});

        room_info.getParticipantOfRoom({room_id: data.room_id}, function(err, res){

            res.forEach(element => {
                if(element.user_id != data.user_id){
                    chat_undelivered.create({chat_id: small.id, room_id: data.room_id, creator_user_id: data.user_id, target_user_id: element.user_id, chat_type: data.chat_type, chat_value: data.chat_value});
                }
            });
        });
        callback(0, {message: 'Successful', _id: small.id});
      });
}
module.exports.ackDelivered = function(data, callback) {
    chat_undelivered.findOne({chat_id: data.chat_id, target_user_id: data.user_id}, function(err, res){
        if(res == null) {
            console.log("CHAT NULL " + JSON.stringify(data));
            setTimeout(function(){
                chat_undelivered.findOne({chat_id: data.chat_id, target_user_id: data.user_id}, function(err, res){
                    chat_unread.create({chat_id: res.chat_id, room_id: res.room_id, creator_user_id: res.creator_user_id, target_user_id: res.target_user_id, chat_type: res.chat_type, chat_value: res.chat_value}, function(err, res2){
                        if(err) console.log(err);
                        
                        chat_undelivered.deleteOne({chat_id: data.chat_id, target_user_id: data.user_id}, function(err, res3){
                            callback(0, {message: 'Successful', user_creator: res.creator_user_id});
                        });
                    });
                });
            },1500);
        }else{
            chat_unread.create({chat_id: res.chat_id, room_id: res.room_id, creator_user_id: res.creator_user_id, target_user_id: res.target_user_id, chat_type: res.chat_type, chat_value: res.chat_value}, function(err, res2){
                if(err) console.log(err);
                
                chat_undelivered.deleteOne({chat_id: data.chat_id, target_user_id: data.user_id}, function(err, res3){
                    callback(0, {message: 'Successful', user_creator: res.creator_user_id});
                });
            });
        }
        
    });
}
module.exports.ackRead = function(data, callback) {
    chat_unread.find({room_id: data.room_id, target_user_id: data.user_id}, function(err, res){
        if(err) console.log(err);
        
        if(res != null){
            chat_unread.deleteMany({room_id: data.room_id, target_user_id: data.user_id}, function(err, res2){
                callback(0, {message: 'Successful', chat_list: res}); return;
            });
        }else{
            callback(0, {message: 'Successful', chat_list: []}); return;
        }
        
    });
}

module.exports.getMyUndelivered = function(data, callback) {
    chat_undelivered.find({target_user_id: data.user_id}, {}, { created_at: 1}, function(err, res){
        // console.log(res);
        if(err) {
            callback(0, []);
            return;
        }
        callback(0, res);
    });
}
module.exports.getChatHistory = function(data, callback) {
    room_info.findRoomMatchParticipant({room_id: data.room_id, participant_user_id: data.user_request}, function(err, res){
        if(res != null) {
            chat_history.find({room_id: data.room_id}, {room_id: 0}).limit(data.amt).skip((data.pg-1)*data.amt).sort({created_at: -1}).exec(function(err, res){
                if(res != null) {
                    callback(0, res);
                }else{
                    callback(0, []);
                }
            });
        }else{
            callback(0, []);
        }
    });
}

function handleError(err) {
    console.log(err);
    return 1;
}