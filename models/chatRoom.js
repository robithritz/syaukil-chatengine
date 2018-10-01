var mongoose    = require('mongoose'),
    Schema      = mongoose.Schema;

var room_infoSchema = new Schema({
    room_type: String,
    participant: [{user_id: Number, role: String}],
    created_at: {type: Date, default: Date.now}
}, {collection: 'room_info'});


var room_info = module.exports = mongoose.model('room_info', room_infoSchema);

module.exports.createRoom = function(data, callback) {

    var n = new room_info();
    n.room_type = data.room_type;
    n.participant = [{user_id: data.user_creator, role: 'Admin'}];
    n.save(function (err, small) {
        if (err) callback(handleError(err), {message: 'Something went wrong'});

        callback(0, {message: 'Successful', room_id: small.id});
      });
}

module.exports.roomAddUser = function(data, callback) {

    room_info.updateOne({ _id: data.room_id }, { $push: { participant: {user_id: data.user_id, role: data.role} } }, function (err, small) {
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
    room_info.findOne({_id: data.room_id}, {_id: 0, participant: 1}, function(err, result){
        callback(0, result.participant);
    });
}
function handleError(err) {
    console.log(err);
    return 1;
}