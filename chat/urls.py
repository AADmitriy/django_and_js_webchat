from django.urls import path
from . import views


urlpatterns = [
    path('', views.chat_page, name='chat_page'),
    path('create_group', views.create_group, name='create_group'),
    path('proto', views.proto, name='proto'),
    path('api/chats_and_groups/<chat_name>', views.get_chats_and_groups, name='get_chats_and_groups')
]
