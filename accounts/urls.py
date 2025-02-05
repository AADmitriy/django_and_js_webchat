from django.urls import path
from . import views


urlpatterns = [
    path('login', views.loginview, name='login'),
    path('register', views.register_view, name='register')
]
