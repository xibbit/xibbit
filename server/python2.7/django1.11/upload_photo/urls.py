from django.contrib import admin
from django.conf.urls import url
from django.conf import settings
from django.conf.urls.static import static
from .views import *
  
urlpatterns = [
    url('image_upload', upload_file, name = 'image_upload'),
    #path('success', handle_uploaded_file, name = 'success'),
]
  
if settings.DEBUG:
        urlpatterns += static(settings.MEDIA_URL,
                              document_root=settings.MEDIA_ROOT)
