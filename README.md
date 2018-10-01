# Syaukil Chat Engine SDK

## Version 1.0.0

**Event Emitter**

        Each request parameters should parsed as object except for **setProfile** emitter.

| Event Name | Description | Parameter |
| --- | --- | --- |
| setProfile | This event should emitted first after socket connected. Token parameter given by login endpoint from REST API. | Token ( plain string ) |
| createPrivateRoom | Create a private room with 1 participant, this event automated joining user creator this room , and send an invitation to target participant so it can emit to **joinMeToRoom** to join in the same room | { participant\_id } |
| joinMeToRoom | Joining a user to a given room\_id | { room\_id } |
| sendChat | Send chat to a given room\_id | { room\_id, message } |
| chat\_ack:delivered | every chat gotten from **receiveChat** or **setProfile:response** should set an acknowledgment by this event emitter, so the chat creator knows that specific message has delivered to a target user | { chat\_id } |
| chat\_ack:read | After a user read messages in specific room , app should send a read acknowledgement by this event emitter, so the chat creator knows that all message of a specific room has read by a target user | { room\_id } |



**Event Listener**

        Each responses data are parsed as object.

| Event Name | Description | Response Data |
| --- | --- | --- |
| setProfile:response | This event called as a response of **setProfile** emitter, indicating weather client authorized or not. The _undelivered\_chat_ response object are list of undelivered chat that client should parse to the application and give acknowledgment in each chat message | { code, message, undelivered\_chat (array) : [{ chat\_id, room\_id, creator\_user\_id } ,...] } |
| createPrivateRoom:response | This event called as a response of **createPrivateRoom** emitter. | { code, message, data (object) : { room\_id } } |
| sendChat:response | This event called as a response of **sendChat** emitter, giving chat\_id as identifier of chat data | { chat\_id } |
| receiveChat | called when a user got a chat message from another user of a specific room\_id that this user has joined | { room\_id, chat\_id, sender, chat\_type, chat\_value } |
| chat\_ack:delivered | This event called as a response of chat acknowledgement for chat creator, indicating that someone has acknowledged the message sent by this user creator | { chat\_id, target\_user\_delivered } |
| chat\_ack:read | This event called as a response of chat read acknowledgement for chat creator(s), indicating that someone has read the whole message. Event will called continuously until all message acknowledgement sent | { room\_id, chat\_id, target\_user\_delivered } |