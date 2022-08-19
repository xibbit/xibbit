// The MIT License (MIT)
//
// xibbit 1.5.2 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @version 1.5.2
// @copyright xibbit 1.5.2 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
    config.vars.hub = this;
    this.config = config;
    this.onfn = {};
    this.apifn = {};
    this.sessions = {};
    this.prefix = '';
    this.socketio = config.socketio;
    if (this.config['mysql'] && this.config['mysql']['SQL_PREFIX']) {
      this.prefix = this.config['mysql']['SQL_PREFIX'];
    } else if (this.config['mysqli'] && this.config['mysqli']['SQL_PREFIX']) {
      this.prefix = this.config['mysqli']['SQL_PREFIX'];
    }
  }

/**
 * Return the socket associated with a socket ID.
 *
 * @param $sid string The socket ID.
 * @return A socket.
 *
 * @author DanielWHoward
 **/
  XibbitHub.prototype.getSocket = function(sock) {
    return this.socketio;
  };

  /**
   * Get the session associated with a socket which always
   * has a data key and a _conn key.  The _conn key has a
   * map that contains a sockets key with an array of
   * sockets.  A socket is globally unique in the sessions
   * object.  The session may also have a username key and
   * an instance key.
   *
   * An instance is also globally unique.  A socket may
   * have a non-instance session or may be combined with
   * other sockets for an instanced session.
   *
   * @param sock socketio.Conn A socket.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.getSession = function(sock) {
    //TODO unimplemented getSession()
    return {};
  };

  /**
   * This is an implementation helper.  It assumes that
   * the session store is an array.
   *
   * @param sock socketio.Conn A socket.
   * @returns int The index into a session array.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.getSessionIndex = function(sock) {
    //TODO unimplemented getSessionIndex()
    return -1
  };

  /**
   * Get the session associated with an instance.
   *
   * @param instance string An instance string.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.getSessionByInstance = function(instance) {
    var self = this;
    if (self.sessions[instance]) {
      return self.sessions[instance];
    }
    return null;
  };

  /**
 * Change the session associated with a socket.
 *
 * @param sock socketio.Conn A socket.
 * @param session Object The session values.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.setSession = function(sock, session) {
    var self = this;
    self.sessions[session.instance] = session;
  };

  /**
   * Add a new, empty session only for this socket.
   *
   * @param sock socketio.Conn A socket.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.addSession = function(sock) {
    //TODO unimplemented addSession()
  };

  /**
   * Remove the socket from the session or the whole session
   * if it is the only socket.
   *
   * @param sock socketio.Conn A socket.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.removeSession = function(sock) {
    //TODO unimplemented removeSession()
  };

  /**
   * Return a duplicate of the session, though the _conn is shared.  A
   * clone prevents code from relying on shared pointers.
   *
   * @param session Object The session values.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.cloneSession = function(session) {
    return JSON.parse(JSON.stringify(session));
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
  XibbitHub.prototype.reorderArray = function(source, first, last) {
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
   * Start the xibbit system.
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
      // the connection values
      session = {
        instance: '',
        username: null,
        session_data: {
        },
        '_conn': {
          'socket': socket 
        }
      };
      // decode the event
      socket.on('server', function(event) {
        var allowedKeys = ['_id'];
        var allowedTypes = ['_instance'];
        var sess = self.getSession(socket);
        // process the event
        var events = [];
        var handled = false;
        if (typeof event !== 'object') {
          event = {};
          event.e = 'malformed--json';
          events.push(event);
          handled = true;
        }
        if (!handled && (Object.keys(event).length > 0)) {
          // verify that the event is well formed
          for (var key in event) {
            // _id is a special property so sender can invoke callbacks
            if ((key.substring(0, 1) === '_') && (allowedKeys.indexOf(key) === -1)) {
              event['e'] = 'malformed--property';
              events.push(event);
              handled = true;
              break;
            }
          }
          if (!handled) {
            // check event type exists
            if (!event.type) {
              event.e = 'malformed--type';
              events.push(event);
              handled = true;
            }
            // check event type is string and has valid value
            if (!handled) {
              var typeStr = (typeof event.type === 'string')? event.type: '';
              var typeValidated = typeStr.match(/[a-z][a-z_]*/) !== null;
              if (!typeValidated) {
                typeValidated = (typesAllowed.indexOf(typeStr) !== -1);
              }
              if (!typeValidated) {
                event.e = 'malformed--type:'+event['type'];
                events.push(event);
                handled = true;
              }
            }
            if (!handled) {
              // add _session and _conn properties for convenience
              event['_session'] = session.session_data;
              event['_conn'] = {
                socket: socket,
                user: session
              };
            }
            // handle _instance event
            if (!handled && (event.type === '_instance')) {
              var created = 'retrieved';
              // event instance value takes priority
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
                session.instance = instance;
                self.setSession(socket, session);
              }
              // update request with instance for convenience
              session = self.getSessionByInstance(instance);
              self.setSession(socket, session);
              session._conn.socket = socket;
              event._session = session.session_data;
//              event._session.instance = instance;
//              event._conn = session._conn;
              event.i = 'instance '+created;
            }
            // handle the event
            if (!handled) {
              self.trigger(event, function(e, eventsReply) {
              var eventReply = eventsReply[0];
//              self.setSession(socket, session);
              // remove the session property
              if (eventReply['_session']) {
                delete eventReply['_session'];
              }
              // remove the connection property
              if (eventReply['_conn']) {
                delete eventReply['_conn'];
              }
              // _instance event does not require an implementation; it's optional
              if ((eventReply['type'] === '_instance') && eventReply['e']
                  && (eventReply['e'] === 'unimplemented')) {
                delete eventReply['e'];
              }
              // reorder the properties so they look pretty
              var ret_reorder = self.reorderArray(eventReply,
                ['type', 'from', 'to', '_id'],
                ['i', 'e']
              );
              events.push(ret_reorder);
              handled = true;
              // emit all events
              for (var e=0; e < events.length; ++e) {
                socket.emit('client', events[e]);
              }
              });
            } else {
              // emit all events
              for (var e=0; e < events.length; ++e) {
                socket.emit('client', events[e]);
              }
            }
          }
        }
      });
      // socket disconnected
      socket.on('disconnect', function() {
        var sess = self.getSession(socket);
        self.removeSession(socket);
        self.checkClock();
        delete session._conn.socket;
      });
      });

      // run the garbage collector
      setInterval(function() {
        self.checkClock();
        for (var session in self.sessions) {
          self.receive([], self.sessions[session].session_data, false, function(events) {
            for (e=0; e < events.length; ++e) {
              if (self.sessions[session]._conn.socket) {
                self.sessions[session]._conn.socket.emit('client', events[e]);
              }
            }
          });
        }
      }, 1000);
    }
  }

  /**
   * Provide an authenticated callback for an event.
   *
   * @param typ string The event to handle.
   * @param fn mixed A function that will handle the event.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.on = function(typ, fn) {
    this.onfn[typ] = fn;
  };

  /**
   * Provide an unauthenticated callback for an event.
   *
   * @param typ string The event to handle.
   * @param fn mixed A function that will handle the event.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.api = function(typ, fn) {
    this.apifn[typ] = fn;
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
    var keysToSkip = ['_conn', '_session'];
    var eventType = event['type'];
    var pluginsFolder = null;
    var handlerFile = null;
    var handler = null;
    var invoked = !!event.e;
    // load event handler dynamically
    if (invoked) {
      callback(null, [event]);
    } else if (self.onfn[eventType] || self.apifn[eventType]) {
      // clone the event
      var eventReply = self.cloneEvent(event, keysToSkip);
      if (typeof event._conn !== 'undefined') {
        eventReply._conn = event._conn;
      }
      if (typeof event._session !== 'undefined') {
        eventReply._session = event._session;
      }
      if (typeof event._id !== 'undefined') {
        eventReply._id = event._id;
      }
      // find the event handler to invoke
      handler = ((handler === null) && self.onfn[eventType])? self.onfn[eventType]: handler;
      handler = ((handler === null) && self.apifn[eventType])? self.apifn[eventType]: handler;
      // authenticate
      if (self.onfn[eventType] && !event['from'] && !event._session && !event._session.username) {
        if (self.apifn[eventType]) {
          handler = self.apifn[eventType];
        } else {
          eventReply.e = 'unauthenticated';
          callback(null, [eventReply]);
          invoked = true;
        }
      }
      // invoke the handler
      if (!invoked) {
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
            callback(null, [eventReply]);
          });
          if (deferredFn) {
            new Promise(deferredFn).then(eventReply => {
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
              callback(null, [eventReply]);
            }).catch(e => {
              eventReply.e = e.message;
              eventReply.e_stacktrace = e.stack;
              console.error(e);
              callback(null, [eventReply]);
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
          callback(null, [eventReply]);
        }
      }
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
          promise.resolve(stats.isDirectory()? ['events/']: []);
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
            var apifn = Object.keys(self.apifn).length;
            var onfn = Object.keys(self.onfn).length;
            var fn = require('./'+handlerFile);
            if (typeof fn === 'function') {
              fn(self);
            }
            if ((apifn === Object.keys(self.apifn).length)
                && (onfn === Object.keys(self.onfn).length)) {
              // found the file but didn't get an event handler
              event.e = 'unhandled:'+handlerFile;
              callback(null, [event]);
            } else if (!self.onfn[eventType]
                && !self.apifn[eventType]) {
              // found the file but got an event handler with a different name
              event.e = 'mismatch:'+handlerFile;
              callback(null, [event]);
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
              callback(null, [event]);
            });
          }
        });
      });
    }
  };

  /**
   * Send an event to another user and, optionally,
   * provide a callback to process a response.
   *
   * @param event array The event to send.
   * @return boolean True if the event was sent.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.send = function(event, recipient, emitOnly, callback) {
    var self = this;
    var sent = false;
    var to = null;
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
        var recipients = [];
        if (address === 'all') {
          recipients = self.getUsers();
        } else {
          var user = self.getUser(address);
          if (user) {
            recipients.push(user);
          }
        }
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
      }, function(e, ret) {
        if ((ret.length > 0) && ret[0]['e'] && ret[0]['e'] === 'unimplemented') {
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
    if (collectOnly) {
//    if (session.username === null) {
//      return events;
//    }
      callback(events);
    } else {
      // provide special __receive event for alternative event system
      self.trigger({
        'type': '__receive',
        '_session': session
      }, function(e, rets) {
        var ret = rets[0];
        if ((ret['type'] !== '__receive') || !ret['e'] || (ret['e'] !== 'unimplemented')) {
          if (ret.eventQueue) {
            events = events.concat(ret.eventQueue);
          }
        }
        callback(events);
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
    var user = event._conn.user;
    // update username variables
    if (connect) {
      user.username = username;
      user.session_data['username'] = username;
    } else {
      user.session_data['username'] = null;
      user.username = null;
    }
  };

  /**
   * Update the connected value for this user.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.touch = function() {
  };

  /**
   * Garbage collector.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.checkClock = function(callback) {
    var self = this;
    callback = callback || function() {};
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
          }, function(e, events) {
            var event = events[0];
            // write and unlock global variables
            globalVars = event.globalVars;
            globalVars._lastTick = tick.toISOString().substring(0, 19).split('T').join(' ');
            self.writeGlobalVars(globalVars, function() {
              self.unlockGlobalVars(function() {
                callback();
              });
            });
          });
        });
      } else {
        callback();
      }
    });
  };

  /**
   * Return user status, permissions, etc.
   *
   * @param username string The user name of the user to retrieve.
   * @return array The user.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.getUser = function(username) {
    var self = this;
    var user = null;
    if (self.sessions[username]) {
      return self.sessions[username];
    }
    for (var instance in self.sessions) {
      if (self.sessions[instance]['username'] === username) {
        user = self.sessions[instance];
        break;
      }
    }
    return user;
  };

  /**
   * Return all users' status, permissions, etc.
   *
   * @return array An array of users.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.getUsers = function() {
    var self = this;
    var users = [];
    for (var user in self.sessions) {
      users.push(self.sessions[user]);
    }
    return users;
  };

  /**
   * Update rows that have not been touched recently.
   *
   * @param $secs int A number of seconds.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.updateExpired = function(table, secs, clause, callback) {
    var self = this;
    var nullDateTime = '1970-01-01 00:00:00';
    var expiration = moment(new Date(new Date().getTime() - (secs * 1000))).tz(self.config.time_zone).format('YYYY-MM-DD HH:mm:ss');
    var q = 'UPDATE `'+self.prefix+table+'` SET '
      +'connected=\''+nullDateTime+'\', '
      +'touched=\''+nullDateTime+'\' '
      +'WHERE (`touched` < \''+expiration+'\''+clause+');';
    self.mysql_query(q, callback? callback: function() {});
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
    var expiration = moment(new Date(new Date().getTime() - (secs * 1000))).tz(self.config.time_zone).format('YYYY-MM-DD HH:mm:ss');
    var q = 'DELETE FROM `'+self.prefix+table+'` '
      +'WHERE (`touched` < \''+expiration+'\''+clause+');';
    self.mysql_query(q, callback? callback: function() {});
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
  XibbitHub.prototype.deleteOrphans = function(table, column, table2, column2) {
    var self = this;
    var q = 'DELETE FROM `'+self.prefix+table+'` '
      +'WHERE NOT EXISTS (SELECT * FROM `'+self.prefix+table2+'` '
      +'WHERE `'+column2+'`=`'+self.prefix+table+'`.`'+column+'`);';
    self.mysql_query(q, callback? callback: function() {});
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
    callback = callback || function() {};
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
    var qr = self.mysql_query(q, function(e, qr) {
      var oneAndOnly = !e;
      var unlock = oneAndOnly;
      if (oneAndOnly) {
        // retrieve lock ID and confirm that it's the same
        q = 'SELECT vars FROM '+self.prefix+'sockets_sessions WHERE `socksessid` = \'lock\'';
        self.mysql_query(q, function(e, rows) {
          var row;
          if (rows.length && (row = self.mysql_fetch_assoc(rows)[0])) {
            oneAndOnly = (row['vars'] === vars)? true: false;
          } else {
            oneAndOnly = false;
          }
          self.mysql_free_query(rows);
          if (callback) {
            callback(null, oneAndOnly);
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
    callback = callback || function() {};
    // release the lock
    var q = 'DELETE FROM '+self.prefix+'sockets_sessions WHERE socksessid = \'lock\';';
    self.mysql_query(q, callback);
  };

  /**
   * Read global variables from database.
   *
   * @author DanielWHoward
   **/
  XibbitHub.prototype.readGlobalVars = function(callback) {
    var self = this;
    callback = callback || function() {};
    var q = 'SELECT vars FROM `'+self.prefix+'sockets_sessions` WHERE socksessid = \'global\';';
    self.mysql_query(q, function(e, qr) {
      var vars = {};
      if (s = self.mysql_fetch_assoc(qr)) {
        s = s[0];
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
    callback = callback || function() {};
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
    return result;
  };

  /**
   * Flexible mysql_free_result() function.
   *
   * @param $result String The result to free.
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

  return XibbitHub;
};
