/*
	The MIT License (MIT)

	Copyright (c) 2016 Meetecho

	Permission is hereby granted, free of charge, to any person obtaining
	a copy of this software and associated documentation files (the "Software"),
	to deal in the Software without restriction, including without limitation
	the rights to use, copy, modify, merge, publish, distribute, sublicense,
	and/or sell copies of the Software, and to permit persons to whom the
	Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included
	in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
	THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
	OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
	ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
	OTHER DEALINGS IN THE SOFTWARE.
 */
//socket global var
SyaukilCE.sender;
var socket;
SyaukilCE.list_room = [];
singleRoomOnly = false;


function SyaukilCE(server, callbacks){

    callbacks.success = (typeof callbacks.success == "function") ? callbacks.success : jQuery.noop;
    callbacks.error = (typeof callbacks.error == "function") ? callbacks.error : jQuery.noop;
    singleRoomOnly = (callbacks.singleRoomOnly !== undefined) ? callbacks.singleRoomOnly : false;


    socket = io(server);
    this.isConnected = true;

    socket.emit('setProfile', callbacks.token);

    // this.connect = function()
    
    this.attach = function(options){
        console.log('halo');
    }
    this.sendChat = function(options){
        socket.emit('sendChat', {room_id: options.room_id, message: options.chat_value});
        

        socket.on('sendChat:response', function(res){
            options.success(res);
        });
    }


    // SOCKET LISTENER ======================================

    socket.on('setProfile:response', function(res){
        // console.log('response: ' + JSON.stringify(res));
        if(res.code == -1) {
            callbacks.error(res);
            return;
        }
        
        var undelivered_chat = res.undelivered_chat;
        if(undelivered_chat.length > 0){
            undelivered_chat.forEach(element => {
                var index = 0;
                if(SyaukilCE.list_room.find( room => room.room_id === element.room_id) === undefined){
                    SyaukilCE.list_room.push({room_id: element.room_id, pending_chat: []});
                    index = SyaukilCE.list_room.map(function(o) { return o.room_id; }).indexOf(element.room_id);
                    // $('#list_chatRoom').append('<a href="#" class="list-group-item list-group-item-action chatRoom" room_index="'+ index +'" room_id="' + element.room_id + '" id="CR_' + element.room_id +'">'+element.room_id+' <span class="badge badge-danger" id="CB_' + element.room_id +'"></span></a>');
                }else{
                    index = SyaukilCE.list_room.map(function(o) { return o.room_id; }).indexOf(element.room_id);
                }
                
                // console.log("index of '" + element.room_id + "': " + index);
                socket.emit('chat_ack:delivered', {chat_id: element.chat_id});
                // console.log("ACK-"+element.chat_id);
                SyaukilCE.list_room[index].pending_chat.push({chat_id: element.chat_id, creator_user_id: element.creator_user_id, chat_type: element.chat_type, chat_value: element.chat_value});
                // that = $('#CB_'+element.room_id);
                // that.html( ( parseInt( that.html() ) || 0 ) + 1 );
            });
            // console.log(SyaukilCE.list_room);
            res.undelivered_chat = SyaukilCE.list_room;
        }

        if(singleRoomOnly) {
            delete res.undelivered_chat;
            socket.emit('createSingleRoom', {room_id: callbacks.room_id});
            socket.emit('get_chat_history', {room_id: callbacks.room_id});
        }
        callbacks.success(res);
        
        
    });

    socket.on('receiveChat', function(res){
        socket.emit('chat_ack:delivered', {chat_id: res.chat_id});
        callbacks.onChatData(res);
    });

    socket.on('createSingleRoom:response', function(res){
        // console.log('singleRoom : ' + JSON.stringify(res));
    });
    socket.on('get_chat_history:response', function(res){
        res.data.map( doc => {
            doc.chat_id = doc._id;
            delete doc._id;
            delete doc.__v;
            return doc;
        })
        callbacks.chatHistory(res);
    });
    
    // END  SOCKET LISTENER ======================================
}