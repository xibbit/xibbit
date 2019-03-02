///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////

//TODO implement long polling
//TODO implement JSONP

var crypto = require('crypto');
var fs = require('fs');

/**
 * Xibbit, main execution class to handle simple events
 * from JavaScript clients.
 *
 * @package Xibbit
 * @author Daniel Howard
 **/
module.exports = function() {
  var socketio = null;

  /**
   * Constructor.
   *
   * @author Daniel Howard
   **/
  function Xibbit(config) {
    config.vars.hub = this;
    this.config = config;
    this.prefix = '';
    this.onfn = {};
    this.apifn = {};
    this.impersonate = false;
    this.username = null;
    socketio = config.socketio;
    this.users = {};
    if (this.config['mysql'] && this.config['mysql']['SQL_PREFIX']) {
      this.prefix = this.config['mysql']['SQL_PREFIX'];
    } else if (this.config['mysqli'] && this.config['mysqli']['SQL_PREFIX']) {
      this.prefix = this.config['mysqli']['SQL_PREFIX'];
    }
  }

  /**
   * Start the Xibbit backend.
   *
   * @param $method string An event handling strategy.
   *
   * @author Daniel Howard
   **/
  Xibbit.prototype.start = function(method) {
    var self = this;
    if (typeof socketio !== 'undefined') {
      socketio.on('connection', function(socket) {
      // the connection values
      var user = {
        'username': null,
        'session': {
        },
        '_conn': {
          'socket': socket 
        }
      };
      // decode the event
      socket.on('server', function(event) {
        // process the event
        var events = [];
        var handled = false;
        if (!handled) {
          // verify that the event is well formed
          for (var key in event) {
            // _id is a special property so sender can invoke callbacks
            if ((key.substring(0, 1) === '_') && (['_id'].indexOf(key) === -1)) {
              event['e'] = 'malformed--property';
              events.push(event);
              handled = true;
              break;
            }
          }
          if (handled) {
            // run garbage collector
            self.gc(user, function() {
              // output any waiting events
              socket.emit('client', events[0]);
            });
          } else {
            // override the from property
            if (user.username === null) {
              if (event['from']) {
                delete event['from'];
              }
            } else {
              event['from'] = user.username;
            }
            // add _session and _conn properties for convenience
            event['_session'] = user.session;
            event['_conn'] = {
              socket: socket,
              user: user
            };
            // check event type
            if (!event['type']) {
              event['e'] = 'malformed--type';
              delete event['_session'];
              delete event['_conn'];
              events.push(event);
              socket.emit('client', events[0]);
              handled = true;
            }
            if (!handled && event['type']) {
              if (event['type'].match(/[a-z][a-z_]*/) === null) {
                event['e'] = 'malformed--type:'+event['type'];
                delete event['_session'];
                delete event['_conn'];
                events.push(event);
                socket.emit('client', events[0]);
                handled = true;
              }
            }
            // handle _instance event
            if (!handled && (event['type'] === '_instance')) {
              var instance = event['instance']? event['instance']: null;
              if (instance) {
                if (self.users[instance]) {
                  user.username = self.users[instance].username;
                  user.session = self.users[instance].session;
                  self.users[instance] = user;
                  event['i'] = 'instance retrieved';
                } else {
                  instance = null;
                }
              }
              if (!instance) {
                var length = 25;
                var a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                var instance = '';
                for (var i=0; i < length; i++) {
                  instance += a[self.instance_rand_secure(0, a.length)];
                }
                event['instance'] = instance;
                event['i'] = 'instance created';
                self.users[instance] = user;
              }
            }
            // handle the event
            if (!handled) {
              self.trigger(event, function(e, eventReply) {
              // remove the session property
              if (eventReply['_session']) {
                delete eventReply['_session'];
              }
              // remove the connection property
              if (eventReply['_conn']) {
                delete eventReply['_conn'];
              }
              // update the "from" property
              if (user.username !== null) {
                eventReply['from'] = user.username;
              }
              // reorder the properties so they look pretty
              var ret_reorder = {'type': eventReply['type']};
              if (eventReply['from']) {
                ret_reorder['from'] = eventReply['from'];
              }
              if (eventReply['to']) {
                ret_reorder['to'] = eventReply['to'];
              }
              // _id is the sender's id so sender can invoke callbacks
              if (eventReply['_id']) {
                ret_reorder['_id'] = eventReply['_id'];
              }
              // _instance event does not require an implementation; it's optional
              if ((eventReply['type'] === '_instance') && eventReply['e']
                  && (eventReply['e'] === 'unimplemented')) {
                delete eventReply['e'];
              }
              ret_reorder = Object.assign(ret_reorder, eventReply);
              events.push(ret_reorder);
              handled = true;
              // run the garbage collector
              self.gc(user, function() {
              // output any waiting events
              self.preReceive(events, user.session, function(events) {
              self.receive(events, user.session, function(events) {
                for (e=0; e < events.length; ++e) {
                  socket.emit('client', events[0]);
                }
              });
              });
              });
              });
            }
          }
        }
      });
      // socket disconnected
      socket.on('disconnect', function() {
        delete user._conn;
        self.gc(user, function() {
        });
      });
      });
    }
  }

  /**
   * Provide an authenticated callback for an event.
   *
   * @param type string The event to handle.
   * @param fn mixed A function that will handle the event.
   *
   * @author Daniel Howard
   **/
  Xibbit.prototype.on = function(type, fn) {
    this.onfn[type] = fn;
  };

  /**
   * Provide an unauthenticated callback for an event.
   *
   * @param type string The event to handle.
   * @param fn mixed A function that will handle the event.
   *
   * @author Daniel Howard
   **/
  Xibbit.prototype.api = function(type, fn) {
    this.apifn[type] = fn;
  };

  /**
   * Invoke callbacks for an event.
   *
   * @param event array The event to handle.
   *
   * @author Daniel Howard
   **/
  Xibbit.prototype.trigger = function(event, callback) {
    var self = this;
    var eventType = event['type'];
    var pluginsFolder = null;
    var handlerFile = null;
    var handler = null;
    var authenticated = false;
    var invoked = !!event.e;
    // load event handler dynamically
    if (invoked) {
      callback(null, event);
    } else if (self.onfn[eventType] || self.apifn[eventType]) {
      // clone the event
      var eventReply = self.cloneEvent(event);
      // find the event handler to invoke
      handler = ((handler === null) && self.onfn[eventType])? self.onfn[eventType]: handler;
      handler = ((handler === null) && self.apifn[eventType])? self.apifn[eventType]: handler;
      // authenticate
      if (self.onfn[eventType] && !event['from'] && !event._session && !event._session.username) {
        if (self.apifn[eventType]) {
          handler = self.apifn[eventType];
        } else {
          eventReply.e = 'unauthenticated';
          callback(null, eventReply);
          invoked = true;
        }
      }
      // invoke the handler
      if (!invoked) {
        try {
          var deferredFn = handler(eventReply, self.config.vars, function(eventReply) {
            // handle asynchronous asserte() failure
            if (!eventReply.type) {
              let e = eventReply;
              eventReply = self.cloneEvent(event);
              eventReply.e = e;
            }
            callback(null, eventReply);
          });
          if (deferredFn) {
            new Promise(deferredFn).then(eventReply => {
              // handle asynchronous asserte() failure
              if (!eventReply.type) {
                let e = eventReply;
                eventReply = self.cloneEvent(event);
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
          promise.resolve(stats.isDirectory()? 'events/': null);
        });
      });
      // resolve the promise
      all.resolve(function(folders) {
        if (folders[1]) {
          folders[0].push(folders[1]);
        }
        folders = folders[0];
        var handlerFolders = folders;
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
              callback(null, event);
            } else if (!self.onfn[eventType]
                && !self.apifn[eventType]) {
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
              if (misnamed === null) {
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
   * Send an event to another user and, optionally,
   * provide a callback to process a response.
   *
   * @param event array The event to send.
   * @return boolean True if the event was sent.
   *
   * @author Daniel Howard
   **/
  Xibbit.prototype.send = function(event, callback) {
    var self = this;
    var to = null;
    var user = null;
    var sent = false;
    // decode JSON string if needed
    if (typeof event === 'string') {
      event = JSON.parse(event);
    }
    // send an array of events
    if (Array.isArray(event)) {
      for (var e=0; e < event.length; ++e) {
        this.send(event[e], callback);
      }
      return;
    }
    var sent = false;
    // remove _session value
    var session = null;
    var isSession = false;
    if (event['_session']) {
      session = event['_session'];
      delete event['_session'];
      isSession = true;
    }
    // remove _conn value
    var conn = null;
    var isConn = false;
    if (event['_conn']) {
      conn = event['_conn'];
      delete event['_conn'];
      isConn = true;
    }
    // convert _id to __id
    var id = null;
    if (event['_id']) {
      id = event['_id'];
      delete $event['_id'];
      event['__id'] = id;
    }
    // provide special __send event for caller to implement aliases, groups, all addresses
    self.trigger({
      'type': '__send',
      'event': event
    }, function(e, ret) {
    if ((ret.length > 0) && ret[0]['e'] && ret[0]['e'] === 'unimplemented') {
      this.rawSend(event);
    }
    sent = true;
    if (isSession) {
      event['_session'] = session;
    }
    if (isConn) {
      event['_conn'] = conn;
    }
    if (id !== null) {
      delete $event['__id'];
      event['_id'] = id;
    }
    if (callback) {
      callback(event);
    }
    });
  };

  /**
   * Apply __receive event to these events.
   *
   * @return array An array of altered events.
   *
   * @author Daniel Howard
   **/
  Xibbit.prototype.preReceive = function(events, session, callback) {
    // provide special __receive event for alternative event system
    this.trigger({
      'type': '__receive',
      '_session': session
    }, function(e, ret) {
      if ((ret['type'] !== '__receive') || !ret['e'] || (ret['e'] !== 'unimplemented')) {
        if (ret['events']) {
          events = events.concat(ret['events']);
        }
      }
      callback(events);
    });
  };

  /**
   * Return an array of events for this user.
   *
   * @return array An array of events.
   *
   * @author Daniel Howard
   **/
  Xibbit.prototype.receive = function(events, session, callback) {
//    if (session.username === null) {
//      return events;
//    }
    callback(events);
    return;
    var eventsNow = [];
    // read events for this user from database
    $q = 'SELECT * FROM `'+$this.config['mysql']['SQL_PREFIX']+'events` WHERE `to`=\''+$this.username+'\';';
    $qr_events = mysql_query($q, $this.config['mysql']['link']);
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
    $q = 'DELETE FROM `'+$this.config['mysql']['SQL_PREFIX']+'events` WHERE `to`=\''+$this.username+'\';';
    mysql_query($q, $this.config['mysql']['link']);
    usort($eventsNow, array($this, 'cmp'));
    return $eventsNow;
  };

  /**
   * Return user status, permissions, etc.
   *
   * @param username string The user name of the user to retrieve.
   * @return array The user.
   *
   * @author Daniel Howard
   **/
  Xibbit.prototype.getUser = function(username) {
    var self = this;
    var user = null;
    if (self.users[username]) {
      return self.users[username];
    }
    for (var instance in self.users) {
      if (self.users[instance]['username'] === username) {
        user = self.users[instance];
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
   * @author Daniel Howard
   **/
  Xibbit.prototype.getUsers = function() {
    var self = this;
    return self.users;
  };

  /**
   * Return the names of logged in users who have not pinged the server in
   * a number of seconds.
   *
   * @param secs int A number of seconds.
   * @return array An array of disconnected users.
   *
   * @author Daniel Howard
   **/
  Xibbit.prototype.getDisconnectedUsers = function(secs) {
    return [];
  };

  /**
   * Connect or disconnect a user from the event system.
   *
   * @param event array The event to connect or disconnect.
   * @param connect boolean Connect or disconnect.
   * @return array The modified event.
   *
   * @author Daniel Howard
   **/
  Xibbit.prototype.connect = function(event, connect) {
    var self = this;
    // save the connection as a session variable
    var username = connect? event['to']: event['from'];
    // update last connection time for user in the database
    var connected = 0;
    var user = event._conn.user;
    // update username variables
    if (!user.impersonate) {
        if (connect) {
          user.username = username;
          user.session['username'] = username;
        } else {
          user.session['username'] = null;
          user.username = null;
        }
    }
  };

  /**
   * Update the connected value for this user.
   *
   * @author Daniel Howard
   **/
  Xibbit.prototype.touch = function() {
  };

  /**
   * Insert an event into the event queue.
   *
   * @param event array The event to insert.
   *
   * @author Daniel Howard
   **/
  Xibbit.prototype.rawSend = function(event) {
    var self = this;
    var to = event['to'];
    var user = null;
    if (to) {
      user = self.getUser(to);
      if (!user) {
        user = self.users[to];
      }
      if (user) {
        var session = event['_session'];
        var conn = event['_conn'];
        delete event['_session'];
        delete event['_conn'];
        user['_conn'].socket.emit('client', event);
        event['_session'] = session;
        event['_conn'] = conn;
      }
    }
  }

  /**
   * Clone an event but share embedded session.
   *
   * @param event array The event to handle.
   *
   * @author Daniel Howard
   **/
  Xibbit.prototype.cloneEvent = function(event) {
    // clone the event
    var _conn = event._conn? event._conn: null;
    if (_conn) {
      delete event._conn;
    }
    var clone = JSON.parse(JSON.stringify(event));
    clone._session = event._session;
    if (_conn) {
      event._conn = _conn;
      clone._conn = _conn;
    }
    return clone;
  };

  /**
   * Return a random number in a range.
   *
   * @param min int The minimum value.
   * @param max int The maximum value.
   * @return A random value.
   *
   * @author Daniel Howard
   **/
  Xibbit.prototype.instance_rand_secure = function(min, max) {
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
   * Sort events by the __id database property.
   *
   * @param a array An event.
   * @param b array A different event.
   * @return int 1, -1 or 0.
   *
   * @author Daniel Howard
   **/
  Xibbit.prototype.cmp = function(a, b) {
    return a['___id'] > b['___id']? 1: (a['___id'] < b['___id']? -1: 0);
  };

  /**
   * Emit an array as JSON or JSONP.
   *
   * @param json mixed An array to be converted to JSON.
   *
   * @author Daniel Howard
   **/
  Xibbit.prototype.jsonp = function(json) {
    // stringify JSON
    json = JSON.stringify(json);
    // use JSONP if a callback is provided
    if (isset($_GET['callback'])) {
      header('Content-Type: application/javascript');
      print($_GET['callback']+'('+$json+')');
    } else {
      header('Content-Type: application/json');
      print($json);
    }
  }

  /**
   * Garbage collector.
   *
   * @author Daniel Howard
   **/
  Xibbit.prototype.gc = function(user, callback) {
    var self = this;
    // update this user
    self.touch();
    // provide special __gc event for caller to do housekeeping
    self.trigger({
      'type': '__gc'//,
//      'from': username,
//      'to': username
//      'user': user,
//      '_session': user._session
    }, function() {

    // read users from database that should be disconnected
    var disconnect_seconds = 10;
    var usernames = self.getDisconnectedUsers(disconnect_seconds);
    for (var u=0; u < usernames.length; ++u) {
      self.trigger({
        'type': 'logout',
        'from': usernames[u],
        'to': usernames[u]
      }, function() {});
    }
    callback();
    });
  };

  return Xibbit;
};
