from django.urls import path
from .consumers import *

websocket_urlpatterns = [
    path("ws/chat", ChatConsumer.as_asgi()),
    path("ws/prototype", Prototype.as_asgi()),
]