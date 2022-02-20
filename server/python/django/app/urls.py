from django.urls import path

from . import views

urlpatterns = [
    path(r'socket.io.min.js', views.static_file2, name='socket.io.min.js'),
    path(r'jquery-3.2.1.slim.min.js', views.static_file, name='jquery-3.2.1.slim.min.js'),
    path(r'socket.io', views.index, name='index'),
    path(r'', views.index, name='index'),
]
