# JS Library for Client

## How To

1. include **syaukilce.js** in your html file
    ```html
    <html>
        ...
        <script src="syaukilce.js"></script>
        ...
    </html>
    ```
2. initialize **SyaukilCE** object instance
    ```javascript
        var sce = new SyaukilCE('http://192.168.1.203:3000',
        {
            token: your_login_token,
            singleRoomOnly: false, // set to true for singleRoom handling like Classmiles
            room_id: room_id, // only exist if singleRoomOnly=true
            success: function(data){
                // handle success
            },
            error: function(err){
                // handle error
            },
            chatHistory: function(data){
                // handle chat history
                // only called if singleRoomOnly=true
            },
            onChatData: function(data){
                // called anytime user receive a chat message
            }
        });
    ```
## Sending Chat

     sce.sendChat(options);
**options**
| option name | type | value |
| --- | --- | --- |
| room_id | string | room_id of where you wanna send your chat to |
| chat_type | string | the type of chat ( 'text', 'image') ps: only 'text' supported by now |
| chat_value | string | chat value
| success | function | a success callback |
| error | function | an error callback |

**example**
```javascript
    sce.sendChat({
        room_id: '123456',
        chat_type: 'text',
        chat_value: 'hello,
        success: function(data){
            // returned newly generated chat_id
            // console.log('chat sent! id :' + data.chat_id);
        }
    });
```


