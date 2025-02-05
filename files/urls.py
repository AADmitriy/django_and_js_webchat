from django.urls import path
from . import views


urlpatterns = [
    path('<file_uuid>', views.serve_file, name='serve_file'),
]
