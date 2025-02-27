from django.urls import path
from . import views


urlpatterns = [
    path('upload', views.upload_file, name="upload_file"),
    path('<file_uuid>', views.serve_file, name='serve_file'),
]
