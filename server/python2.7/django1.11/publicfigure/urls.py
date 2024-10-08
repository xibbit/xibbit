"""publicfigure URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.11/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
import os

from django.conf.urls import url, include
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
#from django.contrib.staticfiles.views import serve

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^install/', include('install.urls')),
    url(r'^upload_photo/', include('upload_photo.urls')),
#    url('', include('app.urls')),
#    url(r'^static/(?P<path>.*)$', 'django.views.static.serve', kwargs={
#        'path': 'index.html', 'document_root': settings.CLIENT_FOLDER,
#        'show_indexes': True,
#    }),
]

# serve /socketio/socket.io.js from root URL which is needed by some clients
urlpatterns += static('/socketio/', document_root=os.path.join(os.path.join(settings.BASE_DIR, 'static'), 'socketio'))
# serve standard public/ and static/ URLs (which includes static/socketio/)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
#urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
