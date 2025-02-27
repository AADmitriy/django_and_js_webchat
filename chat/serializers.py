from rest_framework import serializers
from .models import Message, ChatRoom
from accounts.models import User
from accounts.serializers import UserSerializer
import json


class MessageSerializer(serializers.ModelSerializer):
    created_at = serializers.SerializerMethodField()
    reactions = serializers.SerializerMethodField()
    read_records = serializers.SerializerMethodField()
    is_file_attached = serializers.SerializerMethodField()
    is_img_attached = serializers.SerializerMethodField()
    attachment_data = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'text', 'author', 'created_at', 
            'updated', 'reactions', 'read_records', 'is_file_attached',
            'is_img_attached', 'attachment_data']

    def get_created_at(self, obj):
        # return obj.created_at.strftime('%a %H:%M  %d/%m/%y')
        return obj.created_at.strftime('%Y-%m-%d %H:%M')
    
    def get_reactions(self, obj):
        reactions_data = {}

        reactions_rows = obj.reactions.all()

        for row in reactions_rows:
            if row.emoji_unicode in reactions_data:
                reactions_data[row.emoji_unicode][row.author.id] = row.created_at.strftime('%a %H:%M  %d/%m/%y')
                continue

            reactions_data[row.emoji_unicode] = {
                row.author.id: row.created_at.strftime('%a %H:%M  %d/%m/%y'),
            }

        return reactions_data
    
    def get_read_records(self, obj):
        read_records_data = {}
        read_records_rows = obj.read_records.all()

        for row in read_records_rows:
            read_records_data[row.readed_by.id] = row.readed_at.strftime('%a %H:%M  %d/%m/%y')

        return read_records_data
    
    def get_is_file_attached(self, obj):
        return obj.attached_file != None

    def get_is_img_attached(self, obj):
        return obj.attached_img != None
    
    def get_attachment_data(self, obj):
        if obj.attached_file == None and obj.attached_img == None:
            return None
        elif obj.attached_file != None:
            file_field = obj.attached_file
            file_name = file_field.file.name.split('/').pop()
            data = {
                'file_uuid': str(file_field.file_uuid),
                'name': file_name,
                'size': file_field.file.size,
                'loaded': True,
            }
            return data
        else:
            img_field = obj.attached_img
            data = {
                'img_uuid': str(img_field.file_uuid),
                'loaded': True,
            }
            return data
        

class ChatRoomSerializer(serializers.ModelSerializer):
    collocutors = serializers.SerializerMethodField()
    group_data = serializers.SerializerMethodField()
    messages = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['collocutors', 'is_private', 'group_data', 'messages']

    def get_collocutors(self, obj):
        user = self.context.get("user")
        collocutors = [ m for m in obj.members.all() if m != user ]
        collocutors_data = {}

        for collocutor in collocutors:
            collocutors_data[collocutor.id] = UserSerializer(
                collocutor,
                many=False
            ).data

        return collocutors_data
    
    def get_group_data(self, obj):
        if obj.is_private:
            return None
        
        group_data = {}

        room_avatar = obj.room_avatar
        group_data['avatar_uuid'] = str(room_avatar.file_uuid) if room_avatar else None
        group_data["room_name"] = obj.group_name
        group_data["admin_id"] = obj.admin.id if obj.admin else None

        return group_data
    
    def get_messages(self, obj):
        # get messages array
        textings = obj.chat_messages.all()
        messages_data = MessageSerializer(textings, many=True).data

        # change collocutor msgs reading records to boolean value
        user = self.context.get("user")

        for msg in messages_data:
            if msg['author'] != user.id:
                user_readed_collocutor_msg = user.id in msg['read_records']
                msg.pop('read_records')
                msg['readed_by_user'] = user_readed_collocutor_msg
        
        return messages_data