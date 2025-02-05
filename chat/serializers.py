from rest_framework import serializers
from .models import Message
import json


class MessageSerializer(serializers.ModelSerializer):
    created_at = serializers.SerializerMethodField()
    reactions = serializers.SerializerMethodField()
    read_records = serializers.SerializerMethodField()
    class Meta:
        model = Message
        fields = ['id', 'text', 'author', 'created_at', 'updated', 'reactions', 'read_records']

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
