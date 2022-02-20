"""
WSGI config for publicfigure project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/1.11/howto/deployment/wsgi/
"""

import os
from app import app

from django.core.wsgi import get_wsgi_application
from django.contrib.staticfiles.handlers import StaticFilesHandler
import socketio
from xibbit.xibbithub import sioGlobalObject

app.main()

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "publicfigure.settings")

django_app = StaticFilesHandler(get_wsgi_application())
application = socketio.Middleware(sioGlobalObject, wsgi_app=django_app, socketio_path='socket.io')

import eventlet
import eventlet.wsgi
eventlet.wsgi.server(eventlet.listen(('', 8000)), application)
