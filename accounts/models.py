from django.contrib.auth.models import AbstractUser
from django.db import models
from files.models import File

class User(AbstractUser):
    username = models.CharField(unique=True, max_length=32)
    first_name = models.CharField(max_length=64)
    last_name = models.CharField(blank=True, null=True, max_length=64)
    bio = models.CharField(blank=True, null=True, max_length=140)
    profile_img = models.ImageField(upload_to ='uploads/', blank=True, null=True)
    avatar_img = models.ForeignKey(File, related_name='users_avatar', blank=True, null=True, on_delete=models.SET_NULL)
    is_online = models.BooleanField(default=False)