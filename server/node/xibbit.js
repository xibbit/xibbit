// The MIT License (MIT)
//
// xibbit 1.5.3 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// @version 1.5.3
// @copyright xibbit 1.5.3 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
var crypto = require('crypto');
var fs = require('fs');
var moment = require('moment-timezone');

/**
 * A socket handling hub object that makes it
 * easy to set up sockets, dispatch client socket
 * packets to a server-side event handler and send
 * packets back to the client.
 *
 * @package xibbit
 * @author DanielWHoward
 **/
module.exports = function() {
  /**
   * Constructor.
   *
   * @author DanielWHoward
   **/
  function XibbitHub(config) {
    if (!config.vars) {
      config.vars = {};
    }
    config.vars.hub = this;
    this.config = config;
    this.suppressCloneSession = false;
    this.handler_groups = {
      'api': {},
      'on': {},
      'int': {}
    };
    this.sessions = [];
    this.prefix = '';
    this.socketio = config.socketio;
    if (this.config['mysql'] && this.config['mysql']['SQL_PREFIX']) {
      this.prefix = this.config['mysql']['SQL_PREFIX'];
    } else if (this.config['mysqli'] && this.config['mysqli']['SQL_PREFIX']) {
      this.prefix = this.config['mysqli']['SQL_PREFIX'];
    }
  }

  /**
   * Return the Socket.IO instance.
   *
   * This might be the Socket.IO server instance
   * or the Socket.IO library instance.
   *
   * @return The Socket.IO instance.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.getSocketIO = function(sock) {
    return this.socketio;
  };

  /**
   * Get the session associated with a socket which always
   * has a session_data key and a _conn key.  The _conn key
   * has a map that contains a sockets key with an array of
   * sockets.  A socket is globally unique in the sessions
   * object.
   *
   * There is an instance_id key in the session_data map
   * which is globally unique or the empty string.
   *
   * Multiple sockets can be associated with the same
   * session (browser reloads).
   *
   * A socket will not have an instance_id until it receives
   * an _instance event.
   *
   * @param sock Object A socket.
   * @return map The session object with session_data and _conn keys.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.getSession = function(sock) {
    var self = this;
    var session = null;
    var i = self.getSessionIndex(sock);
    if (i !== -1) {
      session = self.cloneSession(self.sessions[i])
    }
    return session;
  };

  /**
   * This is an implementation helper.  It assumes that
   * the session store is an array.
   *
   * @param sock Object A socket.
   * @returns int The index into a session array.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.getSessionIndex = function(sock) {
    var self = this;
    for (var s=0; s < self.sessions.length; ++s) {
      for (var ss=0; ss < self.sessions[s]._conn.sockets.length; ++ss) {
        if (self.sessions[s]._conn.sockets[ss].id === sock.id) {
          return s;
        }
      }
    }
    return -1;
  };

  /**
   * Get the session associated with an instance.
   *
   * @param instance_id string An instance string.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.getSessionByInstance = function(instance_id) {
    var self = this;
    if ((typeof instance_id === 'string') && (instance_id !== '')) {
      for (var s=0; s < self.sessions.length; ++s) {
        var session = self.sessions[s];
        if (session.session_data.instance_id == instance_id) {
          return self.cloneSession(session);
        }
      }
    }
    return null;
  };

  /**
   * Get the session associated with a user (an
   * addressable recepient of a send message).
   *
   * The special &quot;all&quot; username refers
   * to all sessions.
   *
   * @param username string The username.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.getSessionsByUsername = function(username) {
    var self = this;
    var sessions = [];
    if (username === 'all') {
      sessions = self.sessions;
    } else {
      for (var s=0; s < self.sessions.length; ++s) {
        if (self.sessions[s].session_data._username === username) {
          sessions.push(self.sessions[s]);
        }
      }
    }
    return sessions;
  };

  /**
   * Change the session associated with a socket.
   *
   * @param sock socketio.Conn A socket.
   * @param session Object The session values.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.setSessionData = function(sock, sessionData) {
    var self = this;
    var i1 = self.getSessionIndex(sock);
    if (i1 == -1) {
    } else {
      var clone = self.cloneSession(sessionData);
      var ss = 0;
      for (ss=0; ss < self.sessions[i1]._conn.sockets.length; ++ss) {
        if (self.sessions[i1]._conn.sockets[ss].id === sock.id) {
          break;
        }
      }
      if (ss === self.sessions[i1]._conn.sockets.length) {
        self.sessions[i1]._conn.sockets.push(sock);
      }
      self.sessions[i1].session_data = clone;
    }
  };

  /**
   * Add a new, empty session only for this socket.
   *
   * @param sock socketio.Conn A socket.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.addSession = function(sock) {
    var self = this;
    var session = {
      session_data: {
        instance_id: ''
      },
      _conn: {
        sockets: [
          sock
        ]
      }
    };
    self.sessions.push(session);
  };

  /**
   * Remove the socket from the session or the whole session
   * if it is the only socket.
   *
   * @param sock socketio.Conn A socket.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.removeSocketFromSession = function(sock) {
    //TODO unimplemented removeSocketFromSession()
    var self = this;
    var i1 = self.getSessionIndex(sock);
    if (i1 == -1) {
    } else {
      var ss = 0;
      for (ss=0; ss < self.sessions[i1]._conn.sockets.length; ++ss) {
        if (self.sessions[i1]._conn.sockets[ss].id === sock.id) {
          break;
        }
      }
      if (ss < self.sessions[i1]._conn.sockets.length) {
        self.sessions[i1]._conn.sockets.splice(ss, 1);
      }
    }
  };

  /**
   * Delete the session that contains a socket and
   * add the socket to the session which represents
   * an instance.
   *
   * When a socket connects, it is assigned to a new
   * empty session but, when the _instance event
   * arrives, that socket might need to be assigned
   * to an existing session and the new session
   * destroyed.
   *
   * @param instance_id string The instance to add the socket to.
   * @param sock socketio.Conn The socket to be moved.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.combineSessions = function(instance_id, sock) {
    var self = this;
    var i = self.getSessionIndex(sock);
    self.sessions.splice(i, 1);
    for (var s=0; s < self.sessions.length; ++s) {
      if (self.sessions[s].session_data.instance_id === instance_id) {
        self.sessions[s]._conn.sockets.push(sock);
        break;
      }
    }
  };

  /**
   * Return a duplicate of the session with no shared
   * pointers except for the special _conn key, if it
   * exists.  This method works for the entire session
   * or just the session_data in a session.
   *
   * A clone prevents a common coding error where the
   * code relies on shared pointers rather than using
   * the setSessionData() method.
   *
   * The usual implementation is to convert to JSON and
   * then back again.  For some types, a workaround must
   * be implemented.
   *
   * @param session map The session or session_data.
   * @return map The clone.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.cloneSession = function(session) {
    var self = this;
    if (self.suppressCloneSession) {
      return session;
    }
    var conn = null;
    if (session.hasOwnProperty('_conn')) {
      conn = session._conn;
      delete session._conn;
    }
    var clone = JSON.parse(JSON.stringify(session));
    if (conn !== null) {
      clone._conn = conn;
      session._conn = conn;
    }
    return clone;
  };

  /**
   * Return a JSON string with keys in a specific order.
   *
   * @param s string A JSON string with keys in random order.
   * @param first array An array of key names to put in order at the start.
   * @param last array An array of key names to put in order at the end.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.reorderJson = function(s, first, last) {
    var i = 0;
    var targets = [];
    var sMap = JSON.parse(s);
    // separate into an array of objects/maps
    for (i=0; i < (first.length + last.length + 1); ++i) {
      var k = '';
      targets.push({});
      if (i < first.length) {
        k = first[i];
      } else if (i > first.length) {
        k = last[i - first.length + 1];
      }
      if ((k !== '') && (typeof sMap[k] !== 'undefined')) {
        targets[i][k] = sMap[k];
        delete sMap[k];
      }
    }
    targets[first.length] = sMap;
    // build JSON string from array of objects/maps
    s = '';
    for (i=0; i < targets.length; ++i) {
      var target = targets[i];
      if (Object.keys(target).length > 0) {
        var sTarget = JSON.stringify(target);
        if (s === '') {
          s = sTarget;
        } else {
          s = s.substring(0, s.length-1) + "," + sTarget.substring(1);
        }
      }
    }
    return s;
  };

  /**
   * Return a JSON string with keys in a specific order.
   *
   * @param s string A JSON string with keys in random order.
   * @param first array An array of key names to put in order at the start.
   * @param last array An array of key names to put in order at the end.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.reorderMap = function(source, first, last) {
    // create JSON maps
    var target = {};
    // save the first key-value pairs
    for (var f=0; f < first.length; ++f) {
      var key = first[f];
      if (typeof source[key] !== 'undefined') {
        target[key] = source[key];
      }
    }
    // save the non-first and non-last key-value pairs
    var keys = Object.keys(source);
    for (var k=0; k < keys.length; ++k) {
      var key = keys[k];
      var value = source[key];
      if ((first.indexOf(key) === -1) && (last.indexOf(key) === -1)) {
        target[key] = value;
      }
    }
    // save the last key-value pairs
    for (var l=0; l < last.length; ++l) {
      var key = last[l];
      if (typeof source[key] !== 'undefined') {
        target[key] = source[key];
      }
    }
    return target;
  };

  /**
   * Start the xibbit server system.
   *
   * @param method string An event handling strategy.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.start = function(method) {
    var self = this;
    if (typeof self.socketio !== 'undefined') {
      // socket connected
      self.socketio.on('connection', function(socket) {
      var session = self.getSession(socket);
      if (session === null) {
        self.addSession(socket);
      }
      // decode the event
      socket.on('server', function(event) {
        var allowedKeys = ['_id'];
        var allowedTypes = ['_instance'];
        var session = self.getSession(socket);
        // process the event
        var events = [];
        var handled = false;
        if (typeof event !== 'object') {
          // the event is not JSON
          event = {};
          event.e = 'malformed--json';
          events.push(['client', event]);
          handled = true;
        }
        if (!handled && (Object.keys(event).length > 0)) {
          // see if the event has illegal keys
          for (var key in event) {
            // _id is a special property so sender can invoke callbacks
            if ((key.substring(0, 1) === '_') && (allowedKeys.indexOf(key) === -1)) {
              event['e'] = 'malformed--property';
              events.push(['client', event]);
              handled = true;
              break;
            }
          }
        }
        if (!handled) {
          // see if there is no event type
          if (!event.type) {
            event.e = 'malformed--type';
            events.push(['client', event]);
            handled = true;
          }
        }
        if (!handled) {
          // see if event type has illegal value
          var typeStr = (typeof event.type === 'string')? event.type: '';
          var typeValidated = typeStr.match(/[a-z][a-z_]*/) !== null;
          if (!typeValidated) {
            typeValidated = (typesAllowed.indexOf(typeStr) !== -1);
          }
          if (!typeValidated) {
            event.e = 'malformed--type:'+event['type'];
            events.push(['client', event]);
            handled = true;
          }
        }
        // handle _instance event
        if (!handled && (event.type === '_instance')) {
          var created = 'retrieved';
          // instance value in event takes priority
          var instance = (typeof event.instance === 'string')? event.instance: '';
          // recreate session
          if (self.getSessionByInstance(instance) === null) {
            var instanceMatched = instance.match(/^[a-zA-Z0-9]{25}$/) !== null;
            if (instanceMatched) {
              created = 'recreated';
            } else {
              var length = 25;
              var a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
              instance = '';
              for (var i=0; i < length; i++) {
                instance += a[self.rand_secure(0, a.length)];
              }
              created = 'created';
            }
            // create a new instance for every tab even though they share session cookie
            event.instance = instance;
            // save new instance_id in session
            session.session_data.instance_id = instance;
            self.setSessionData(socket, session.session_data);
          } else {
            self.combineSessions(instance, socket);
          }
          session = self.getSessionByInstance(instance);
          event.i = 'instance '+created;
        }
        // handle the event
        if (!handled) {
          event._session = session.session_data;
          event._conn = {
            socket: socket
          };
          self.trigger(event, function(e, eventReply) {
          // save session changes
          self.setSessionData(socket, eventReply._session);
          // remove the session property
          if (eventReply._session) {
            delete eventReply._session;
          }
          // remove the connection property
          if (eventReply._conn) {
            delete eventReply._conn;
          }
          // _instance event does not require an implementation; it's optional
          if ((eventReply['type'] === '_instance') && eventReply['e']
              && (eventReply['e'] === 'unimplemented')) {
            delete eventReply['e'];
          }
          // reorder the properties so they look pretty
          var reorderedEventReply = self.reorderMap(eventReply,
            ['type', 'from', 'to', '_id'],
            ['i', 'e']
          );
          events.push(['client', reorderedEventReply]);
          handled = true;
          // emit all events
          for (var e=0; e < events.length; ++e) {
            socket.emit(events[e][0], events[e][1]);
          }
          });
        } else {
          // emit all events
          for (var e=0; e < events.length; ++e) {
            socket.emit(events[e][0], events[e][1]);
          }
        }
      });
      // socket disconnected
      socket.on('disconnect', function() {
        self.removeSocketFromSession(socket);
        self.checkClock(function() {});
      });
      });

      // run the garbage collector
      setInterval(function() {
        self.checkClock(function() {});
        for (var s=0; s < self.sessions.length; ++s) {
          (function(s) {
            self.receive([], self.sessions[s].session_data, false, function(e, events) {
              for (e=0; e < events.length; ++e) {
                for (var ss=0; ss < self.sessions[s]._conn.sockets.length; ++ss) {
                  try {
                    self.sessions[s]._conn.sockets[ss].emit('client', events[e]);
                  } catch (e) {
                  }
                }
              }
            });
          })(s);
        }
      }, 1000);
    }
  }

  /**
   * Package events, execute them and return response events.
   *
   * @param array fileEvents
   * @return NULL[]
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.readAndWriteUploadEvent = function(typ, fn) {
    this.handler_groups['on'][typ] = fn;
  };

  /**
   * Provide an authenticated callback for an event.
   *
   * @param typ string The event to handle.
   * @param fn mixed A function that will handle the event.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.on = function(group, typ, fn) {
    this.handler_groups[group][typ] = fn;
  };

  /**
   * Search, usually the file system, and dynamically
   * load an event handler for this event, if supported
   * by this language/platform.
   *
   * Some languages/platforms do not support loading code
   * on the fly so this method might do nothing.
   *
   * An error is returned if the handler cannot be loaded,
   * the file is improperly named or other error that the
   * loader may notice.
   *
   * @param event map The event to handle.
   * @return error If the loader had an error.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.loadHandler = function(event, skip, callback) {
    var self = this;
    var eventType = event['type'];
    // get the plugins folder
    var pluginsFolder = null;
    if (skip) {
      callback(null);
    } else {
      // get the plugins folder
      if (self.config['plugins']
          && self.config['plugins']['folder']) {
        pluginsFolder = self.config['plugins']['folder'];
      }
      // create a promise
      var all = [];
      all.resolve = function(f) {
        var a = this;
        if (f) a.resolved = f;
        if (!a.length) a.resolved([]);
        a.forEach(function(p) {
          p.resolve = function(v) {
            p.r = v;
            // fiddle here to modify resolver
            if (a.every(function(p) {
              return typeof p.r !== 'undefined';
            })) a.resolved(a.map(function(p) {
              return p.r;
            }));
          };
          p.call(a);
        });
      };
      // promise an array of plugin folders
      if (pluginsFolder !== null) {
        all.push(function promise() {
          fs.readdir(pluginsFolder, function(e, files) {
            if (files.length === 0) {
              promise.resolve([]);
            }
            // create a child promise
            var folders = [];
            folders.resolve = function(f) {
              var a = this;
              if (f) a.resolved = f;
              if (!a.length) a.resolved([]);
              a.forEach(function(p) {
                p.resolve = function(v) {
                  p.r = v;
                  // fiddle here to modify resolver
                  if (a.every(function(p) {
                    return typeof p.r !== 'undefined';
                  })) a.resolved(a.map(function(p) {
                    return p.r;
                  }));
                };
                p.call(a);
              });
            };
            // add folders to the child promise
            for (var f=0; f < files.length; ++f) {
              folders.push(function(folder) {
                return function promise() {
                  fs.lstat(folder, function(e, stats) {
                    promise.resolve(!e && stats.isDirectory()? folder: null);
                  });
                };
              }(pluginsFolder+files[f]+'/server/node/events/'));
            }
            // resolve the child promise
            folders.resolve(function(a) {
              promise.resolve(a.filter(function(v) {
                return v !== null;
              }));
            });
          });
        });
      }
      // promise an events folder
      all.push(function promise() {
        fs.lstat('events', function(e, stats) {
          var eventsFolders = [];
          if (!e && stats && stats.isDirectory()) {
            eventsFolders = ['events/'];
          }
          promise.resolve(eventsFolders);
        });
      });
      // resolve the promise
      all.resolve(function(folders) {
        var handlerFolders = [].concat.apply([], folders);
        folders = folders.map(function(folder) {
          return function promise() {
            fs.lstat(folder+eventType+'.js', function(e, stats) {
              promise.resolve((!e && stats.isFile())? folder+eventType+'.js': null);
            });
          }
        });
        folders.resolve = function(f) {
          var a = this;
          if (f) a.resolved = f;
          if (!a.length) a.resolved([]);
          a.forEach(function(p) {
            p.resolve = function(v) {
              p.r = v;
              // fiddle here to modify resolver
              if (a.every(function(p) {
                return typeof p.r !== 'undefined';
              })) a.resolved(a.map(function(p) {
                return p.r;
              }));
            };
            p.call(a);
          });
        };
        folders.resolve(function(handlers) {
          handlers = handlers.filter(function(handler) {
            return handler;
          });
          if (handlers.length > 0) {
            var handlerFile = handlers[0];
            var apifn = Object.keys(self.handler_groups["api"]).length;
            var onfn = Object.keys(self.handler_groups["on"]).length;
            var fn = require('./'+handlerFile);
            if (typeof fn === 'function') {
              fn(self);
            }
            if ((apifn === Object.keys(self.handler_groups["api"]).length)
                && (onfn === Object.keys(self.handler_groups["on"]).length)) {
              // found the file but didn't get an event handler
              event.e = 'unhandled:'+handlerFile;
              callback(null, event);
            } else if (!self.handler_groups["on"][eventType]
                && !self.handler_groups["api"][eventType]) {
              // found the file but got an event handler with a different name
              event.e = 'mismatch:'+handlerFile;
              callback(null, event);
            } else {
              self.trigger(event, callback);
            }
          } else {
            // see if some event handler files have similar names
            var misnamed = null;
            var handlerFiles = [];
            handlerFiles.resolve = function(f) {
              var a = this;
              if (f) a.resolved = f;
              if (!a.length) a.resolved([]);
              a.forEach(function(p) {
                p.resolve = function(v) {
                  p.r = v;
                  // fiddle here to modify resolver
                  if (a.every(function(p) {
                    return typeof p.r !== 'undefined';
                  })) a.resolved(a.map(function(p) {
                    return p.r;
                  }));
                };
                p.call(a);
              });
            };
            for (f=0; f < handlerFolders.length; ++f) {
              handlerFiles.push(function(f) {
                return function promise() {
                  fs.readdir(handlerFolders[f], function(e, files) {
                    files = files.map(function(file) {
                      return handlerFolders[f]+file;
                    });
                    promise.resolve(e? []: files);
                  });
                };
              }(f));
            }
            handlerFiles.resolve(function(handlerFiles) {
              handlerFiles = [].concat.apply([], handlerFiles);
              for (var f=0; f < handlerFiles.length; ++f) {
                var file = handlerFiles[f];
                var pos = file.lastIndexOf('/');
                if ((pos >= 0)
                    && (file.substring(pos+1, pos+1+(eventType+'.').length) === eventType+'.')) {
                  misnamed = file;
                  break;
                }
              }
              if ((misnamed === null) || (['__receive', '__send'].indexOf(eventType) !== -1)) {
                // did not find a file with an event handler
                event['e'] = 'unimplemented';
              } else {
                // found a file with a similar but incorrect name
                event['e'] = 'misnamed:'+misnamed;
              }
              callback(null, event);
            });
          }
        });
      });
    }
  };

  /**
   * Invoke callbacks for an event.
   *
   * @param event array The event to handle.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.trigger = function(event, callback) {
    var self = this;
    // clone the event
    var keysToSkip = ['_conn', '_session', 'image'];
    var eventType = event['type'];
    var eventReply = self.cloneEvent(event, keysToSkip);
    for (var k=0; k < keysToSkip.length; ++k) {
      var key = keysToSkip[k];
      if (event.hasOwnProperty(key)) {
        eventReply[key] = event[key];
      }
    }
    // determine authentication
    var authenticated = false;
    if (event.hasOwnProperty('_session') && event._session.hasOwnProperty('_username')
        && (event._session._username !== '')) {
      authenticated = true;
    }
    // try to find event handler to invoke
    var handler = null;
    var onHandler = self.handler_groups['on'][eventType] || null;
    var apiHandler = self.handler_groups['api'][eventType] || null;
    // try to load event handler dynamically
    var skipLoad = (onHandler !== null) || (apiHandler !== null);
    self.loadHandler(event, skipLoad, function(e) {
      if (e !== null) {
        eventReply.e = e;
      }
      // try to find event handler to invoke again
      var onHandler = self.handler_groups['on'][eventType] || null;
      var apiHandler = self.handler_groups['api'][eventType] || null;
      // determine event handler to invoke
      if (eventReply.hasOwnProperty('e')) {
        handler = null;
      } else if ((onHandler !== null) && authenticated) {
        handler = onHandler;
      } else if (apiHandler !== null) {
        handler = apiHandler;
      } else if ((onHandler !== null) && !authenticated) {
        handler = null;
        eventReply.e = 'unauthenticated';
      } else {
        handler = null;
        eventReply.e = 'unimplemented';
      }
      // invoke the handler
      if (handler !== null) {
        try {
          var deferredFn = handler(eventReply, self.config.vars, function(err, eventReply) {
            // handle asynchronous asserte() failure
            if (!eventReply.type) {
              let e = eventReply;
              eventReply = self.cloneEvent(event, keysToSkip);
              if (typeof event._conn !== 'undefined') {
                eventReply._conn = event._conn;
              }
              if (typeof event._session !== 'undefined') {
                eventReply._session = event._session;
              }
              if (typeof event._id !== 'undefined') {
                eventReply._id = event._id;
              }
              eventReply.e = e;
            }
            callback(null, eventReply);
          });
          if (deferredFn) {
            return new Promise(deferredFn).then(eventReply => {
              // handle asynchronous asserte() failure
              if (!eventReply.type) {
                let e = eventReply;
                eventReply = self.cloneEvent(event, keysToSkip);
                if (typeof event._conn !== 'undefined') {
                  eventReply._conn = event._conn;
                }
                if (typeof event._session !== 'undefined') {
                  eventReply._session = event._session;
                }
                if (typeof event._id !== 'undefined') {
                  eventReply._id = event._id;
                }
                eventReply.e = e.message;
                eventReply.e_stacktrace = e.stack;
                console.error(e);
              }
              callback(null, eventReply);
            }).catch(e => {
              eventReply.e = e.message;
              eventReply.e_stacktrace = e.stack;
              console.error(e);
              callback(null, eventReply);
            });
          }
        } catch (e) {
          // handle synchronous asserte() failure
          if (e.stack) {
            eventReply.e = 'Error';
            eventReply.e_stacktrace = e.stack;
          } else if ((e !== '') || (typeof e === 'string')) {
            eventReply.e = e;
          } else {
            try {
              eventReply.e = JSON.stringify(e);
            } catch (ee) {
              eventReply.e = 'nostringify:'+(typeof e);
            }
          }
          console.error(e);
          callback(null, eventReply);
        }
      }
    });
  };

  /**
   * Send an event to another user.
   *
   * The special &quot;all&quot; recipient
   * sends it to all logged in users.
   *
   * @param event map The event to send.
   * @param recipient string The username to send to.
   * @param emitOnly boolean Just call emit() or invoke __send event, too.
   * @return boolean True if the event was sent.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.send = function(event, recipient, emitOnly, callback) {
    var self = this;
    var sent = false;
    var user = null;
    var keysToSkip = ['_session', '_conn'];
    if (emitOnly) {
      var address = '';
      if (recipient) {
        address = recipient;
      } else if (event.to) {
        address = event.to;
      }
      if (address) {
        var recipients = self.getSessionsByUsername(address);
        for (var r=0; r < recipients.length; ++r) {
          var clone = self.cloneEvent(event, keysToSkip);
          try {
            var socket = recipients[r]._conn.socket;
            socket.emit('client', clone);
          } catch (e) {
          }
        }
      }
      if (callback) {
        callback();
      }
    } else {
      // temporarily remove _session property
      var keysToSkip = ['_session', '_conn', '_id', '__id'];
      var clone = self.cloneEvent(event, keysToSkip);
      // convert _id to __id
      if (event._id) {
        clone.__id = event._id;
      }
      // provide special __send event for caller to implement aliases, groups, all addresses
      self.trigger({
        'type': '__send',
        'event': clone
      }, function(e, eventReply) {
        if (eventReply.e && eventReply.e === 'unimplemented') {
          self.send(clone, recipient, true);
        }
        sent = true;
        // restore properties
        event = self.updateEvent(event, clone, keysToSkip);
        if (callback) {
          callback(event);
        }
      });
    }
  };

  /**
   * Return an array of events for this user.
   *
   * @return array An array of events.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.receive = function(events, session, collectOnly, callback) {
    var self = this;
    if (!callback) {
      return new Promise((resolve, reject) => {
        self.receive(events, session, collectOnly, function(e, events) {
          (e === null)? resolve(events): reject(e);
        });
      });
    }
    if (collectOnly) {
//    if (session._username === null) {
//      return events;
//    }
      callback(null, events);
    } else {
      // provide special __receive event for alternative event system
      self.trigger({
        'type': '__receive',
        '_session': session
      }, function(e, eventReply) {
        if ((eventReply['type'] !== '__receive') || !eventReply['e'] || (eventReply['e'] !== 'unimplemented')) {
          if (eventReply.eventQueue) {
            events = events.concat(eventReply.eventQueue);
          }
        }
        callback(null, events);
      });
    }
    return;
    var eventsNow = [];
    // read events for this user from database
    $q = 'SELECT * FROM `'+self.config['mysql']['SQL_PREFIX']+'events` WHERE `to`=\''+self.username+'\';';
    $qr_events = mysql_query($q, self.config['mysql']['link']);
    while ($row = mysql_fetch_assoc($qr_events)) {
      // integrate the 'json' column with the row
      $row = Object.assign($row, json_decode($row['json'], true));
      unset($row['json']);
      // reorder the properties so they look pretty
      $obj = {'type': $row['type'], 'from': $row['from'], 'to': $row['to'], '__id': $row['__id']};
      // _id is only for sender; __id shows sender's id; ___id is the database event id
      if (isset($row['id'])) {
        $obj['___id'] = $row['id'];
        unset($row['id']);
      }
      $obj = Object.assign($obj, $row);
      $eventsNow.push($obj);
    }
    // delete the events returned from the database
    $q = 'DELETE FROM `'+self.config['mysql']['SQL_PREFIX']+'events` WHERE `to`=\''+self.username+'\';';
    mysql_query($q, self.config['mysql']['link']);
    usort($eventsNow, array($this, 'cmp'));
    return $eventsNow;
  };

  /**
   * Connect or disconnect a user from the event system.
   *
   * @param event array The event to connect or disconnect.
   * @param connect boolean Connect or disconnect.
   * @return array The modified event.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.connect = function(event, username, connect) {
    var self = this;
    // update last connection time for user in the database
    var connected = 0;
    // update username variables
    if (connect) {
      event._session._username = username;
    } else {
      delete event._session._username;
    }
    return event;
  };

  /**
   * Update the connected value for this user.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.touch = function(session, callback) {
    callback = callback || function() {};
    var self = this;
    if (typeof(session._username) !== 'undefined') {
      var username = session._username;
      // update last ping for this user in the database
      var touched = moment(new Date(new Date().getTime())).tz(self.config.time_zone).format('YYYY-MM-DD HH:mm:ss');
      var nullDateTime = '1970-01-01 00:00:00';
      var q = 'UPDATE `' + self.prefix + 'users` SET `touched` = \'' + touched + '\' WHERE '
        +'`username` = \'' + username + '\' && '
        + '`connected` <> \'' + nullDateTime + '\';';
      self.mysql_query(q, callback);
    }
  };

  /**
   * Garbage collector.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.checkClock = function(callback) {
    var self = this;
    if (!callback) {
      return new Promise((resolve, reject) => {
        self.checkClock(function(e, locked) {
          (e === null)? resolve(locked): reject(e);
        });
      });
    }
    var config = self.config;
    var disconnect_seconds = 2 * 60;
    // try to lock the global variables
    self.lockGlobalVars(function(e, locked) {
      if (locked) {
        self.readGlobalVars(function(e, globalVars) {
          // create tick and lastTick native time objects
          var tick = new Date();
          var lastTick = new Date(tick.getTime());
          if (globalVars._lastTick && (typeof globalVars._lastTick === 'string')) {
            lastTickObject = Date.parse(globalVars._lastTick.split(' ').join('T'));
            if (lastTickObject) {
              lastTick = new Date(lastTickObject);
            }
          }
          if (globalVars._lastTick) {
            delete globalVars._lastTick;
          }
          // provide special __clock event for housekeeping
          self.trigger({
            type: '__clock',
            tick: tick,
            lastTick: lastTick,
            globalVars: globalVars
          }, function(e, event) {
            // write and unlock global variables
            globalVars = event.globalVars;
            globalVars._lastTick = tick.toISOString().substring(0, 19).split('T').join(' ');
            self.writeGlobalVars(globalVars, function() {
              self.unlockGlobalVars(function() {
                callback(e);
              });
            });
          });
        });
      } else {
        callback(e, !!locked);
      }
    });
  };

  /**
   * Update rows that have not been touched recently.
   *
   * @param secs int A number of seconds.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.updateExpired = function(table, secs, clause, callback) {
    var self = this;
    callback = callback || function() {};
    var nullDateTime = '1970-01-01 00:00:00';
    var expiration = moment(new Date(new Date().getTime() - (secs * 1000))).tz(self.config.time_zone).format('YYYY-MM-DD HH:mm:ss');
    var q = 'UPDATE `'+self.prefix+table+'` SET '
      +'connected=\''+nullDateTime+'\', '
      +'touched=\''+nullDateTime+'\' '
      +'WHERE (`touched` < \''+expiration+'\''+clause+');';
    self.mysql_query(q, callback);
  }

  /**
   * Delete rows that have not been touched recently.
   *
   * @param secs int A number of seconds.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.deleteExpired = function(table, secs, clause, callback) {
    var self = this;
    callback = callback || function() {};
    var expiration = moment(new Date(new Date().getTime() - (secs * 1000))).tz(self.config.time_zone).format('YYYY-MM-DD HH:mm:ss');
    var q = 'DELETE FROM `'+self.prefix+table+'` '
      +'WHERE (`touched` < \''+expiration+'\''+clause+');';
    self.mysql_query(q, callback);
  };

  /**
   * Delete rows in the first table that don't have a row in the second table.
   *
   * This is a way to manually enforce a foreign key constraint.
   *
   * @param table string A table to delete rows from.
   * @param column string A column to try to match to a column in the other table.
   * @param table2 string The other table that should have a corresponding row.
   * @param column2 string A column of the other table to match against.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.deleteOrphans = function(table, column, table2, column2, callback) {
    var self = this;
    callback = callback || function() {};
    var q = 'DELETE FROM `'+self.prefix+table+'` '
      +'WHERE NOT EXISTS (SELECT * FROM `'+self.prefix+table2+'` '
      +'WHERE `'+column2+'`=`'+self.prefix+table+'`.`'+column+'`);';
    self.mysql_query(q, callback);
  };

  /**
   * Sort events by the __id database property.
   *
   * @param a array An event.
   * @param b array A different event.
   * @return int 1, -1 or 0.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.cmp = function(a, b) {
    return a['___id'] > b['___id']? 1: (a['___id'] < b['___id']? -1: 0);
  };

  /**
   * Create a clone with a subset of key-value pairs.
   *
   * Often, there are unneeded or problematic keys
   * that are better to remove or copy manually to
   * the clone.
   *
   * @param event array An event to clone.
   * @param keysToSkip An array of keys to not copy to the clone.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.cloneEvent = function(event, keysToSkip) {
    // clone the event
    var clone = {};
    for (var key in event) {
      if (keysToSkip.indexOf(key) === -1) {
        clone[key] = event[key];
      }
    }
    return clone;
  };

  /**
   * Update the key-value pairs of an event using
   * the key-value pairs from a clone.
   *
   * This will only overwrite changed key-value
   * pairs; it will not copy unchanged key-value
   * pairs or remove keys.
   *
   * @param event array A target event.
   * @param clone array A source event.
   * @param keysToSkip An array of keys to not copy from the clone.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.updateEvent = function(event, clone, keysToSkip) {
    for (var key in clone) {
      if (keysToSkip.indexOf(key) === -1) {
        if (!(key in event) || (event[key] !== clone[key])) {
          event[key] = clone[key];
        }
      }
    }
    return event;
  };

  /**
   * Return a random number in a range.
   *
   * @param min int The minimum value.
   * @param max int The maximum value.
   * @return A random value.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.rand_secure = function(min, max) {
    var log = Math.log2(max - min);
    var bytes = Math.floor((log / 8) + 1);
    var bits = Math.floor(log + 1);
    var filter = Math.floor((1 << bits) - 1);
    var rnd = 0;
    do {
      rnd = parseInt(crypto.randomBytes(bytes).toString('hex'), 16);
      rnd = rnd & filter; // discard irrelevant bits
    } while (rnd >= (max - min));
    return Math.floor(min + rnd);
  };

  /**
   * Lock global variable in database for access.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.lockGlobalVars = function(callback) {
    var self = this;
    if (!callback) {
      return new Promise((resolve, reject) => {
        self.lockGlobalVars(function(e, oneAndOnly) {
          (e === null)? resolve(oneAndOnly): reject(e);
        });
      });
    }
    return self.lockGlobalVarsUsingSql(callback);
  };

  /**
   * Lock global variable in database for access.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.lockGlobalVarsUsingSql = function(callback) {
    var self = this;
    if (!callback) {
      return new Promise((resolve, reject) => {
        self.lockGlobalVarsUsingSql(function(e, oneAndOnly) {
          (e === null)? resolve(oneAndOnly): reject(e);
        });
      });
    }
    var now = moment(new Date()).tz(self.config.time_zone).format('YYYY-MM-DD HH:mm:ss');
    // generate a unique lock identifier
    var length = 25;
    var a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var lockId = '';
    for (var i=0; i < length; i++) {
      lockId += a[self.rand_secure(0, a.length)];
    }
    var vars = JSON.stringify({id: lockId});
    // try to get the lock
    var q = 'INSERT INTO '+self.prefix+'sockets_sessions '
      +'(`id`, `socksessid`, `connected`, `touched`, `vars`) VALUES ('
      +"0, "
      +"'lock', "
      +"'"+self.mysql_real_escape_string(now)+"', "
      +"'"+self.mysql_real_escape_string(now)+"', "
      +"'"+self.mysql_real_escape_string(vars)+"');";
    self.mysql_query(q, function(e, qr) {
      var oneAndOnly = !e;
      var unlock = oneAndOnly;
      if (oneAndOnly) {
        // retrieve lock ID and confirm that it's the same
        q = 'SELECT vars FROM '+self.prefix+'sockets_sessions WHERE `socksessid` = \'lock\'';
        self.mysql_query(q, function(e, rows) {
          if (e) {
            callback(e, rows);
          } else {
            var row;
            if (rows.length && (row = self.mysql_fetch_assoc(rows))) {
              oneAndOnly = (row['vars'] === vars)? true: false;
            } else {
              oneAndOnly = false;
            }
            self.mysql_free_query(rows);
            if (callback) {
              callback(null, oneAndOnly);
            }
          }
        });
      }
      if (!oneAndOnly) {
        // release the lock if it has been too long
        self.deleteExpired('sockets_sessions', 60, ' AND `socksessid` = \'lock\'', function() {
          callback(null, oneAndOnly);
        });
      }
    });
  };

  /**
   * Unlock global variable in database.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.unlockGlobalVars = function(callback) {
    var self = this;
    if (!callback) {
      return new Promise((resolve, reject) => {
        self.unlockGlobalVars(function(e, unlocked) {
          (e === null)? resolve(unlocked): reject(e);
        });
      });
    }
    return self.unlockGlobalVarsUsingSql(callback);
  };

  /**
   * Unlock global variable in database.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.unlockGlobalVarsUsingSql = function(callback) {
    var self = this;
    if (!callback) {
      return new Promise((resolve, reject) => {
        self.unlockGlobalVarsUsingSql(function(e, unlocked) {
          (e === null)? resolve(unlocked): reject(e);
        });
      });
    }
    // release the lock
    var q = 'DELETE FROM '+self.prefix+'sockets_sessions WHERE socksessid = \'lock\';';
    self.mysql_query(q, function(e) {
      callback(null, !e);
    });
  };

  /**
   * Read global variables from database.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.readGlobalVars = function(callback) {
    var self = this;
    if (!callback) {
      return new Promise((resolve, reject) => {
        self.readGlobalVars(function(e, vars) {
          (e === null)? resolve(vars): reject(e);
        });
      });
    }
    return self.readGlobalVarsUsingSql(callback);
  };

  /**
   * Read global variables from database.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.readGlobalVarsUsingSql = function(callback) {
    var self = this;
    if (!callback) {
      return new Promise((resolve, reject) => {
        self.readGlobalVarsUsingSql(function(e, vars) {
          (e === null)? resolve(vars): reject(e);
        });
      });
    }
    var q = 'SELECT vars FROM `'+self.prefix+'sockets_sessions` WHERE socksessid = \'global\';';
    self.mysql_query(q, function(e, qr) {
      var vars = {};
      if (s = self.mysql_fetch_assoc(qr)) {
        vars = JSON.parse(s.vars);
      }
      self.mysql_free_query(qr);
      callback(e, vars);
    });
  };

  /**
   * Write global variables to database.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.writeGlobalVars = function(vars, callback) {
    var self = this;
    if (!callback) {
      return new Promise((resolve, reject) => {
        self.writeGlobalVars(vars, function(e, written) {
          (e === null)? resolve(written): reject(e);
        });
      });
    }
    return self.writeGlobalVarsUsingSql(vars, callback);
  };

  /**
   * Write global variables to database.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.writeGlobalVarsUsingSql = function(vars, callback) {
    var self = this;
    if (!callback) {
      return new Promise((resolve, reject) => {
        self.writeGlobalVarsUsingSql(vars, function(e, written) {
          (e === null)? resolve(written): reject(e);
        });
      });
    }
    var now = moment(new Date()).tz(self.config.time_zone).format('YYYY-MM-DD HH:mm:ss');
    var s = JSON.stringify(vars);
    var q = 'UPDATE `'+self.prefix+'sockets_sessions` SET '
      +'`touched` = \''+now+'\','
      +'`vars` = \''+s+'\' '
      +'WHERE socksessid=\'global\';';
    self.mysql_query(q, callback);
  };

  /**
   * Flexible mysql_query() function.
   *
   * @param query String The query to execute.
   * @return The mysql_query() return value.
   *
   * @author DanielWHoward
   */
  XibbitHub.prototype.mysql_query = function(query, callback) {
    var self = this;
    if (!callback) {
      return new Promise((resolve, reject) => {
        self.mysql_query(query, function(e, qr) {
          (e === null)? resolve(qr): reject(e);
        });
      });
    }
    return self.config.mysql.link.query(query, callback);
  };

  /**
   * Flexible mysql_fetch_assoc() function.
   *
   * @param result String The result to fetch.
   * @return The mysql_fetch_assoc() return value.
   *
   * @author DanielWHoward
   */
  XibbitHub.prototype.mysql_fetch_assoc = function(result) {
    if (!result._idx) {
      result._idx = 0;
    }
    return result[result._idx++];
  };

  /**
   * Flexible mysql_free_result() function.
   *
   * @param result String The result to free.
   * @return The mysql_free_result() return value.
   *
   * @author DanielWHoward
   */
  XibbitHub.prototype.mysql_free_query = function(result) {
  };

  /**
   * Flexible mysql_real_escape_string() function.
   *
   * @param unescaped_string String The string.
   * @return The mysql_real_escape_string() return value.
   *
   * @author DanielWHoward
   */
  XibbitHub.prototype.mysql_real_escape_string = function(unescaped_string) {
    return (unescaped_string + '')
      .replace(/\0/g, '\\x00')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\\/g, '\\\\')
      .replace(/'/g, '\\\'')
      .replace(/"/g, '\\"')
      .replace(/\x1a/g, '\\\x1a');
  };

  /**
   * Flexible mysql_errno() function.
   *
   * @return The mysql_errno() return value.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.mysql_errno = function(e) {
    return e.errno;
  };

  /**
   * Flexible mysql_error() function.
   *
   * @return The mysql_error() return value.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.mysql_errstr = function(e) {
    return e.toString();
  };

  /**
   * Create XibbitHub required tables.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.createDatabaseTables = function(log, users, callback) {
    users = users || '';
    var self = this;
    var now = moment(new Date()).tz(self.config.time_zone).format('YYYY-MM-DD HH:mm:ss');
    var cb1 = function(table, q, callback) {
      self.mysql_query(q, function(e, qr) {
        if (!e) {
          log.println(q, 0);
        } else if (self.mysql_errno(e) == 1050) {
          log.println('Table ' + self.prefix + table + ' already exists!', 1);
        } else {
          log.println('Table ' + self.prefix + table + ' had a MySQL error (' + self.mysql_errno(e) + '): ' + self.mysql_errstr(e));
          log.println(q);
        }
        callback();
      });
    }
    var cb2 = function(table, q, callback) {
      self.mysql_query(q, function(e, qr) {
        if (!e) {
          log.println(q, 0);
        } else {
          log.println('INSERT INTO: Table ' + self.prefix + table + ' had a MySQL error (' + self.mysql_errno(e) + '): ' + self.mysql_errstr(e));
          log.println(q);
        }
        callback();
      });
    }
    var cb3 = function(table, q, callback) {
      self.mysql_query(q, function(e, qr) {
        if (qr.length === 0) {
          var pp = [];
          var values = [];
          values.push("0, 'global', '" + now + "', '" + now + "', '{}'");
          for (var v=0; v < values.length; ++v) {
            var value = values[v];
            q = 'INSERT INTO ' + self.prefix + table + ' VALUES (' + value + ')';
            pp.push([self.prefix + table, q, cb2]);
          }
          // execute the callbacks
          var p = callback;
          for (var i=pp.length - 1; i >= 0; i--) {
            p = (function(i, p) { return function() { pp[i][2](pp[i][0], pp[i][1], p); } })(i, p);
          }
          p();
        } else {
          log.println('Table ' + self.prefix + table + ' already has data!', 1);
          callback();
        }
      });
    }
    // create the sockets table
    //  this table contains all the sockets
    //
    //  a socket persists until the page is reloaded
    //  an instance/user persists across page reloads
    var pp = [];
    var q = 'CREATE TABLE `' + self.prefix + 'sockets` ( '
      + '`id` bigint(20) unsigned NOT NULL auto_increment,'
      + '`sid` text,'
      + '`connected` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
      + '`touched` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
      + '`props` text,'
      + 'UNIQUE KEY `id` (`id`));';
    pp.push(['sockets', q, cb1]);
    // create the sockets_events table
    //  this table holds undelivered events/messages for sockets
    q = 'CREATE TABLE `' + self.prefix + 'sockets_events` ( '
      + '`id` bigint(20) unsigned NOT NULL auto_increment,'
      + '`sid` text,'
      + '`event` mediumtext,'
      + '`touched` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
      + 'UNIQUE KEY `id` (`id`));';
    pp.push(['sockets_events', q, cb1]);
    // create the sockets_sessions table
    //  this table does double duty
    //  the 'global' row is a shared, persistent, global var
    //  the other rows contain session data that replaces PHP's
    //    session_start() function which is inflexible
    q = 'CREATE TABLE `' + self.prefix + 'sockets_sessions` ( '
      + '`id` bigint(20) unsigned NOT NULL auto_increment,'
      + '`socksessid` varchar(25) NOT NULL,'
      + '`connected` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
      + '`touched` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
      + '`vars` text,'
      + 'UNIQUE KEY `id` (`id`),'
      + 'UNIQUE KEY `socksessid` (`socksessid`));';
    pp.push(['sockets_sessions', q, cb1]);
    // add the global row to the sockets_sessions table
    var q = 'SELECT id FROM ' + self.prefix + 'sockets_sessions;';
    pp.push(['sockets_sessions', q, cb3]);
    // create the users stable
    if (users) {
      q = 'CREATE TABLE `' + self.prefix + 'users` ( '
        + '`id` bigint(20) unsigned NOT NULL auto_increment,'
        + '`uid` bigint(20) unsigned NOT NULL,'
        + '`username` text,'
        + '`email` text,'
        + '`pwd` text,'
        + '`created` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
        + '`connected` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
        + '`touched` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
        + users + ','
        + 'UNIQUE KEY `id` (`id`));';
      pp.push(['users', q, cb1]);
    }

    // execute the callbacks
    var p = callback;
    for (var i=pp.length - 1; i >= 0; i--) {
      p = (function(i, p) { return function() { pp[i][2](pp[i][0], pp[i][1], p); } })(i, p);
    }
    p();
  };

  /**
   * Drop XibbitHub required tables.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.dropDatabaseTables = function(log, users, callback) {
    users = users || false;
    var self = this;
    var cb = function(q, callback) {
      self.mysql_query(q, function(e, qr) {
        if (!e) {
          log.println(q, 0);
        } else {
          log.println(self.mysql_errstr(e));
        }
        callback();
      });
    }
    var q = [];
    // this table only has temporary data
    q.push('DROP TABLE `' + self.prefix + 'sockets`;');
    // this table only has temporary data
    q.push('DROP TABLE `' + self.prefix + 'sockets_events`;');
    // this table only has temporary data
    q.push('DROP TABLE `' + self.prefix + 'sockets_sessions`;');
    // required for XibbitHub but might have persistent data
    if (users) {
      q.push('DROP TABLE `' + self.prefix + 'users`;');
    }

    // execute the callbacks
    var p = callback;
    for (var i=q.length - 1; i >= 0; i--) {
      p = (function(i, p) { return function() { cb(q[i], p); } })(i, p);
    }
    p();
  };

  XibbitHub.XibbitHubOutputStream = XibbitHubOutputStream;

  return XibbitHub;
};
