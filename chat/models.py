from django.db import models
from django.conf import settings
import shortuuid
from accounts.models import User
from files.models import File


class ChatRoom(models.Model):
    room_uuid = models.CharField(max_length=128, unique=True, blank=True, default=shortuuid.uuid)
    group_name = models.CharField(max_length=255, null=True, blank=True)
    admin = models.ForeignKey(User, related_name='groups_admin', blank=True, null=True, on_delete=models.SET_NULL)
    members = models.ManyToManyField(User, related_name='chat_rooms', blank=True)
    is_private = models.BooleanField(default=True)
    room_avatar = models.ForeignKey(File, related_name="rooms_avatar", blank=True, null=True, on_delete=models.SET_NULL)


# Create your models here.
class Message(models.Model):
    chat_room = models.ForeignKey(ChatRoom, related_name='chat_messages', on_delete=models.SET_NULL, blank = True, null = True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="msg_author")
    created_at = models.DateTimeField(auto_now_add=True)
    text = models.CharField(max_length=512)
    updated = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.author.username} : {self.text}'

class Reaction(models.Model):
    message = models.ForeignKey(Message, related_name='reactions', on_delete=models.CASCADE)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reactions_author")
    # content = models.CharField(max_length=128)
    emoji_unicode = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

class ReadRecord(models.Model):
    message = models.ForeignKey(Message, related_name='read_records', on_delete=models.CASCADE)
    readed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="messages_read_records")
    readed_at = models.DateTimeField(auto_now_add=True)
