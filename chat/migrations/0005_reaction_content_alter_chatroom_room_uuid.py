# Generated by Django 5.1.4 on 2025-01-02 11:27

import shortuuid.main
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0004_alter_chatroom_room_uuid_reaction'),
    ]

    operations = [
        migrations.AddField(
            model_name='reaction',
            name='content',
            field=models.CharField(default='t', max_length=128),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='chatroom',
            name='room_uuid',
            field=models.CharField(blank=True, default=shortuuid.main.ShortUUID.uuid, max_length=128, unique=True),
        ),
    ]
