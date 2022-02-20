from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'socket.io.min.js', views.static_file2, name='socket.io.min.js'),
    url(r'jquery-3.2.1.slim.min.js', views.static_file, name='jquery-3.2.1.slim.min.js'),
    url(r'socket.io', views.index, name='index'),
    url(r'', views.index, name='index'),
]
