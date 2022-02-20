"""publicfigure URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path, re_path
from django.conf import settings
from django.conf.urls.static import static
#from django.views.static import serve

urlpatterns = [
    path('admin/', admin.site.urls),
    path('install/', include('install.urls')),
    path('upload_photo/', include('upload_photo.urls')),
    path('', include('app.urls')),
#    re_path(r'^static/(?P<path>.*)$', serve, { 'path': 'index.html',
#        'document_root': settings.CLIENT_FOLDER, 'show_indexes': True,
#    }),
]

# serve /socketio/socket.io.js from root URL which is needed by some clients
urlpatterns += static('/socketio/', document_root=settings.BASE_DIR / 'static' / 'socketio')
# serve standard public/ and static/ URLs (which includes static/socketio/)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
#urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
