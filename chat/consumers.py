import json
from channels.generic.websocket import AsyncWebsocketConsumer, WebsocketConsumer
from .models import *
from accounts.serializers import UserSerializer
from .serializers import MessageSerializer
from asgiref.sync import sync_to_async, async_to_sync
from core.settings import MessageType
from django.db.models import Max
from accounts.models import User

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("CONNECTED", end=" ", flush=True)
        self.user = self.scope['user']
        self.data = await self.get_user_chats_data()

        for key in self.data:
            if key == 'my_id':
                continue
            await self.channel_layer.group_add(
                key, self.channel_name
            )
        personal_channel_uuid = f'personal_{self.user.id}'
        await self.channel_layer.group_add(personal_channel_uuid, self.channel_name)

        await self.accept()

        await self.send(text_data=json.dumps(self.data))
        await self.mark_self_user_as_online()
        await self.notifyUsersThatSelfJoinedOnline()
        

    async def disconnect(self, close_code):
        print("DISCONNECTED ", self.user, flush=True)
        await self.mark_self_user_as_offline()
        await self.notifyUsersThatSelfWentOffline()
        # await self.disconnect_user_from_all_his_rooms()
        for key in self.data:
            if key == 'my_id':
                continue
            await self.channel_layer.group_discard(
                key, self.channel_name
            )
        personal_channel_uuid = f'personal_{self.user.id}'
        await self.channel_layer.group_discard(personal_channel_uuid, self.channel_name)

    # =======================================================================================
    # =======================================================================================
    #                                Request handlers
    # =======================================================================================
    # =======================================================================================

    async def receive(self, text_data):
        print("RECIEVED ", self.user, flush=True)
        text_data_json = json.loads(text_data)
        request = text_data_json['request_type']
        print("request type ", request)

        if request == MessageType.MESSAGE.value:
            await self.saveAndResendMessage(text_data_json)
        elif request == MessageType.UPDATED_MESSAGE.value:
            await self.updateMessageAndNotifyUsers(text_data_json)
        elif request == MessageType.DELETE_MESSAGE.value:
            await self.deleteMessageAndNotifyUsers(text_data_json)
        elif request == MessageType.ADD_REACTION.value:
            await self.addReactionAndNotifyUsers(text_data_json)
        elif request == MessageType.REMOVE_REACTION.value:
            await self.removeReactionAndNotifyUsers(text_data_json)
        elif request == MessageType.MARK_MESSAGE_AS_READ.value:
            await self.markMessageAsReadAndNotifyAuthor(text_data_json)
        elif request == MessageType.ADD_USER_TO_GROUP.value:
            await self.addUserToGroupAndNotifyUsers(text_data_json)
        elif request == MessageType.REMOVE_USER_FROM_GROUP.value:
            await self.removeUserFromGroupAndNotifyUsers(text_data_json)
        elif request == MessageType.JOIN_GROUP.value:
            await self.joinGroupAndNotifyUsers(text_data_json)
        elif request == MessageType.LEAVE_GROUP.value:
            await self.leaveGroupAndNotifyUsers(text_data_json)
        elif request == MessageType.CREATE_PRIVATE_ROOM.value:
            await self.createPrivateRoomAndNotifyUsers(text_data_json)
        elif request == MessageType.CONNECT_SELF_TO_GROUP.value:
            await self.connectSelfToGroup(text_data_json)

    async def saveAndResendMessage(self, message_data):
        message = message_data['message']
        room_uuid = message_data['room_uuid']

        message_data = await self.save_message(message, room_uuid)
        if not message_data:
            return

        event = {
            "type": "chat.message",
            "msg_type": MessageType.MESSAGE.value,
            "message_data": message_data,
            "room_uuid": room_uuid,
            # "author": self.user.id,
            # "id": id_date[0],
            # "created_at": id_date[1].strftime('%a %H:%M  %d/%m/%y'),
            # "updated": False,
        }
        
        await self.channel_layer.group_send(
            room_uuid, event
        )

    async def updateMessageAndNotifyUsers(self, message_data):
        msg_id = message_data['msg_id']
        new_text = message_data['message']
        room_uuid = message_data['room_uuid']

        success = await self.update_message(msg_id, new_text)
        if not success: return

        event = {
            "type": "chat.message",
            "msg_type": MessageType.UPDATED_MESSAGE.value,
            "message": new_text,
            "room_uuid": room_uuid,
            "author": self.user.id,
            "id": msg_id,
        }
            
        await self.channel_layer.group_send(
            room_uuid, event
        )
    
    async def deleteMessageAndNotifyUsers(self, message_data):
        msg_id = message_data['msg_id']
        room_uuid = message_data['room_uuid']

        success = await self.delete_message(msg_id)
        if not success: return

        event = {
            "type": "chat.message",
            "msg_type": MessageType.DELETE_MESSAGE.value,
            "room_uuid": room_uuid,
            "author": self.user.id,
            "id": msg_id,
        }
            
        await self.channel_layer.group_send(
            room_uuid, event
        )

    async def addReactionAndNotifyUsers(self, message_data):
        room_uuid = message_data['room_uuid']
        msg_id = message_data['msg_id']
        emoji_unicode = message_data['emoji_unicode']

        reaction_created_at = await self.add_reaction_to_message(msg_id, emoji_unicode)
        if not reaction_created_at: return

        event = {
            "type": "chat.message",
            "msg_type": MessageType.ADD_REACTION.value,
            "room_uuid": room_uuid,
            "id": msg_id,
            "author": self.user.id,
            "created_at": reaction_created_at.strftime('%a %H:%M  %d/%m/%y'),
            "emoji_unicode": emoji_unicode,
        }
            
        await self.channel_layer.group_send(
            room_uuid, event
        )

    async def removeReactionAndNotifyUsers(self, message_data):
        room_uuid = message_data['room_uuid']
        msg_id = message_data['msg_id']

        emoji_of_reaction_removed = await self.remove_reaction_from_message(msg_id)
        if not emoji_of_reaction_removed: return

        event = {
            "type": "chat.message",
            "msg_type": MessageType.REMOVE_REACTION.value,
            "room_uuid": room_uuid,
            "id": msg_id,
            "author": self.user.id,
            "emoji_unicode": emoji_of_reaction_removed,
        }
            
        await self.channel_layer.group_send(
            room_uuid, event
        )

    async def markMessageAsReadAndNotifyAuthor(self, message_data):
        msg_id = message_data['msg_id']

        msg_info = await self.mark_message_as_read(msg_id)
        if not msg_info:
            return
        room_uuid, readed_at = msg_info[0], msg_info[1]

        event = {
            "type": "chat.message",
            "msg_type": MessageType.MARK_MESSAGE_AS_READ.value,
            "room_uuid": room_uuid,
            "id": msg_id,
            "readed_by": self.user.id,
            "readed_at": readed_at
        }
            
        await self.channel_layer.group_send(
            room_uuid, event
        )

    async def addUserToGroupAndNotifyUsers(self, request_data):
        # check types of input
        if 'member_id' not in request_data or 'room_uuid' not in request_data:
            return
        member_id = request_data['member_id']
        room_uuid = request_data['room_uuid']
        if type(member_id) != int or type(room_uuid) != str:
            return

        # add user to group
        member_data = await self.add_user_to_group(member_id, room_uuid)
        if not member_data:
            return
        
        # ask member to join to group channel layer
        event = {
            "type": "join.group",
            "room_uuid": room_uuid,
        }
        member_personal_channel = f'personal_{member_id}'
        await self.channel_layer.group_send(
            member_personal_channel, event
        )

        # send notification to group
        event = {
            "type": "chat.message",
            "msg_type": MessageType.ADD_USER_TO_GROUP.value,
            "room_uuid": room_uuid,
            "member_id": member_id,
            "member_data": member_data,
        }
            
        await self.channel_layer.group_send(
            room_uuid, event
        )

    async def removeUserFromGroupAndNotifyUsers(self, request_data):
        # check types of input
        if 'member_id' not in request_data or 'room_uuid' not in request_data:
            return
        member_id = request_data['member_id']
        room_uuid = request_data['room_uuid']
        if type(member_id) != int or type(room_uuid) != str:
            return
        
        # remove user from group in db
        success = await self.remove_user_from_group(member_id, room_uuid)
        if not success:
            return
        
        # ask member to leave from group channel layer
        event = {
            "type": "leave.group",
            "room_uuid": room_uuid,
        }
        member_personal_channel = f'personal_{member_id}'
        await self.channel_layer.group_send(
            member_personal_channel, event
        )

        # send notification to group
        event = {
            "type": "chat.message",
            "msg_type": MessageType.REMOVE_USER_FROM_GROUP.value,
            "room_uuid": room_uuid,
            "member_id": member_id,
        }
            
        await self.channel_layer.group_send(
            room_uuid, event
        )

    async def joinGroupAndNotifyUsers(self, request_data):
        if ('room_uuid' not in request_data 
            or type(request_data['room_uuid']) != str):
            return
        
        room_uuid = request_data['room_uuid']
        
        # add user to group
        group_data = await self.add_self_to_group(room_uuid)
        if not group_data:
            return
        
        # join to group channel layer
        event = {
            "room_uuid": room_uuid,
            "room_info": group_data,
            "msg_type": MessageType.JOIN_GROUP.value
        }
        await self.send(json.dumps(event))

        # send notification to group
        member_data = UserSerializer(self.user)
        event = {
            "type": "chat.message",
            "msg_type": MessageType.ADD_USER_TO_GROUP.value,
            "room_uuid": room_uuid,
            "member_id": self.user.id,
            "member_data": member_data,
        }
            
        await self.channel_layer.group_add(
            room_uuid, self.channel_name
        )

    async def leaveGroupAndNotifyUsers(self, request_data):
        if ('room_uuid' not in request_data 
            or type(request_data['room_uuid']) != str):
            return
        
        room_uuid = request_data['room_uuid']
        
        success = await self.remove_self_from_group(room_uuid)
        if not success:
            return
        
        event = {
            "room_uuid": room_uuid,
            "msg_type": MessageType.REMOVE_USER_FROM_GROUP.value,
            "member_id": self.user.id,
        }
        await self.send(json.dumps(event))

        await self.channel_layer.group_discard(
            room_uuid, self.channel_name
        )
        del self.data[room_uuid]
        
        # send notification to group
        event = {
            "type": "chat.message",
            "msg_type": MessageType.REMOVE_USER_FROM_GROUP.value,
            "room_uuid": room_uuid,
            "member_id": self.user.id,
        }
            
        await self.channel_layer.group_send(
            room_uuid, event
        )

    async def createPrivateRoomAndNotifyUsers(self, request_data):
        if ('user_id' not in request_data 
            or type(request_data['user_id']) != int):
            return
        user_id = request_data['user_id']

        room_data = await self.create_private_room(user_id)
        if not room_data:
            return
        room_info, room_uuid = room_data[0], room_data[1]

        await self.channel_layer.group_add(
            room_uuid, self.channel_name
        )

        event = {
            "msg_type": MessageType.CREATE_PRIVATE_ROOM.value,
            "room_uuid": room_uuid,
            "room_info": room_info,
        }
        await self.send(json.dumps(event))
        
        event = {
            "type": "join_private_room",
            "room_uuid": room_uuid,
        }
        member_personal_channel = f'personal_{user_id}'
        await self.channel_layer.group_send(
            member_personal_channel, event
        )

    async def connectSelfToGroup(self, request_data):
        if ('room_uuid' not in request_data 
            or type(request_data['room_uuid']) != str):
            return
        
        room_uuid = request_data['room_uuid']
        can_connect_to_such_room = await self.can_connect_to_room(room_uuid)
        if not can_connect_to_such_room:
            return
        
        group_info = await self.get_full_group_info(room_uuid)
        self.data[room_uuid] = group_info

        await self.channel_layer.group_add(
            room_uuid, self.channel_name
        )


    async def notifyUsersThatSelfJoinedOnline(self):
        event = {
            "type": "chat.message",
            "msg_type": MessageType.USER_JOINED_ONLINE.value,
            "room_uuid": '',
            "id": self.user.id,
        }

        for room_uuid in self.data:
            if room_uuid == 'my_id' or room_uuid == 'my_data':
                continue
            event["room_uuid"] = room_uuid
            await self.channel_layer.group_send(
                room_uuid, event
            )
    
    async def notifyUsersThatSelfWentOffline(self):
        event = {
            "type": "chat.message",
            "msg_type": MessageType.USER_WENT_OFFLINE.value,
            "room_uuid": '',
            "id": self.user.id,
        }

        for room_uuid in self.data:
            if room_uuid == 'my_id' or room_uuid == 'my_data':
                continue
            event["room_uuid"] = room_uuid
            await self.channel_layer.group_send(
                room_uuid, event
            )

    # =======================================================================================
    # =======================================================================================
    #                           Channel layer message handlers
    # =======================================================================================
    # =======================================================================================
    
    async def chat_message(self, event):
        print("CHAT MESSAGE HANDLER ", self.user, flush=True)

        await self.send(text_data=json.dumps(
            {i:event[i] for i in event if i!='type'}
        ))

    async def join_group(self, event):
        await self.channel_layer.group_add(
            event["room_uuid"], self.channel_name
        )
        
        room_info = await self.get_full_group_info(event["room_uuid"])
        self.data[event["room_uuid"]] = room_info
        server_response = {
            "msg_type": MessageType.ADD_USER_TO_GROUP.value,
            "room_uuid": event["room_uuid"],
            "room_info": room_info,
            "member_id": self.user.id,
        }
        await self.send(text_data=json.dumps(server_response))

    async def leave_group(self, event):
        await self.channel_layer.group_discard(
            event["room_uuid"], self.channel_name
        )

        del self.data[event["room_uuid"]]

        server_response = {
            "msg_type": MessageType.REMOVE_USER_FROM_GROUP.value,
            "room_uuid": event["room_uuid"],
            "member_id": self.user.id,
        }
        await self.send(text_data=json.dumps(server_response))

    async def join_private_room(self, event):
        await self.channel_layer.group_add(
            event["room_uuid"], self.channel_name
        )

        room_info = await self.get_full_group_info(event["room_uuid"])
        self.data[event["room_uuid"]] = room_info

        server_response = {
            "msg_type": MessageType.CREATE_PRIVATE_ROOM.value,
            "room_uuid": event["room_uuid"],
            "room_info": room_info,
        }
        await self.send(text_data=json.dumps(server_response))

    # =======================================================================================
    # =======================================================================================
    #               Synchrous function for database read, write, update
    # =======================================================================================
    # =======================================================================================

    def get_room_data(self, chat_room):
        room_data = {}
        room_data['is_private'] = chat_room.is_private

        if not chat_room.is_private:
            #set group attributes
            group_data = {}
            group_data['avatar_uuid'] = None
            if chat_room.room_avatar:
                group_data['avatar_uuid'] = str(chat_room.room_avatar.file_uuid)
            
            group_data["room_name"] = chat_room.group_name
            group_data["admin_id"] = None
            if chat_room.admin:
                group_data["admin_id"] = chat_room.admin.id
            room_data['group_data'] = group_data
            
        
        # get collocutors data dict
        collocutors = [ m for m in chat_room.members.all() if m != self.user ]
        room_data['collocutors'] = {}
        for collocutor in collocutors:
            room_data['collocutors'][collocutor.id] = UserSerializer(
                collocutor,
                many=False
            ).data
        
        # get messages array
        textings = chat_room.chat_messages.all()
        room_data['messages'] = MessageSerializer(textings, many=True).data

        # change collocutor msgs reading records to boolean value
        for msg in room_data['messages']:
            if msg['author'] != self.user.id:
                user_readed_collocutor_msg = self.user.id in msg['read_records']
                msg.pop('read_records')
                msg['readed_by_user'] = user_readed_collocutor_msg
        
        return room_data

    @sync_to_async
    def get_user_chats_data(self):
        if not self.user.is_authenticated:
            return {"invalid_data": True}
        data = {
            "my_id": self.user.id, 
            "my_data": UserSerializer(self.user, many=False).data
        }

        #chat_rooms = self.user.chat_rooms.all()
        # get chat_rooms in desending order by last message creation time
        chat_rooms = self.user.chat_rooms.annotate(
            last_message_date=Max('chat_messages__created_at')
        ).order_by("-last_message_date")
    
        for chat_room in chat_rooms:
            room_data = self.get_room_data(chat_room)

            # set created data to coresponding room
            data[chat_room.room_uuid] = room_data
    
        return data
    
    @sync_to_async
    def get_full_group_info(self, room_uuid):
        chat_room = ChatRoom.objects.get(room_uuid=room_uuid)
        room_data = self.get_room_data(chat_room)

        return room_data
    
    @sync_to_async
    def mark_self_user_as_online(self):
        user = self.user
        user.is_online = True
        user.save()

    @sync_to_async
    def mark_self_user_as_offline(self):
        user = self.user
        user.is_online = False
        user.save()
    
    @sync_to_async
    def save_message(self, text, room_uuid):
        if not ChatRoom.objects.filter(room_uuid=room_uuid).exists():
            return None
        chat_room = ChatRoom.objects.get(room_uuid=room_uuid)
        message = Message.objects.create(chat_room=chat_room, author=self.user, text=text)
        message.save()
        return MessageSerializer(message, many=False).data
    
    @sync_to_async
    def update_message(self, msg_id, new_text):
        if not self.user.msg_author.filter(id=msg_id).exists():
            return False
        
        user_message = self.user.msg_author.get(id=msg_id)
        user_message.text = new_text
        user_message.updated = True
        user_message.save()

        return True
    
    @sync_to_async
    def delete_message(self, msg_id):
        if not self.user.msg_author.filter(id=msg_id).exists():
            return False
        
        self.user.msg_author.get(id=msg_id).delete()

        return True
    
    @sync_to_async
    def add_reaction_to_message(self, msg_id, emoji_unicode):
        if (type(msg_id) is not int
            or type(emoji_unicode) is not int 
            or msg_id <= 0
            or emoji_unicode <= 0):
            return None
        
        if not Message.objects.filter(id=msg_id).exists():
            return None
        
        msg = Message.objects.get(id=msg_id)

        if msg.reactions.filter(author=self.user).exists():
            return None
        
        reaction = Reaction.objects.create(
            message=msg,
            author=self.user,
            emoji_unicode=emoji_unicode
        )
        reaction.save()
        return reaction.created_at
    
    @sync_to_async
    def remove_reaction_from_message(self, msg_id):
        if (type(msg_id) is not int 
            or msg_id <= 0):
            return None
        
        if not Message.objects.filter(id=msg_id).exists():
            return None
        
        msg = Message.objects.get(id=msg_id)

        if not msg.reactions.filter(author=self.user).exists():
            return None
        
        reaction = msg.reactions.get(author=self.user)
        emoji_unicode = reaction.emoji_unicode
        reaction.delete()

        return emoji_unicode
        
    @sync_to_async
    def mark_message_as_read(self, msg_id):
        if not Message.objects.filter(id=msg_id).exists():
            return None
        
        msg = Message.objects.get(id=msg_id)
        room_uuid = msg.chat_room.room_uuid

        if room_uuid not in self.data:
            return None

        # read_record = ReadRecord(message = msg, readed_by = self.user)
        # read_record.save()

        readed_at = '00:00:00'

        return (room_uuid, readed_at)
    
    @sync_to_async
    def is_self_group_admin(self, room_uuid):
        if not self.user.groups_admin.filter(room_uuid=room_uuid).exists():
            return False
        return True
    
    @sync_to_async
    def has_such_contact(self, member_id):
        self_private_rooms = self.user.chat_rooms.filter(is_private=True)

        for chat_room in self_private_rooms:
            if chat_room.members.filter(id=member_id).exists():
                return True

        return False
            
    @sync_to_async
    def is_user_in_group(self, member_id, room_uuid):
        member_user = User.objects.get(id=member_id)
        return member_user.chat_rooms.filter(room_uuid = room_uuid).exists()

    @sync_to_async
    def add_user_to_group(self, member_id, room_uuid):
        # find group and check if user is admin
        group_set = self.user.groups_admin.filter(room_uuid=room_uuid)
        if not group_set.exists():
            return None
        group = group_set[0]
        
        # check if user has such contact
        self_has_such_contact = self.user.chat_rooms.filter(
            is_private=True
        ).filter(members__id=member_id).exists()
        if not self_has_such_contact:
            return None
        
        member_user = User.objects.get(id=member_id)

        # check if user not already in group
        if member_user.chat_rooms.filter(room_uuid = room_uuid).exists():
            return None

        group.members.add(member_user)

        return UserSerializer(member_user, many=False).data
    
    @sync_to_async
    def remove_user_from_group(self, member_id, room_uuid):
        # find group and check if user is admin
        group_set = self.user.groups_admin.filter(room_uuid=room_uuid)
        if not group_set.exists():
            return False
        group = group_set[0]

        # find user and check if user exists
        member_user_set = User.objects.filter(id=member_id)
        if not member_user_set.exists():
            return False
        member_user = member_user_set[0]

        # check if user not already in group
        if not member_user.chat_rooms.filter(room_uuid = room_uuid).exists():
            return False

        group.members.remove(member_user)

        return True
    
    @sync_to_async
    def add_self_to_group(self, room_uuid):
        group_set = ChatRoom.objects.filter(room_uuid=room_uuid, is_private=False)
        if not group_set.exists():
            return None
        group = group_set[0]
        if self.user in group.members.all():
            return None
        group.members.add(self.user)

        return self.get_room_data(group)
    
    @sync_to_async
    def remove_self_from_group(self, room_uuid):
        group_set = self.user.chat_rooms.filter(room_uuid=room_uuid, is_private=False)
        if not group_set.exists():
            return False
        group = group_set[0]
        if self.user not in group.members.all():
            return False
        if self.user is group.admin:
            group.admin = None
        group.members.remove(self.user)

        return True
        
    @sync_to_async
    def create_private_room(self, user_id):
        self_contacts = [self.user.id]
        for room in self.user.chat_rooms.filter(is_private=True):
            members = room.members.all()
            user_a, user_b = members[0], members[1]
            if user_a.id == self.user.id:
                self_contacts.append(user_b.id)
            else:
                self_contacts.append(user_a.id)
        
        if user_id in self_contacts:
            return None
        
        collocutor_set = User.objects.filter(id = user_id)
        if not collocutor_set.exists():
            return None
        collocutor = collocutor_set[0]

        private_room = ChatRoom.objects.create()
        private_room.members.add(self.user)
        private_room.members.add(collocutor)

        return (self.get_room_data(private_room), private_room.room_uuid)
    
    @sync_to_async
    def can_connect_to_room(self, room_uuid):
        return self.user.chat_rooms.filter(is_private=False, room_uuid=room_uuid).exists()
    





class Prototype(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = "proto"

        await self.channel_layer.group_add(
            self.room_group_name, self.channel_name
        )

        await self.accept()
        

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name, self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]

        await self.channel_layer.group_send(
            self.room_group_name, {"type": "chat.message", "message": message}
        )
        
    async def chat_message(self, event):
        print("works?")
        message = event["message"]

        await self.send(text_data=json.dumps({"message": message}))
        
class Prototype1(WebsocketConsumer):
    def connect(self):
        self.room_group_name = "proto"

        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name, self.channel_name
        )

        self.accept()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name, self.channel_name
        )

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]

        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name, {"type": "chat.message", "message": message}
        )

    def chat_message(self, event):
        message = event["message"]

        self.send(text_data=json.dumps({"message": message}))
