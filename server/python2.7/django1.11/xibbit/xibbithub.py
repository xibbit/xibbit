# -*- coding: utf-8 -*-
# The MIT License (MIT)
#
# xibbit 2.0.0 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.
#
# @version 2.0.0
# @copyright xibbit 2.0.0 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
# @license http://opensource.org/licenses/MIT

import os
import re
import math
import imp
import json
import time
import datetime
import secrets
import importlib
import sys
import socketio
import traceback

from django.conf import settings
from django.http import HttpResponse


#
# A Socket.IO library wrapper object that provides
# a uniform interface to Socket.IO across languages
# and frameworks.
#
# @author DanielWHoward
#
class SocketIOWrapper(object):
  handlers = {}
  #
  # Constructor.
  #
  # @author DanielWHoward
  #
  def __init__(self):
    handlers = {}

  #
  # Add a handler for an event name for all sockets.
  #
  # @author DanielWHoward
  #
  def wrapSocket(self, sid, config={}):
    return SocketWrapper(sid, config)

  #
  # Add a handler for an event name for all sockets.
  #
  # @author DanielWHoward
  #
  def handle(self, name, fn):
    self.handlers[name] = fn

  #
  # Get the handler for the event name for all sockets.
  #
  # @author DanielWHoward
  #
  def get_handler(self, name):
    def noop1param(p1):
      pass
    def noop2params(p1, p2):
      pass
    handler = noop2params
    if (name == 'disconnect') or (name == 'disconnect_request'):
      handler = noop1param
    if self.handlers.__contains__(name):
      handler = self.handlers[name]
    return handler

#
# A socket wrapper object that provides a uniform
# interface to Socket.IO sockets across languages
# and frameworks.
#
# @author DanielWHoward
#
class SocketWrapper(object):
  sid = ''
  config = {}

  #
  # Constructor.
  #
  # @author DanielWHoward
  #
  def __init__(self, sid, config):
    self.sid = sid
    self.config = config

  #
  # Emit an event to the client socket.
  #
  # @author DanielWHoward
  #
  def emit(self, event, data):
    sioGlobalObject.emit(event, data, room=self.sid)

  #
  # Disconnect from a client socket.
  #
  # @author DanielWHoward
  #
  def disconnect(self):
    sioGlobalObject.disconnect(self.sid)

#
# An output stream.
#
# @package xibbit
# @author DanielWHoward
#
class XibbitHubOutputStream(object):

  #
  # Constructor.
  #
  # @author DanielWHoward
  #
  def __init__(self):
    pass

  #
  # Write data to the stream.
  #
  # @author DanielWHoward
  #
  def write(self, data):
    print(data)

  #
  # Flush any cached data.
  #
  # @author DanielWHoward
  #
  def flush(self):
    pass

#
# A socket handling hub object that makes it
# easy to set up sockets, dispatch client socket
# packets to a server-side event handler and send
# packets back to the client.
#
# @package xibbit
# @author DanielWHoward
#
class XibbitHub(object):
  # set async_mode to 'threading', 'eventlet', 'gevent' or 'gevent_uwsgi' to
  # force a mode else, the best mode is selected automatically from what's
  # installed
  async_mode = None
  sio = None
  basedir = os.path.dirname(os.path.realpath(__file__))
  thread = None

  #
  # Constructor.
  #
  # @author DanielWHoward
  #
  def __init__(self, config):
    if 'vars' not in config:
      config['vars'] = {}
    config['vars']['hub'] = self
    self.config = config
    self.suppressCloneSession = True
    self.socketio = config['socketio'] if 'socketio' in config else SocketIOWrapper()
    self.handler_groups = {
      'api': {},
      'on': {},
      'int': {}
    }
    self.sessions = []
    self.prefix = ''
    if 'mysql' in self.config and 'SQL_PREFIX' in self.config['mysql']:
      self.prefix = self.config['mysql']['SQL_PREFIX']
    elif 'sqlite3' in self.config and 'SQL_PREFIX' in self.config['sqlite3']:
      self.prefix = self.config['sqlite3']['SQL_PREFIX']
    self.outputStream = XibbitHubOutputStream()
    self.sio = sioGlobalObject
    hubObjects.append(self)

  def index(self, request):
    if thread is None:
      thread = sioGlobalObject.start_background_task(background_thread)
    return HttpResponse(open(os.path.join(basedir, '../app/static/index.html')))

  def background_thread(self):
    """Example of how to send server generated events to clients."""
    count = 0
    while False: # True:
      sioGlobalObject.sleep(10)
      count += 1
      sioGlobalObject.emit('my_response', {'data': 'Server generated event'},
               namespace='/test')

  #
  # Shut down this hub instance.
  #
  # @author DanielWHoward
  #
  def stopHub(self):
    pass

  #
  # Return the Socket.IO instance.
  #
  # This might be the Socket.IO server instance
  # or the Socket.IO library instance.
  #
  # @return The Socket.IO instance.
  #
  # @author DanielWHoward
  #
  def getSocketIO(self):
    return self.socketio

  #
  # Get the session associated with a socket which always
  # has a session_data key and a _conn key.  The _conn key
  # has a map that contains a sockets key with an array of
  # sockets.  A socket is globally unique in the sessions
  # object.
  #
  # There is an instance_id key in the session_data map
  # which is globally unique or the empty string.
  #
  # Multiple sockets can be associated with the same
  # session (browser reloads).
  #
  # A socket will not have an instance_id until it receives
  # an _instance event.
  #
  # @param sock object A socket.
  # @return map The session object with session_data and _conn keys.
  #
  # @author DanielWHoward
  #
  def getSession(self, sock):
    session = None
    i = self.getSessionIndex(sock)
    if i != -1:
      session = self.cloneSession(self.sessions[i])
    return session

  #
  # This is an implementation helper.  It assumes that
  # the session store is an array.
  #
  # @param sock object A socket.
  # @return int The index into a session array.
  #
  # @author DanielWHoward
  #
  def getSessionIndex(self, sock):
    for s, _ in enumerate(self.sessions):
      for ss, _ in enumerate(self.sessions[s]['_conn']['sockets']):
        if self.sessions[s]['_conn']['sockets'][ss].sid == sock.sid:
          return s
    return -1

  #
  # Get the session associated with an instance.
  #
  # @param instance_id string An instance string.
  #
  # @author DanielWHoward
  #
  def getSessionByInstance(self, instance_id):
    if instance_id != '':
      for session in self.sessions:
        if session['session_data']['instance_id'] == instance_id:
          return self.cloneSession(session)
    return None

  #
  # Get the session associated with a user (an
  # addressable recepient of a send message).
  #
  # The special &quot;all&quot; username refers
  # to all sessions.
  #
  # @param username string The username.
  #
  # @author DanielWHoward
  #
  def getSessionsByUsername(self, username):
    sessions = []
    if username == 'all':
      sessions = self.sessions
    else:
      for s, _ in enumerate(self.sessions):
        if self.sessions[s]['session_data']['_username'] == username:
          sessions.append(self.sessions[s])
    return sessions

  #
  # Change the session associated with a socket.
  #
  # @param sock object A socket.
  # @param session map The session values.
  #
  # @author DanielWHoward
  #
  def setSessionData(self, sock, sessionData):
    for s, _ in enumerate(self.sessions):
      for ss, _ in enumerate(self.sessions[s]['_conn']['sockets']):
        if self.sessions[s]['_conn']['sockets'][ss].sid == sock.sid:
          self.sessions[s]['session_data'] = sessionData
          break

  #
  # Add a new, empty session only for this socket.
  #
  # @param sock object A socket.
  #
  # @author DanielWHoward
  #
  def addSession(self, sock):
    session = {
      'session_data': {
        'instance_id': ''
      },
      '_conn': {
        'sockets': [sock]
      }
    }
    self.sessions.append(session)

  #
  # Remove the socket from the session or the whole session
  # if it is the only socket.
  #
  # @param sock object A socket.
  #
  # @author DanielWHoward
  #
  def removeSocketFromSession(self, sock):
    #TODO unimplemented removeSocketFromSession()
    return

  #
  # Delete the session that contains a socket and
  # add the socket to the session which represents
  # an instance.
  #
  # When a socket connects, it is assigned to a new
  # empty session but, when the _instance event
  # arrives, that socket might need to be assigned
  # to an existing session and the new session
  # destroyed.
  #
  # @param instance_id string The instance to add the socket to.
  # @param sock object The socket to be moved.
  #
  # @author DanielWHoward
  #
  def combineSessions(self, instance_id, sock):
    i = self.getSessionIndex(sock)
    self.sessions.pop(i)
    for s, _ in enumerate(self.sessions):
      if self.sessions[s]['session_data']['instance_id'] == instance_id:
        self.sessions[s]['_conn']['sockets'].append(sock)
        break

  #
  # Return a duplicate of the session with no shared
  # pointers except for the special _conn key, if it
  # exists.  This method works for the entire session
  # or just the session_data in a session.
  #
  # A clone prevents a common coding error where the
  # code relies on shared pointers rather than using
  # the setSessionData() method.
  #
  # The usual implementation is to convert to JSON and
  # then back again.  For some types, a workaround must
  # be implemented.
  #
  # @param session map The session or session_data.
  # @return map The clone.
  #
  # @author DanielWHoward
  #
  def cloneSession(self, session):
    if self.suppressCloneSession:
      return session
    conn = None
    if '_conn' in session:
      conn = session['_conn']
      del session['_conn']
    clone = json.loads(json.dumps(session))
    if conn != None:
      clone['_conn'] = conn
      session['_conn'] = conn
    return clone

  #
  # Return a JSON string with keys in a specific order.
  #
  # @param s string A JSON string with keys in random order.
  # @param first array An array of key names to put in order at the start.
  # @param last array An array of key names to put in order at the end.
  #
  # @author DanielWHoward
  #
  def reorderJson(self, s, first, last):
    i = 0
    targets = []
    sMap = json.loads(s)
    # separate into an array of objects/maps
    for i in range(len(first) + len(last) + 1):
      k = ''
      targets.append({})
      if (i < len(first)):
        k = first[i]
      elif (i > len(first)):
        k = last[i - len(first) - 1]
      if ((k != '') and (k in sMap)):
        targets[i][k] = sMap[k]
        del sMap[k]
    targets[len(first)] = sMap
    # build JSON string from array of objects/maps
    s = ''
    for i in range(len(targets)):
      target = targets[i]
      if (len(target.keys()) > 0):
        sTarget = json.dumps(target)
        if (s == ''):
          s = sTarget
        else:
          s = s[:-1] + "," + sTarget[1:]
    return s

  #
  # Some associative arrays have their keys stored in a
  # specific order.
  #
  # Return a hashtable with keys in a specific order.
  #
  # @param source map A JSON string with keys in random order.
  # @param first array An array of key names to put in order at the start.
  # @param last array An array of key names to put in order at the end.
  #
  # @author DanielWHoward
  #
  def reorderMap(self, source, first, last):
    # create JSON maps
    target = {}
    # save the first key-value pairs
    for key in first:
      if key in source:
        target[key] = source[key]
    # save the non-first and non-last key-value pairs
    keys = source.keys()
    for key in keys:
      value = source[key]
      found = False
      for firstkey in first:
        if firstkey == key:
          found = True
      for lastkey in last:
        if lastkey == key:
          found = True
      if not found:
        target[key] = value
    # save the last key-value pairs
    for key in last:
      if key in source:
        target[key] = source[key]
    return target

  #
  # Start the xibbit server system.
  #
  # @param method string An event handling strategy.
  #
  # @author DanielWHoward
  #
  def start(self, method='best'):
    # socket connected
    def connect(socket, environ):
      session = self.getSession(socket)
      if session == None:
        self.addSession(socket)

    # decode the event
    def server(socket, event):
      allowedKeys = ['_id']
      allowedTypes = ['_instance']
      session = self.getSession(socket)
      # process the event
      events = []
      handled = False
      if not isinstance(event, dict):
        # the event is not JSON
        event = {}
        event['e'] = 'malformed--json'
        events.append(['client', event])
        handled = True
      if not handled and bool(event):
        # see if the event has illegal keys
        for key, value in event.items():
          # _id is a special property so sender can invoke callbacks
          malformed = key.startswith('_') and not key in allowedKeys
          if malformed:
            event['e'] = 'malformed--property'
            events.append(['client', event])
            handled = True
            break
      if not handled:
        # see if there is no event type
        if not u'type' in event:
          event['e'] = 'malformed--type'
          events.append(['client', event])
          handled = True
      if not handled:
        # see if event type has illegal value
        typeStr = event[u'type'] if isinstance(event[u'type'], unicode) else ''
        typeValidated = re.search(ur"[a-z][a-z_]*", typeStr) != None
        if not typeValidated:
          typeValidated = typeStr in allowedTypes
        if not typeValidated:
          event['e'] = 'malformed--type:'+event['type']
          events.append(['client', event])
          handled = True
      # handle _instance event
      if (not handled and (event['type'] == '_instance')):
        created = 'retrieved'
        # instance value in event takes priority
        instance = event['instance'] if u'instance' in event else ''
        # recreate session
        if self.getSessionByInstance(instance) == None:
          instanceMatched = re.search(r'^[a-zA-Z0-9]{25}$', instance) != None
          if (instanceMatched):
            created = 'recreated'
          else:
            instance = self.generateInstance()
            created = 'created'
          # create a new instance for every tab even though they share session cookie
          event['instance'] = instance
          # save new instance_id in session
          session['session_data']['instance_id'] = instance
          self.setSessionData(socket, session['session_data'])
        else:
          self.combineSessions(instance, socket)
        session = self.getSessionByInstance(instance)
        event['i'] = 'instance '+created
      # handle the event
      if not handled:
        event['_session'] = session['session_data']
        event['_conn'] = {
          'socket': socket
        }
        eventReply = self.trigger(event)
        # save session changes
        self.setSessionData(socket, eventReply['_session'])
        # remove the session property
        if '_session' in eventReply:
          del eventReply['_session']
        # remove the connection property
        if '_conn' in eventReply:
          del eventReply['_conn']
        # _instance event does not require an implementation; it's optional
        if ((eventReply['type'] == u'_instance') and ('e' in eventReply)
            and (eventReply['e'] == 'unimplemented')):
          del eventReply['e']
        # reorder the properties so they look pretty
        reorderedEventReply = self.reorderMap(eventReply,
          ['type', 'from', 'to', '_id'],
          ['i', 'e']
        )
        events.append(['client', reorderedEventReply])
        handled = True
      # emit all events
      for event in events:
        socket.emit(event[0], event[1])

    # socket disconnect_request handler
    def disconnect_request(socket):
      socket.disconnect()

    # socket disconnected handler
    def disconnect(socket):
      session = self.getSession(socket)
      self.removeSocketFromSession(socket)

    self.socketio.handle('connect',
      lambda sid, environ: connect(self.socketio.wrapSocket(sid), environ)
    )
    self.socketio.handle('server',
      lambda sid, message: server(self.socketio.wrapSocket(sid), message)
    )
    self.socketio.handle('disconnect_request',
      lambda sid: disconnect_request(self.socketio.wrapSocket(sid))
    )
    self.socketio.handle('disconnect',
      lambda sid: disconnect(self.socketio.wrapSocket(sid))
    )

  #
  # Package events, execute them and return response events.
  #
  # @param array fileEvents
  # @return NULL[]
  #
  # @author DanielWHoward
  #
  def readAndWriteUploadEvent(self, group, typ, fn):
    #TODO unimplemented readAndWriteUploadEvent()
    return

  #
  # Provide an authenticated callback for an event.
  #
  # @param typ string The event to handle.
  # @param fn mixed A function that will handle the event.
  #
  # @author DanielWHoward
  #
  def on(self, group, typ, fn):
    self.handler_groups[group][typ] = fn

  #
  # Search, usually the file system, and dynamically
  # load an event handler for this event, if supported
  # by this language/platform.
  #
  # Some languages/platforms do not support loading code
  # on the fly so this method might do nothing.
  #
  # An error is returned if the handler cannot be loaded,
  # the file is improperly named or other error that the
  # loader may notice.
  #
  # @param $event map The event to handle.
  # @return Exception If the loader had an error.
  #
  # @author DanielWHoward
  #
  def loadHandler(self, event):
    e = ''
    eventType = event[u'type']
    invoked = True
    handlerFile = None
    # get the plugins folder
    pluginsFolder = None
    if 'plugins' in self.config and 'folder' in self.config['plugins']:
      pluginsFolder = self.config['plugins']['folder']
    # search for the event handler in the plugins folder
    if pluginsFolder != None:
      dh = opendir(pluginsFolder)
      if dh != False:
        file = readdir(dh)
        while file != False and handlerFile == None:
          if file != '.' and file != '..':
            file = pluginsFolder+'/'+file+'/server/php/events/'+eventType+'.php'
            if os.path.exists(file):
              handlerFile = file
          file = readdir(dh)
      else:
        e = 'plugins--missing:'+pluginsFolder
        invoked = True
    # search for the event handler in the events folder
    if handlerFile == None:
      file = os.path.join(os.path.join(settings.BASE_DIR, 'events'), eventType+'.py')
      if os.path.exists(file):
        handlerFile = file
    # try to load the event handler
    if handlerFile != None:
      apifn = self.handler_groups['api']
      onfn = self.handler_groups['on']
      handlerFile = 'events.'+eventType
      try:
        if eventType != 'init2':
          module = importlib.import_module(handlerFile)
          # module = __import__(handlerFile, globals=globals())
          module = sys.modules[handlerFile]
          self.on(module[0], module[1], module[2])
        else:
          print('importlibimportlibimportlibimportlibimportlibimportlibimportlib')
          module = __import__(handlerFile, globals=globals())
          module = sys.modules[handlerFile]
          module(self)
          fp, path, desc = imp.find_module('events')
          print(desc)
          module_package = imp.load_module('events.init', fp, path, desc)
          print(module_package)
          HandlerClass = imp.load_module("% s.% s" % ('events.init', 'handler'), fp, path, desc)
          print(HandlerClass)
          # HandlerClass = getattr(HandlerClass, 'HandlerClass')
          # print(HandlerClass)
          # h = HandlerClass()
          # print(h)
          # HandlerClass(self)
          # handler = getattr(module, 'handler')
          # print(handler)
          # handler(self)
          print('Done!')
      except Exception as e:
        e = 'notfound:'+str(e)+':'+handlerFile
      # fp, path, desc = imp.find_module('events.init')
      # example_package = imp.load_module(name, fp, path, desc)
      # myclass = imp.load_module("% s.% s" % (name, class_name), fp, path, desc)
      # if apifn == self.apifn and onfn == self.onfn:
      #  # found the file but didn't get an event handler
      #  e = 'unhandled:'+handlerFile
      # elif not eventType in self.onfn and not eventType in self.apifn:
      #  # found the file but got an event handler with a different name
      #  e = 'mismatch:'+handlerFile
    elif not invoked:
      # find all the folders that contain handlers
      handlerFolders = []
      if pluginsFolder != None:
        dh = opendir(pluginsFolder)
        if dh != False:
          file = readdir(dh)
          while file != False:
            if file != '.' and file != '..' and os.path.isdir(pluginsFolder+'/'+file+'/server/php/events'):
              handlerFolders.append(pluginsFolder+file+'/server/php/events')
            file = readdir(dh)
          closedir(dh)
      if os.path.isdir('events'):
        handlerFolders.append('events')
      # find all the event handler files
      handlerFiles = []
      for handlerFolder in handlerFolders:
        dh = os.listdir(handlerFolder)
        for file in dh:
          if file != '.' and file != '..' and os.path.isfile(handlerFolder+'/'+file):
            handlerFiles.append(os.path.join(handlerFolder, file))
      # see if some event handler files have similar names
      misnamed = None
      if not eventType in ['__receive', '__send']:
        for file in handlerFiles:
          pos = file.rfind('/')
          if (pos >= 0) and (file.find(pos+1, len(eventType+'.')) == eventType+'.'):
            misnamed = file
            break
      if misnamed == None:
        # did not find a file with an event handler
        e = 'unimplemented'
      else:
        # found a file with a similar but incorrect name
        e = 'misnamed:' + misnamed
    return e

  #
  # Invoke callbacks for an event.
  #
  # @param event array The event to handle.
  # @param useInternalHandlers boolean Look for and invoke internal handlers, too.
  #
  # @author DanielWHoward
  #
  def trigger(self, event):
    # clone the event
    keysToSkip = ['_conn', '_session', 'image']
    eventType = event[u'type']
    eventReply = self.cloneEvent(event, keysToSkip)
    for key in keysToSkip:
      if key in event:
        eventReply[key] = event[key]
    # determine authentication
    authenticated = False
    if ('_session' in event) and ('_username' in event['_session']) and (event['_session']['_username'] != ''):
      authenticated = True
    # try to find event handler to invoke
    handler = None
    onHandler = self.handler_groups['on'][eventType] if eventType in self.handler_groups['on'] else None
    apiHandler = self.handler_groups['api'][eventType] if eventType in self.handler_groups['api'] else None
    # try to load event handler dynamically
    if (onHandler == None) and (apiHandler == None):
      e = self.loadHandler(event)
      if e != '':
        eventReply['e'] = e
    # try to find event handler to invoke again
    onHandler = self.handler_groups['on'][eventType] if eventType in self.handler_groups['on'] else None
    apiHandler = self.handler_groups['api'][eventType] if eventType in self.handler_groups['api'] else None
    # determine event handler to invoke
    if 'e' in eventReply:
      handler = None
    elif (onHandler != None) and authenticated:
      handler = onHandler
    elif apiHandler != None:
      handler = apiHandler
    elif (onHandler != None) and not authenticated:
      handler = None
      eventReply['e'] = 'unauthenticated'
    else:
      handler = None
      eventReply['e'] = 'unimplemented'
    # invoke the handler
    if handler != None:
      try:
        eventReply = handler(event, self.config['vars'])
      except BaseException as e:
        exc_info = sys.exc_info()
        traceback.print_exception(*exc_info)
        eventReply['e'] = str(e)
        eventReply['e_stacktrace'] = traceback.format_exc()
    return eventReply

  #
  # Send an event to another user.
  #
  # The special &quot;all&quot; recipient
  # sends it to all logged in users.
  #
  # @param event map The event to send.
  # @param recipient string The username to send to.
  # @param emitOnly boolean Just call emit() or invoke __send event, too.
  # @return boolean True if the event was sent.
  #
  # @author DanielWHoward
  #
  def send(self, event, recipient=None, emitOnly=False):
    sent = False
    to = None
    user = None
    keysToSkip = ['_session', '_conn']
    if emitOnly:
      address = ''
      if recipient != None:
        address = recipient
      elif 'to' in event:
        address = event['to']
      if address != '':
        recipients = self.getSessionsByUsername(address)
        for r in range(len(recipients)):
          clone = self.cloneEvent(event, keysToSkip)
          try:
            for sock in recipients[r]['_conn']['sockets']:
              sock.emit('client', clone)
          except Exception as e:
            pass
    else:
      # temporarily remove _session property
      keysToSkip = ['_session', '_conn', '_id', '__id']
      clone = self.cloneEvent(event, keysToSkip)
      # convert _id to __id
      if '_id' in event:
        clone['__id'] = event['_id']
      # provide special __send event for caller to implement aliases, groups, all addresses
      eventReply = self.trigger({
        'type': '__send',
        'event': clone
      })
      if 'e' in eventReply and eventReply['e'] == 'unimplemented':
        self.send(clone, recipient, True)
      sent = True
      # restore properties
      event = self.updateEvent(event, clone, keysToSkip)
    return sent

  #
  # Return an array of events for this user.
  #
  # @return array An array of events.
  #
  # @author DanielWHoward
  #
  def receive(self, events, session, collectOnly):
    if (collectOnly):
#     if session['_username'] == None:
#       return events
      return events
    else:
      # provide special __receive event for alternative event system
      eventReply = self.trigger({
        'type': '__receive',
        '_session': session
      })
      if ((eventReply['type'] != '__receive') or not eventReply['e'] or (eventReply['e'] != 'unimplemented')):
        if (eventReply.eventQueue):
          events = events.concat(eventReply.eventQueue)
        return events

  #
  # Connect or disconnect a user from the event system.
  #
  # @param event array The event to connect or disconnect.
  # @param connect boolean Connect or disconnect.
  # @return array The modified event.
  #
  # @author DanielWHoward
  #
  def connect(self, event, username, connect):
    # update last connection time for user in the database
    connected = 0
    # use and require "instance" value instead of socket
    instance = event['_session']['instance_id'] if 'instance_id' in event['_session'] else ''
    session = self.getSessionByInstance(instance) if instance != '' else None
    if session != None:
      session = session['session_data']
    # update username in event._session and "sessions" global store
    if session != None:
      if connect:
        event['_session']['_username'] = username
        # update session only if event._session and "sessions" global store are
        #  copies (by value) instead of same object (by reference, a.k.a. pointer)
        if not '_username' in session:
          session['_username'] = username
      else:
        del event['_session']['_username']
        # update session only if event._session and "sessions" global store are
        #  copies (by value) instead of same object (by reference, a.k.a. pointer)
        if '_username' in session:
          del session['_username']
      for s, _ in enumerate(self.sessions):
        sessionInstance = self.sessions[s]['session_data']['instance_id'] if 'instance_id' in self.sessions[s]['session_data'] else ''
        if (sessionInstance == instance):
          self.sessions[s]['session_data'] = session
          break
    return event

  #
  # Update the connected value for this user.
  #
  # @author DanielWHoward
  #
  def touch(self, session):
    if '_username' in session:
      username = session['_username']
      # update last ping for this user in the database
      touched = (datetime.datetime.now()).strftime('%Y-%m-%d %H:%M:%S')
      nullDateTime = '1970-01-01 00:00:00'
      q = 'UPDATE `' + self.prefix + 'users` SET `touched` = \'' + touched + '\' WHERE '
      q += '`username` = \'' + username + '\' && '
      q += '`connected` <> \'' + nullDateTime + '\';'
      self.mysql_query(q)

  #
  # Garbage collector.
  #
  # @author DanielWHoward
  #
  def checkClock(self):
    config = self.config
    disconnect_seconds = 2 * 60
    # try to lock the global variables
    if self.lockGlobalVars():
      globalVars = self.readGlobalVars()
      # create tick and lastTick native time objects
      tick = datetime.datetime.now()
      lastTick = tick
      if '_lastTick' in globalVars and isinstance(globalVars['_lastTick'], str):
        lastTickObject = datetime.datetime.strptime(globalVars['_lastTick'], '%Y-%m-%d %H:%M:%S')
        if lastTickObject != False:
          lastTick = lastTickObject
      if '_lastTick' in globalVars:
        del globalVars['_lastTick']
      # provide special __clock event for housekeeping
      eventReply = self.trigger({
        'type': '__clock',
        'tick': tick,
        'lastTick': lastTick,
        'globalVars': globalVars
      })
      # remove stale sessions
      self.updateExpired('users', disconnect_seconds)
      self.deleteExpired('sockets', disconnect_seconds)
      self.deleteExpired('sockets_events', disconnect_seconds)
      self.deleteExpired('sockets_sessions', disconnect_seconds, ' AND `socksessid` NOT IN (\'global\', \'lock\')')
      # write and unlock global variables
      globalVars = eventReply['globalVars']
      globalVars['_lastTick'] = tick.strftime('%Y-%m-%d %H:%M:%S')
      self.writeGlobalVars(globalVars)
      self.unlockGlobalVars()

  #
  # Update rows that have not been touched recently.
  #
  # @param $secs int A number of seconds.
  #
  # @author DanielWHoward
  #
  def updateExpired(self, table, secs, clause=''):
    nullDateTime = '1970-01-01 00:00:00'
    expiration = (datetime.datetime.now() - datetime.timedelta(seconds=secs)).strftime('%Y-%m-%d %H:%M:%S')
    q = 'UPDATE `' + self.prefix + table + '` SET ' 
    q += 'connected=\''+nullDateTime+'\', '
    q += 'touched=\''+nullDateTime+'\' '
    q += 'WHERE (`touched` < \''+expiration+'\''+clause+');'
    return self.mysql_query(q)

  #
  # Delete rows that have not been touched recently.
  #
  # @param secs int A number of seconds.
  #
  # @author DanielWHoward
  #
  def deleteExpired(self, table, secs, clause=''):
    expiration = (datetime.datetime.now() - datetime.timedelta(seconds=secs)).strftime('%Y-%m-%d %H:%M:%S')
    q = 'DELETE FROM `'+self.prefix+table+'` '
    q += 'WHERE (`touched` < \''+expiration+'\''+clause+');'
    return self.mysql_query(q)

  #
  # Delete rows in the first table that don't have a row in the second table.
  #
  # This is a way to manually enforce a foreign key constraint.
  #
  # @param table string A table to delete rows from.
  # @param column string A column to try to match to a column in the other table.
  # @param table2 string The other table that should have a corresponding row.
  # @param column2 string A column of the other table to match against.
  #
  # @author DanielWHoward
  #
  def deleteOrphans(self, table, column, table2, column2):
    q = 'DELETE FROM `'+self.prefix+table+'` '
    q += 'WHERE NOT EXISTS (SELECT * FROM `'+self.prefix+table2+'` '
    q += 'WHERE `'+column2+'`=`'+self.prefix+table+'`.`'+column+'`);'
    return self.mysql_query(q)

  #
  # Sort events by the __id database property.
  #
  # @param a array An event.
  # @param b array A different event.
  # @return int 1, -1 or 0.
  #
  # @author DanielWHoward
  #
  def cmp(self, a, b):
    if a['___id'] > b['___id']:
      return 1
    elif a['___id'] < b['___id']:
      return -1
    return 0

  #
  # Create a clone with a subset of key-value pairs.
  #
  # Often, there are unneeded or problematic keys
  # that are better to remove or copy manually to
  # the clone.
  #
  # @param event array An event to clone.
  # @param keysToSkip An array of keys to not copy to the clone.
  #
  # @author DanielWHoward
  #
  def cloneEvent(self, event, keysToSkip):
    # clone the event
    clone = {}
    for key in event.keys():
      if not key in keysToSkip:
        clone[key] = event[key]
    return clone

  #
  # Update the key-value pairs of an event using
  # the key-value pairs from a clone.
  #
  # This will only overwrite changed key-value
  # pairs; it will not copy unchanged key-value
  # pairs or remove keys.
  #
  # @param event array A target event.
  # @param clone array A source event.
  # @param keysToSkip An array of keys to not copy from the clone.
  #
  # @author DanielWHoward
  #
  def updateEvent(self, event, clone, keysToSkip):
    for key in clone.keys():
      if not key in keysToSkip:
        if not key in event or event[key] != clone[key]:
          event[key] = clone[key]
    return event

  #
  # Return a random instance ID.
  #
  # @author DanielWHoward
  #
  def generateInstance(self):
    length = 25
    a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    instance = ''
    for i in range(length):
      instance += a[self.rand_secure(0, len(a))]
    return instance

  #
  # Return a random number in a range.
  #
  # @param min int The minimum value.
  # @param max int The maximum value.
  # @return A random value.
  #
  # @author DanielWHoward
  #
  def rand_secure(self, min, max):
    log = math.log(max - min, 2)
    bytes = int(math.floor((log / 8) + 1))
    bits = int(math.floor(log + 1))
    filter = int(math.floor((1 << bits) - 1))
    rnd = int(secrets.token_hex(bytes), 16)
    rnd = rnd & filter # discard irrelevant bits
    while (rnd >= (max - min)):
      rnd = int(secrets.token_hex(bytes), 16)
      rnd = rnd & filter # discard irrelevant bits
    return int(math.floor(min + rnd))

  #
  # Lock global variable in database for access.
  #
  # @author DanielWHoward
  #
  def lockGlobalVars(self):
    return self.lockGlobalVarsUsingSql()

  #
  # Lock global variable in database for access.
  #
  # @author DanielWHoward
  #
  def lockGlobalVarsUsingSql(self):
    now = time.strftime('%Y-%m-%d %H:%M:%S')
    # generate a unique lock identifier
    length = 25
    a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    lockId = ''
    for i in range(length):
      lockId += a[self.rand_secure(0, len(a))]
    vars = json.dumps({'id': lockId})
    # try to get the lock
    q = 'INSERT INTO '+self.prefix+'sockets_sessions '
    q += '(`id`, `socksessid`, `connected`, `touched`, `vars`) VALUES ('
    q += "0, "
    q += "'lock', "
    q += "'"+self.mysql_real_escape_string(now)+"', "
    q += "'"+self.mysql_real_escape_string(now)+"', "
    q += "'"+self.mysql_real_escape_string(vars)+"');"
    oneAndOnly = False
    try:
      qr = self.mysql_query(q)
      self.mysql_fetch_assoc(qr)
      oneAndOnly = True
    except:
      pass
    oneAndOnly = True
    unlock = oneAndOnly
    if oneAndOnly:
      # retrieve lock ID and confirm that it's the same
      q = 'SELECT vars FROM '+self.prefix+'sockets_sessions WHERE `socksessid` = \'lock\''
      rows = self.mysql_query(q)
      row = self.mysql_fetch_assoc(rows)
      if row != None:
        oneAndOnly = (row['vars'] == vars)
      else:
        oneAndOnly = False
      self.mysql_free_query(rows)
      if oneAndOnly:
        return oneAndOnly
      else:
        # release the lock if it has been too long
        self.deleteExpired('sockets_sessions', 60, ' AND `socksessid` = \'lock\'')
    return False

  #
  # Unlock global variable in database.
  #
  # @author DanielWHoward
  #
  def unlockGlobalVars(self):
    return self.unlockGlobalVarsUsingSql()

  #
  # Unlock global variable in database.
  #
  # @author DanielWHoward
  #
  def unlockGlobalVarsUsingSql(self):
    # release the lock
    q = 'DELETE FROM '+self.prefix+'sockets_sessions WHERE socksessid = \'lock\';'
    return self.mysql_query(q)

  #
  # Read global variables from database.
  #
  # @author DanielWHoward
  #
  def readGlobalVars(self):
    return self.readGlobalVarsUsingSql()

  #
  # Read global variables from database.
  #
  # @author DanielWHoward
  #
  def readGlobalVarsUsingSql(self):
    q = 'SELECT vars FROM `'+self.prefix+'sockets_sessions` WHERE socksessid = \'global\';'
    qr = self.mysql_query(q)
    vars = {}
    s = self.mysql_fetch_assoc(qr)
    if s != None:
      vars = json.loads(s['vars'])
    self.mysql_free_query(qr)
    return vars

  #
  # Write global variables to database.
  #
  # @author DanielWHoward
  #
  def writeGlobalVars(self, vars):
    return self.writeGlobalVarsUsingSql(vars)

  #
  # Write global variables to database.
  #
  # @param vars map The JSON-friendly vars to save.
  #
  # @author DanielWHoward
  #
  def writeGlobalVarsUsingSql(self, vars):
    now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    s = json.dumps(vars)
    q = 'UPDATE `'+self.prefix+'sockets_sessions` SET '
    q += '`touched` = \''+now+'\','
    q += '`vars` = \''+s+'\' '
    q += 'WHERE socksessid=\'global\';'
    return self.mysql_query(q)

  #
  # Flexible mysql_query() function.
  #
  # @param query String The query to execute.
  # @return The mysql_query() return value.
  #
  # @author DanielWHoward
  #
  def mysql_query(self, query):
    cursor = self.config['mysql']['link'].cursor()
    cursor.execute(query)
    if query.startswith('UPDATE ') or query.startswith('INSERT ') or query.startswith('DELETE '):
      self.config['mysql']['link'].commit()
    return cursor

  #
  # Flexible mysql_fetch_assoc() function.
  #
  # @param result String The result to fetch.
  # @return The mysql_fetch_assoc() return value.
  #
  # @author DanielWHoward
  #
  def mysql_fetch_assoc(self, result):
    assoc = None
    cursor = result
    if result == None:
      assoc = None
    else:
      row = cursor.fetchone()
      if row != None:
        column_names = cursor.column_names
        assoc = dict(zip(column_names, row))
    return assoc

  #
  # Flexible mysql_free_result() function.
  #
  # @param result String The result to free.
  # @return The mysql_free_result() return value.
  #
  # @author DanielWHoward
  #
  def mysql_free_query(self, result):
    if result != None:
      result.close()

  #
  # Flexible mysql_real_escape_string() function.
  #
  # @param unescaped_string String The string.
  # @return The mysql_real_escape_string() return value.
  #
  # @author DanielWHoward
  #
  def mysql_real_escape_string(self, unescaped_string):
    return str(self.config['mysql']['link'].converter.escape(unescaped_string))

  #
  # Flexible mysql_errno() function.
  #
  # @param e mysql.connector.Error An exception.
  # @return The mysql_errno() return value.
  #
  # @author DanielWHoward
  #
  def mysql_errno(self, e):
    num = -1
    if hasattr(e, 'errno'):
      num = e.errno
    return num

  #
  # Flexible mysql_error() function.
  #
  # mysql.connector.Error values have errno,
  # msg and sqlstate properties.
  #
  # @param e mysql.connector.Error An exception.
  # @return The mysql_error() return value.
  #
  # @author DanielWHoward
  #
  def mysql_errstr(self, e):
    s = ''
    if hasattr(e, 'msg'):
      s = e.msg
    if e == '':
      s = str(e)
    return s

  #
  # Create XibbitHub required tables.
  #
  # @author DanielWHoward
  #
  def createDatabaseTables(self, log, users=''):
    now = time.strftime('%Y-%m-%d %H:%M:%S')
    # create the sockets table
    #  this table contains all the sockets
    #
    #  a socket persists until the page is reloaded
    #  an instance/user persists across page reloads
    q = 'CREATE TABLE `' + self.prefix + 'sockets` ( '
    q += '`id` bigint(20) unsigned NOT NULL auto_increment,'
    q += '`sid` text,'
    q += '`connected` datetime NOT NULL,' # 2014-12-23 06:00:00 (PST)
    q += '`touched` datetime NOT NULL,' # 2014-12-23 06:00:00 (PST)
    q += '`props` text,'
    q += 'UNIQUE KEY `id` (`id`));'
    try:
      self.mysql_query(q)
      log.println(q, 0)
    except Exception as e:
      if self.mysql_errno(e) == 1050:
        log.println('Table ' + self.prefix + 'sockets already exists!', 1);
      else:
        log.println('Table ' + self.prefix + 'sockets had a MySQL error (' + self.mysql_errno(e) + '): ' + self.mysql_errstr(e));

    # create the sockets_events table
    #  this table holds undelivered events/messages for sockets
    q = 'CREATE TABLE `' + self.prefix + 'sockets_events` ( '
    q += '`id` bigint(20) unsigned NOT NULL auto_increment,'
    q += '`sid` text,'
    q += '`event` mediumtext,'
    q += '`touched` datetime NOT NULL,' # 2014-12-23 06:00:00 (PST)
    q += 'UNIQUE KEY `id` (`id`));';
    try:
      self.mysql_query(q)
      log.println(q, 0)
    except Exception as e:
      if self.mysql_errno(e) == 1050:
        log.println('Table ' + self.prefix + 'sockets_events already exists!', 1);
      else:
        log.println('Table ' + self.prefix + 'sockets_events had a MySQL error (' + self.mysql_errno(e) + '): ' + self.mysql_errstr(e));

    # create the sockets_sessions table
    #  this table does double duty
    #  the 'global' row is a shared, persistent, global var
    #  the other rows contain session data that replaces PHP's
    #    session_start() function which is inflexible
    q = 'CREATE TABLE `' + self.prefix + 'sockets_sessions` ( '
    q += '`id` bigint(20) unsigned NOT NULL auto_increment,'
    q += '`socksessid` varchar(25) NOT NULL,'
    q += '`connected` datetime NOT NULL,' # 2014-12-23 06:00:00 (PST)
    q += '`touched` datetime NOT NULL,' # 2014-12-23 06:00:00 (PST)
    q += '`vars` text,'
    q += 'UNIQUE KEY `id` (`id`),'
    q += 'UNIQUE KEY `socksessid` (`socksessid`));';
    try:
      self.mysql_query(q)
      log.println(q, 0)
    except Exception as e:
      if self.mysql_errno(e) == 1050:
        log.println('Table ' + self.prefix + 'sockets_sessions already exists!', 1);
      else:
        log.println('Table ' + self.prefix + 'sockets_sessions had a MySQL error (' + self.mysql_errno(e) + '): ' + self.mysql_errstr(e));
    # add the global row to the sockets_sessions table
    q = 'SELECT COUNT(*) AS num_rows FROM ' + self.prefix + 'sockets_sessions'
    qr = self.mysql_query(q)
    num_rows = 0
    row = self.mysql_fetch_assoc(qr)
    while row != None:
      num_rows = int(row['num_rows'])
      row = self.mysql_fetch_assoc(qr)
    if num_rows == 0:
      values = []
      values.append("0, 'global', '" + now + "', '" + now + "', '{}'")
      for value in values:
        q = 'INSERT INTO ' + self.prefix + 'sockets_sessions VALUES (' + value +')';
        try:
          self.mysql_query(q);
          log.println(q, 0);
        except Exception as e:
          log.println('INSERT INTO: Table ' + self.prefix + 'sockets_sessions had a MySQL error (' + self.mysql_errno(e) + '): ' + self.mysql_error(e))
          log.println(q)
    else:
      log.println('Table ' + self.prefix + 'sockets_sessions already has data!', 1);

    # create the users table
    if users != '':
      q = 'CREATE TABLE `' + self.prefix + 'users` ( '
      q += '`id` bigint(20) unsigned NOT NULL auto_increment,'
      q += '`uid` bigint(20) unsigned NOT NULL,'
      q += '`username` text,'
      q += '`email` text,'
      q += '`pwd` text,'
      q += '`created` datetime NOT NULL,' # 2014-12-23 06:00:00 (PST)
      q += '`connected` datetime NOT NULL,' # 2014-12-23 06:00:00 (PST)
      q += '`touched` datetime NOT NULL,' # 2014-12-23 06:00:00 (PST)
      q += users + ','
      q += 'UNIQUE KEY `id` (`id`));';
      try:
        qr = self.mysql_query(q)
        log.println(q, 0)
      except Exception as e:
        if self.mysql_errno(e) == 1050:
          log.println('Table ' + self.prefix + 'users already exists!', 1);
        else:
          log.println('Table ' + self.prefix + 'users had a MySQL error (' + self.mysql_errno(e) + '): ' + self.mysql_errstr(e));

  #
  # Drop XibbitHub required tables.
  #
  # @author DanielWHoward
  #
  def dropDatabaseTables(self, log, users=False):
    # this table only has temporary data
    try:
      q = 'DROP TABLE `' + self.prefix + 'sockets`;'
      self.mysql_query(q)
      log.println(q, 0)
    except Exception as e:
      log.println(str(e))

    # this table only has temporary data
    try:
      q = 'DROP TABLE `' + self.prefix + 'sockets_events`;'
      self.mysql_query(q)
      log.println(q, 0)
    except Exception as e:
      log.println(str(e))

    # this table only has temporary data
    try:
      q = 'DROP TABLE `' + self.prefix + 'sockets_sessions`;'
      self.mysql_query(q)
      log.println(q, 0)
    except Exception as e:
      log.println(str(e))

    # required for XibbitHub but might have persistent data
    if users:
      try:
        q = 'DROP TABLE `' + self.prefix + 'users`;'
        self.mysql_query(q)
        log.println(q, 0)
      except Exception as e:
        log.println(str(e))

# Socket.IO server global object
sioGlobalObject = socketio.Server(logger=False, engineio_logger=False, async_mode=None)
hubObjects = []

@sioGlobalObject.event
def connect(sid, environ):
  global hubObjects
  for hubObject in hubObjects:
    hubObject.socketio.get_handler('connect')(sid, environ)

@sioGlobalObject.event
def server(sid, message):
  global hubObjects
  for hubObject in hubObjects:
    hubObject.socketio.get_handler('server')(sid, message)

@sioGlobalObject.event
def disconnect_request(sid):
  global hubObjects
  for hubObject in hubObjects:
    hubObject.socketio.get_handler('disconnect_request')(sid)

@sioGlobalObject.event
def disconnect(sid):
  global hubObjects
  for hubObject in hubObjects:
    hubObject.socketio.get_handler('disconnect')(sid)

def background_thread():
  while True:
    for hubObject in hubObjects:
      hubObject.checkClock()
    sioGlobalObject.sleep(1)

thread = None
if thread is None:
  thread = sioGlobalObject.start_background_task(background_thread)
