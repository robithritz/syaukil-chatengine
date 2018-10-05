var mongoose    = require('mongoose'),
    Schema      = mongoose.Schema;

var room_infoSchema = new Schema({
    room_type: String,
    participant: [ new Schema({user_id: Number, role: String}, {_id: false})],
    created_at: {type: Date, default: Date.now}
}, {collection: 'room_info'});


var room_info = module.exports = mongoose.model('room_info', room_infoSchema);

module.exports.createRoom = function(data, callback) {

    room_info.findOne({ room_type: 'private', 'participant.user_id': { $all: [data.user_creator, data.user_invited] } }, function(err , res){
        if(res){
            callback(101, {message: 'Successful', room_id: res._id});
        }else{
            var n = new room_info();
            n.room_type = data.room_type;
            n.participant = [{user_id: data.user_creator, role: 'Admin'}];
            n.save(function (err, small) {
                if (err) callback(handleError(err), {message: 'Something went wrong'});

                callback(0, {message: 'Successful', room_id: small.id});
            });
        }
    });
    
}

module.exports.createSingleRoom = function(data, callback) {

    _id = validateObjectId(data.room_id);
    room_info.create({_id: _id, room_type: 'group', participant: [{user_id: data.user_creator, role: 'Admin'}]}, function(err, res){
        if(err.code == 11000){
            room_info.findOneAndUpdate({_id: _id, 'participant.user_id': { $ne: data.user_creator } }, { $push: { participant: {user_id: data.user_creator, role: data.role} } }, function(err, res2){
                callback(0, {message: 'Successful'});
            });
        }else{
            callback(0, {message: 'Successful'});
        }
    });
}

module.exports.roomAddUser = function(data, callback) {
    _id = validateObjectId(data.room_id);
    room_info.updateOne({ _id: _id }, { $push: { participant: {user_id: data.user_id, role: data.role} } }, function (err, small) {
        if (err) callback(handleError(err), 'Something went wrong');
        
        callback(0,'Successful')
      });
}
module.exports.getAllMyRoom = function(data, callback) {
    room_info.find({ 'participant.user_id' : data.user_id}, function(err, result){
        if (err) callback(handleError(err), 'Something went wrong');
        
        callback(0,result);
    });
}
module.exports.getParticipantOfRoom = function(data, callback) {
    _id = validateObjectId(data.room_id);
    room_info.findOne({_id: _id}, {_id: 0, participant: 1}, function(err, result){
        callback(0, result.participant);
    });
}
module.exports.findRoomMatchParticipant = function(data, callback) {
    _id = validateObjectId(data.room_id);
    room_info.findOne({_id: _id, "participant.user_id": data.participant_user_id}, function(err, res){
        callback(err, res);
    })
}
function validateObjectId(id) {
    while(id.length < 24){
        id = id+"0";
    }
    return id;
}
function handleError(err) {
    console.log(err);
    return 1;
}