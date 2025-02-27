import json
from channels.generic.websocket import AsyncWebsocketConsumer, WebsocketConsumer
from .models import *
from accounts.serializers import UserSerializer
from .serializers import MessageSerializer, ChatRoomSerializer
from asgiref.sync import sync_to_async, async_to_sync
from core.settings import MessageType
from django.db.models import Max
from accounts.models import User


# =======================================================================================
# =======================================================================================
#                                New Message
# =======================================================================================
# =======================================================================================
class NewMessageProcessor:
    async def process(self, request, user):
        message = request['message']
        attached_img_uuid = request['attached_img_uuid']
        attached_file_uuid = request['attached_file_uuid']
        room_uuid = request['room_uuid']

        message_data = await self.save_message(
            user,
            message,
            room_uuid,
            attached_img_uuid,
            attached_file_uuid
        )
        if not message_data:
            return None

        response = {
            "type": "chat.message",
            "msg_type": MessageType.MESSAGE.value,
            "message_data": message_data,
            "room_uuid": room_uuid,
        }
        return response

    @sync_to_async
    def save_message(self, self_user, text, room_uuid, attached_img_uuid, attached_file_uuid):
        if not ChatRoom.objects.filter(room_uuid=room_uuid).exists():
            return None
        chat_room = ChatRoom.objects.get(room_uuid=room_uuid)
        
        attached_img = None
        if attached_img_uuid != None:
            if not File.objects.filter(file_uuid=attached_img_uuid).exists():
                return None
            attached_img = File.objects.get(file_uuid=attached_img_uuid)

        attached_file = None
        if attached_file_uuid != None:
            if not File.objects.filter(file_uuid=attached_file_uuid).exists():
                return None
            attached_file = File.objects.get(file_uuid=attached_file_uuid)

        message = Message.objects.create(
            chat_room=chat_room, 
            author=self_user,
            text=text,
            attached_img = attached_img,
            attached_file = attached_file
        )
        message.save()

        return MessageSerializer(message, many=False).data
    

# =======================================================================================
# =======================================================================================
#                                Update Message
# =======================================================================================
# =======================================================================================
class UpdateMessageProcessor:
    async def process(self, request, self_user):
        msg_id = request['msg_id']
        new_text = request['message']
        room_uuid = request['room_uuid']

        success = await self.update_message(self_user, msg_id, new_text)
        if not success: 
            return None

        response = {
            "type": "chat.message",
            "msg_type": MessageType.UPDATED_MESSAGE.value,
            "message": new_text,
            "room_uuid": room_uuid,
            "author": self_user.id,
            "id": msg_id,
        }
        return response

    @sync_to_async
    def update_message(self, self_user, msg_id, new_text):
        if not self_user.msg_author.filter(id=msg_id).exists():
            return False
        
        user_message = self_user.msg_author.get(id=msg_id)
        user_message.text = new_text
        user_message.updated = True
        user_message.save()

        return True


# =======================================================================================
# =======================================================================================
#                                Delete Message
# =======================================================================================
# =======================================================================================
class DeleteMessageProcessor:
    async def process(self, request, self_user):
        msg_id = request['msg_id']
        room_uuid = request['room_uuid']

        success = await self.delete_message(self_user, msg_id)
        if not success:
            return None

        response = {
            "type": "chat.message",
            "msg_type": MessageType.DELETE_MESSAGE.value,
            "room_uuid": room_uuid,
            "author": self_user.id,
            "id": msg_id,
        }
        return response
    
    @sync_to_async
    def delete_message(self, self_user, msg_id):
        if not self_user.msg_author.filter(id=msg_id).exists():
            return False
        
        self_user.msg_author.get(id=msg_id).delete()

        return True
    

# =======================================================================================
# =======================================================================================
#                                Add Reaction
# =======================================================================================
# =======================================================================================
class AddReactionProcessor:
    async def process(self, request, self_user):
        room_uuid = request['room_uuid']
        msg_id = request['msg_id']
        emoji_unicode = request['emoji_unicode']

        if not self.is_valid_input(msg_id, emoji_unicode):
            return None

        reaction_created_at = await self.add_reaction_to_message(self_user, msg_id, emoji_unicode)
        if not reaction_created_at:
            return None

        response = {
            "type": "chat.message",
            "msg_type": MessageType.ADD_REACTION.value,
            "room_uuid": room_uuid,
            "id": msg_id,
            "author": self_user.id,
            "created_at": reaction_created_at.strftime('%a %H:%M  %d/%m/%y'),
            "emoji_unicode": emoji_unicode,
        }
        return response
    
    def is_valid_input(self, msg_id, emoji_unicode):
        if (type(msg_id) is not int
            or type(emoji_unicode) is not int 
            or msg_id <= 0
            or emoji_unicode <= 0):
            return False
        return True
    
    @sync_to_async
    def add_reaction_to_message(self, self_user, msg_id, emoji_unicode):
        if not Message.objects.filter(id=msg_id).exists():
            return None
        
        msg = Message.objects.get(id=msg_id)

        if msg.reactions.filter(author=self_user).exists():
            return None
        
        reaction = Reaction.objects.create(
            message=msg,
            author=self_user,
            emoji_unicode=emoji_unicode
        )
        reaction.save()

        return reaction.created_at
    

# =======================================================================================
# =======================================================================================
#                                Remove Reaction
# =======================================================================================
# =======================================================================================
class RemoveReactionProcessor:
    async def process(self, request, self_user):
        room_uuid = request['room_uuid']
        msg_id = request['msg_id']

        emoji_of_reaction_removed = await self.remove_reaction_from_message(self_user, msg_id)
        if not emoji_of_reaction_removed: 
            return None

        response = {
            "type": "chat.message",
            "msg_type": MessageType.REMOVE_REACTION.value,
            "room_uuid": room_uuid,
            "id": msg_id,
            "author": self_user.id,
            "emoji_unicode": emoji_of_reaction_removed,
        }
            
        return response
    
    @sync_to_async
    def remove_reaction_from_message(self, self_user, msg_id):
        if (type(msg_id) is not int 
            or msg_id <= 0):
            return None
        
        if not Message.objects.filter(id=msg_id).exists():
            return None
        
        msg = Message.objects.get(id=msg_id)

        if not msg.reactions.filter(author=self_user).exists():
            return None
        
        reaction = msg.reactions.get(author=self_user)
        emoji_unicode = reaction.emoji_unicode
        reaction.delete()

        return emoji_unicode
    

# =======================================================================================
# =======================================================================================
#                             Mark Message As Read
# =======================================================================================
# =======================================================================================
class MarkMessageAsReadProcessor:
    async def process(self, request, self_user, rooms_data):
        msg_id = request['msg_id']

        msg_info = await self.mark_message_as_read(self_user, rooms_data, msg_id)
        if not msg_info:
            return None
        room_uuid, readed_at = msg_info[0], msg_info[1]

        response = {
            "type": "chat.message",
            "msg_type": MessageType.MARK_MESSAGE_AS_READ.value,
            "room_uuid": room_uuid,
            "id": msg_id,
            "readed_by": self_user.id,
            "readed_at": readed_at
        }
        return [room_uuid, response]
    
    @sync_to_async
    def mark_message_as_read(self, self_user, rooms_data, msg_id):
        if not Message.objects.filter(id=msg_id).exists():
            return None
        
        msg = Message.objects.get(id=msg_id)
        room_uuid = msg.chat_room.room_uuid

        if room_uuid not in rooms_data:
            return None

        # read_record = ReadRecord(message = msg, readed_by = self_user)
        # read_record.save()

        readed_at = '00:00:00'

        return (room_uuid, readed_at)
    

# =======================================================================================
# =======================================================================================
#                                Add User To Group
# =======================================================================================
# =======================================================================================
class AddUserToGroupProcessor:
    async def process(self, request, self_user):
        if not self.is_valid_input(request):
            return None
        member_id = request['member_id']
        room_uuid = request['room_uuid']

        # add user to group
        member_data = await self.add_user_to_group(self_user, member_id, room_uuid)
        if not member_data:
            return None
        
        response_to_member = {
            "type": "join.group",
            "room_uuid": room_uuid,
        }
        member_personal_channel = f'personal_{member_id}'

        response_to_group = {
            "type": "chat.message",
            "msg_type": MessageType.ADD_USER_TO_GROUP.value,
            "room_uuid": room_uuid,
            "member_id": member_id,
            "member_data": member_data,
        }
            
        return [member_personal_channel, response_to_member, response_to_group]

    def is_valid_input(self, request):
        if 'member_id' not in request or 'room_uuid' not in request:
            return False
        member_id = request['member_id']
        room_uuid = request['room_uuid']
        if type(member_id) != int or type(room_uuid) != str:
            return False
        return True

    @sync_to_async
    def add_user_to_group(self, self_user, member_id, room_uuid):
        # find group and check if user is admin
        group_set = self_user.groups_admin.filter(room_uuid=room_uuid)
        if not group_set.exists():
            return None
        
        group = group_set[0]
        
        # check if user has such contact
        self_has_such_contact = self_user.chat_rooms.filter(
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
    

# =======================================================================================
# =======================================================================================
#                                Remove User From Group
# =======================================================================================
# =======================================================================================
class RemoveUserFromGroupProcessor:
    async def process(self, request, self_user):
        if not self.is_valid_input(request):
            return None
        
        member_id = request['member_id']
        room_uuid = request['room_uuid']
        
        # remove user from group in db
        success = await self.remove_user_from_group(self_user, member_id, room_uuid)
        if not success:
            return None
        
        response_to_member = {
            "type": "leave.group",
            "room_uuid": room_uuid,
        }
        member_personal_channel = f'personal_{member_id}'
        
        response_to_group = {
            "type": "chat.message",
            "msg_type": MessageType.REMOVE_USER_FROM_GROUP.value,
            "room_uuid": room_uuid,
            "member_id": member_id,
        }
    
        return [member_personal_channel, response_to_member, response_to_group]

    def is_valid_input(self, request):
        if 'member_id' not in request or 'room_uuid' not in request:
            return False

        return (type(request['member_id']) == int 
                and type(request['room_uuid']) == str)
    
    @sync_to_async
    def remove_user_from_group(self, self_user, member_id, room_uuid):
        # find group and check if user is admin
        group_set = self_user.groups_admin.filter(room_uuid=room_uuid)
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


# =======================================================================================
# =======================================================================================
#                                Join To Group
# =======================================================================================
# =======================================================================================
class JoinGroupProcessor:
    async def process(self, request, self_user, self_data):
        if not self.is_valid_input(request):
            return None
        
        room_uuid = request['room_uuid']
        
        group_data = await self.add_self_to_group(self_user, room_uuid)
        if not group_data:
            return None
        
        self_data[room_uuid] = group_data
        response_to_self = {
            "room_uuid": room_uuid,
            "room_info": group_data,
            "msg_type": MessageType.JOIN_GROUP.value
        }

        member_data = UserSerializer(self_user).data
        response_to_group = {
            "type": "chat.message",
            "msg_type": MessageType.ADD_USER_TO_GROUP.value,
            "room_uuid": room_uuid,
            "member_id": self_user.id,
            "member_data": member_data,
        }
            
        return [room_uuid, response_to_self, response_to_group]
    
    def is_valid_input(self, request):
        return 'room_uuid' in request and type(request['room_uuid']) == str
    
    @sync_to_async
    def add_self_to_group(self, self_user, room_uuid):
        group_set = ChatRoom.objects.filter(room_uuid=room_uuid, is_private=False)
        if not group_set.exists():
            return None
        group = group_set[0]

        if self_user in group.members.all():
            return None
        group.members.add(self_user)

        return ChatRoomSerializer(
            group, 
            many=False, 
            context={'user': self_user}
        ).data


# =======================================================================================
# =======================================================================================
#                                Leave Group
# =======================================================================================
# =======================================================================================
class LeaveGroupProcessor:
    async def process(self, request, self_user, self_data):
        if not self.is_valid_input(request):
            return None
        
        room_uuid = request['room_uuid']
        
        success = await self.remove_self_from_group(self_user, room_uuid)
        if not success:
            return None
        
        del self_data[room_uuid]
        response_to_self = {
            "room_uuid": room_uuid,
            "msg_type": MessageType.REMOVE_USER_FROM_GROUP.value,
            "member_id": self_user.id,
        }
        
        response_to_group = {
            "type": "chat.message",
            "msg_type": MessageType.REMOVE_USER_FROM_GROUP.value,
            "room_uuid": room_uuid,
            "member_id": self_user.id,
        }

        return [response_to_self, response_to_group]

    def is_valid_input(self, request):
        return 'room_uuid' in request and type(request['room_uuid']) == str
    
    @sync_to_async
    def remove_self_from_group(self, self_user, room_uuid):
        group_set = self_user.chat_rooms.filter(room_uuid=room_uuid, is_private=False)
        if not group_set.exists():
            return False
        group = group_set[0]

        if self_user not in group.members.all(): # <----------- TODO assign new admin or delete group
            return False
        
        if self_user is group.admin:
            group.admin = None
        else:
            group.members.remove(self_user)

        return True


# =======================================================================================
# =======================================================================================
#                                Create Private Room
# =======================================================================================
# =======================================================================================
class CreatePrivateRoomProcessor:
    async def process(self, request, self_user, self_data):
        if not self.is_valid_input(request):
            return None
        user_id = request['user_id']

        room_data = await self.create_private_room(self_user, user_id)
        if not room_data:
            return None
        room_info, room_uuid = room_data[0], room_data[1]

        self_data[room_uuid] = room_info

        response_to_self = {
            "msg_type": MessageType.CREATE_PRIVATE_ROOM.value,
            "room_uuid": room_uuid,
            "room_info": room_info,
        }
        response_to_collocutor = {
            "type": "join_private_room",
            "room_uuid": room_uuid,
        }
        collocutor_channel = f'personal_{user_id}'

        responses_and_channels = {
            'room_uuid': room_uuid,
            'response_to_self': response_to_self,
            'collocutor_channel': collocutor_channel,
            'response_to_collocutor': response_to_collocutor,
        }

        return responses_and_channels

    def is_valid_input(self, request):
        return 'user_id' in request and type(request['user_id']) == int
    
    @sync_to_async
    def create_private_room(self, self_user, user_id):
        self_contacts = [self_user.id]
        for room in self_user.chat_rooms.filter(is_private=True):
            members = room.members.all()
            user_a, user_b = members[0], members[1]
            if user_a.id == self_user.id:
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
        private_room.members.add(self_user)
        private_room.members.add(collocutor)

        room_data = ChatRoomSerializer(
            private_room, 
            many=False, 
            context={'user': self_user}
        ).data

        return (room_data, private_room.room_uuid)

# =======================================================================================
# =======================================================================================
#                                Main Class Message Handler
# =======================================================================================
# =======================================================================================
class ChatConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.new_message_processor = NewMessageProcessor()
        self.update_message_processor = UpdateMessageProcessor()
        self.delete_message_processor = DeleteMessageProcessor()
        self.add_reaction_processor = AddReactionProcessor()
        self.remove_reaction_processor = RemoveReactionProcessor()
        self.mark_message_as_read_processor = MarkMessageAsReadProcessor()
        self.add_user_to_group_processor = AddUserToGroupProcessor()
        self.remove_user_from_group_processor = RemoveUserFromGroupProcessor()
        self.join_group_processor = JoinGroupProcessor()
        self.leave_group_processor = LeaveGroupProcessor()
        self.create_private_room_processor = CreatePrivateRoomProcessor()

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
        request = json.loads(text_data)
        request_type = request['request_type']
        print("request type ", request_type)

        if request_type == MessageType.MESSAGE.value:
            await self.saveAndResendMessage(request)
        elif request_type == MessageType.UPDATED_MESSAGE.value:
            await self.updateMessageAndNotifyUsers(request)
        elif request_type == MessageType.DELETE_MESSAGE.value:
            await self.deleteMessageAndNotifyUsers(request)
        elif request_type == MessageType.ADD_REACTION.value:
            await self.addReactionAndNotifyUsers(request)
        elif request_type == MessageType.REMOVE_REACTION.value:
            await self.removeReactionAndNotifyUsers(request)
        elif request_type == MessageType.MARK_MESSAGE_AS_READ.value:
            await self.markMessageAsReadAndNotifyAuthor(request)
        elif request_type == MessageType.ADD_USER_TO_GROUP.value:
            await self.addUserToGroupAndNotifyUsers(request)
        elif request_type == MessageType.REMOVE_USER_FROM_GROUP.value:
            await self.removeUserFromGroupAndNotifyUsers(request)
        elif request_type == MessageType.JOIN_GROUP.value:
            await self.joinGroupAndNotifyUsers(request)
        elif request_type == MessageType.LEAVE_GROUP.value:
            await self.leaveGroupAndNotifyUsers(request)
        elif request_type == MessageType.CREATE_PRIVATE_ROOM.value:
            await self.createPrivateRoomAndNotifyUsers(request)
        elif request_type == MessageType.CONNECT_SELF_TO_GROUP.value:
            await self.connectSelfToGroup(request)

    async def saveAndResendMessage(self, request):
        response = await self.new_message_processor.process(request, self.user)
        
        if response:
            await self.channel_layer.group_send(
                request['room_uuid'], response
            )

    async def updateMessageAndNotifyUsers(self, request):
        response = await self.update_message_processor.process(request, self.user)
        
        if response:
            await self.channel_layer.group_send(
                request['room_uuid'], response
            )
    
    async def deleteMessageAndNotifyUsers(self, request):
        response = await self.delete_message_processor.process(request, self.user)

        if response:
            await self.channel_layer.group_send(
                request['room_uuid'], response
            )

    async def addReactionAndNotifyUsers(self, request):
        response = await self.add_reaction_processor.process(request, self.user)

        if response:
            await self.channel_layer.group_send(
                request['room_uuid'], response
            )

    async def removeReactionAndNotifyUsers(self, request):
        response = await self.remove_reaction_processor.process(request, self.user)

        if response:
            await self.channel_layer.group_send(
                request['room_uuid'], response
            )

    async def markMessageAsReadAndNotifyAuthor(self, request):
        room_uuid_and_response = await self.mark_message_as_read_processor.process(
            request, self.user, self.data
        )

        if room_uuid_and_response:
            room_uuid, response = room_uuid_and_response
            await self.channel_layer.group_send(
                room_uuid, response
            )

    async def addUserToGroupAndNotifyUsers(self, request):
        member_channel_and_responses = await  self.add_user_to_group_processor.process(
            request, self.user
        )
        if member_channel_and_responses:
            member_channel, member_response, group_response = member_channel_and_responses
            await self.channel_layer.group_send(
                member_channel, member_response
            )
            await self.channel_layer.group_send(
                request['room_uuid'], group_response
            )

    async def removeUserFromGroupAndNotifyUsers(self, request):
        member_channel_and_responses = await self.remove_user_from_group_processor.process(
            request, self.user
        )

        if member_channel_and_responses:
            member_channel, member_response, group_response = member_channel_and_responses
        
            # ask member to leave from group channel layer
            await self.channel_layer.group_send(
                member_channel, member_response
            )

            # send notification to group
            await self.channel_layer.group_send(
                request['room_uuid'], group_response
            )

    async def joinGroupAndNotifyUsers(self, request):
        responses_data = await self.join_group_processor.process(
            request, self.user, self.data
        )

        if responses_data:
            room_uuid, response_to_self, response_to_group = responses_data

            # send response to self
            await self.send(json.dumps(response_to_self))

            #send response to group
            await self.channel_layer.group_send(
                room_uuid, response_to_group
            )

            # add self to group
            await self.channel_layer.group_add(
                room_uuid, self.channel_name
            )
        

    async def leaveGroupAndNotifyUsers(self, request):
        responses = await self.leave_group_processor.process(
            request, self.user, self.data
        )
        if responses:
            response_to_self, response_to_group = responses

            await self.send(json.dumps(response_to_self))

            await self.channel_layer.group_discard(
                request['room_uuid'], self.channel_name
            )

            await self.channel_layer.group_send(
                request['room_uuid'], response_to_group
            )

    async def createPrivateRoomAndNotifyUsers(self, request):
        responses_and_channels = await self.create_private_room_processor.process(
            request, self.user, self.data
        )
        if responses_and_channels:
            await self.channel_layer.group_add(
                responses_and_channels['room_uuid'], self.channel_name
            )
            await self.send(json.dumps(responses_and_channels['response_to_self']))
            await self.channel_layer.group_send( 
                responses_and_channels['collocutor_channel'],
                responses_and_channels['response_to_collocutor']
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
            room_data = ChatRoomSerializer(
                chat_room, 
                many=False, 
                context={'user': self.user}
            ).data

            # set created data to coresponding room
            data[chat_room.room_uuid] = room_data
    
        return data
    
    @sync_to_async
    def get_full_group_info(self, room_uuid):
        chat_room = ChatRoom.objects.get(room_uuid=room_uuid)

        room_data = ChatRoomSerializer(
            chat_room, 
            many=False,
            context={'user': self.user}
        ).data

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
