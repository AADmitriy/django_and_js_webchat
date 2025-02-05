from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    last_login = serializers.SerializerMethodField()
    first_name = serializers.SerializerMethodField()
    avatar_img_uuid = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'last_login', 'bio', 'avatar_img_uuid', 'is_online']

    def get_last_login(self, obj):
        return obj.last_login.strftime('%Y-%m-%d %H:%M')
    
    def get_first_name(self, obj):
        return obj.first_name if obj.first_name else obj.username
    
    def get_avatar_img_uuid(self, obj):
        avatar_img = obj.avatar_img
        if not avatar_img:
            return ''
        return str(avatar_img.file_uuid)