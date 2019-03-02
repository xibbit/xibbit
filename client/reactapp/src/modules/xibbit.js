///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
/* global $, io */
/* exported xibbit */
'use strict';

var _$ = $;

/**
 * Create a xibbit object.
 * @author Daniel Howard
 **/
var xibbit = function() {
  var $ = _$;
  /**
   * A simple cookie class.
   * @author Daniel Howard
   **/
  var cookies = {
    /**
     * Get a cookie value.
     * @author Daniel Howard
     **/
    get: function(name) {
      var ca = (document && document.cookie)? document.cookie.split(';'): [];
      for (var c=0; c < ca.length; ++c) {
        var cookie = ca[c];
        while (cookie.charAt(0) === ' ') {
          cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf(name+'=') === 0) {
          var value = cookie.substring((name+'=').length);
          value = decodeURIComponent(value);
          try {
            return JSON.parse(value);
          } catch (e) {
            return value;
          }
        }
      }
      return null;
    },

    /**
     * Store a cookie value.
     * @author Daniel Howard
     **/
    put: function(name, value) {
      try {
        document.cookie = name+"="+JSON.stringify(value)+"; path=/";
      } catch (e) {
        // suppress any cookie setting errors
      }
    }
  };

  /**
   * Save a session instance.
   * @author Daniel Howard
   **/
  function preserveSession(self) {
    if ((typeof self.config.preserveSession === 'undefined') || (self.config.preserveSession !== false)) {
      if (typeof Storage === 'undefined') {
        cookies.put('xibbit', {
          instance: self.instance
        });
      } else {
        try {
          sessionStorage.setItem('xibbit', JSON.stringify({
            instance: self.instance
          }));
        } catch (e) {
          // only store session values in JavaScript
        }
      }
    }
  }

  /**
   * Do a long or short poll.
   * @author Daniel Howard
   **/
  function poll(self, events) {
    var query = '';
    if (self.instance === null) {
      // send _instance event
      var instanceEvent = {
        type: '_instance'
      };
      query += '_event=' + encodeURIComponent(JSON.stringify(instanceEvent));
      if (self.config.log) {
        console.log('%c'+JSON.stringify(instanceEvent), 'color:lightgreen');
      }
    } else {
      query += 'instance='+self.instance;
      query += '&_event=' + encodeURIComponent(events? JSON.stringify(events): '{}');
    }

    var url = $.isFunction(self.config.poll.url)? self.config.poll.url(): self.config.poll.url;
    var type = 'GET';
    var data = query;
    var jsonp = false;
    var success = false;
    self._pollStarted = $.now();
    var pollEvent = events && (events.type === '_poll');
    var pollParsed = 0;
    $.ajax({
      url: url,
      type: type,
      data: data,
      dataType: jsonp? 'jsonp': 'json',
      cache: false,
      timeout: self.config.poll.max,
      xhr: function() {
        var xhr = new window.XMLHttpRequest();
        if (pollEvent) {
          xhr.addEventListener('progress', function(evt) {
            var newEvts = evt.currentTarget.response.substring(pollParsed);
            var n = 0;
            pollParsed = evt.currentTarget.response.length;
            try {
              newEvts = JSON.parse(newEvts);
              for (n=0; n < newEvts.length; ++n) {
                self.dispatchEvent(newEvts[n]);
              }
            } catch (e) {
              newEvts = ('[' + newEvts + ']').split('][').join('],[');
              try {
                newEvts = JSON.parse(newEvts);
                for (n=0; n < newEvts.length; ++n) {
                  for (var n2=0; n2 < newEvts[n].length; ++n2) {
                    self.dispatchEvent(newEvts[n][n2]);
                  }
                }
              } catch (e) {
                // the server is spewing nonsense
              }
            }
          }, false);
        }
        return xhr;
      }
    }).done(function(event) {
      success = true;
      // pre-process _instance event
      if ($.isArray(event)) {
        $.each(event, function(key, event) {
          if ((event.type === '_instance') && event.instance && !self.instance) {
            self.instance = event.instance;
            preserveSession(self);
          }
        });
      } else if($.isPlainObject(event)) {
        if ((event.type === '_instance') && event.instance && !self.instance) {
          self.instance = event.instance;
          preserveSession(self);
        }
      }
      // send connected event, if needed
      if (!self.connected) {
        self.connected = true;
        var evt = {
          'type': 'connection',
          'on': 'poll'
        };
        $(self).trigger(evt.type, evt);
        // send any waiting events
        $.each(self.waitingEvents, function(index, event) {
          self.send(event.event, event.callback);
        });
        self.waitingEvents = [];
      }
      // send events to listeners
      if ($.isArray(event)) {
        $.each(event, function(key, event) {
          self.dispatchEvent(event);
        });
      } else if($.isPlainObject(event)) {
        self.dispatchEvent(event);
      }
      // restart the poll
      if (self.config.poll.start && !self.socket && !events) {
        var delay = self._pollStarted + self.config.poll.min - $.now();
        delay = (self.config.poll.strategy === 'long')? 0: delay;
        setTimeout(function() {
          if (self.config.poll.strategy === 'long') {
            poll(self, {type: '_poll'});
          } else {
            poll(self);
          }
        }, (delay < 0)? 0: delay);
      }
    }).fail(function(jqXHR) {
      var responseText = jqXHR.responseText;
      if (pollEvent) {
        console.log('%c{"type":"_poll","i":"'+jqXHR.status+':'+jqXHR.statusText+'"}', 'color:green');
        poll(self, {type: '_poll'});
      } else {
        // clean up error data and write to the console
        if (responseText) {
          responseText = responseText.replace(/(<([^>]+)>)/ig, ''); // HTML tags
          responseText = responseText.replace(/\n+/g, ' '); // newline -> space
          responseText = responseText.replace(/\:\s+/g, ': '); // extra spaces
          responseText = responseText.replace(/\#/g, '\n#'); // PHP stack trace
          responseText = responseText.replace(/&quot;/g, '"'); // real quotes
          console.log('%c'+jqXHR.status+' '+jqXHR.statusText+' '+responseText, 'color:deeppink');
        } else if (jqXHR.responseText === '') {
          console.log('%c'+jqXHR.status+' '+jqXHR.statusText+': server returned empty string', 'color:deeppink');
        } else {
          console.log('%c'+jqXHR.status+' '+jqXHR.statusText+': unknown client or server error', 'color:deeppink');
        }
        // send disconnected event, if needed
        if (self.connected && !self.socket) {
          self.connected = false;
          var evt = {
            'type': 'connection',
            'on': false
          };
          $(self).trigger(evt.type, evt);
        }
        // try reconnecting in n*2 seconds (max 16)
        self._reconnectIn = (self._lastReconnect < $.now() - 60000)? 1000: Math.min(self._reconnectIn * 2, 16000);
        self._lastReconnect = $.now();
        // restart the poll
        if (self.config.poll.start && !self.socket) {
          setTimeout(function() {
            poll(self);
          }, self._reconnectIn);
        }
      }
    });

    // doing JSONP and a long poll, test to see that the server is still alive
    if (jsonp) {
      // test to see if the server is still alive
      setTimeout(function() {
        var failfn = function() {
          if (!success) {
            var textStatus = 'error';
            console.log(textStatus);
          }
        };
        var noopfn = function() {
          var noopdone = false;
          var event = {type: 'noop', from: 'dan', sessionid: ''};
          $.ajax({
            url: self.actions.noop,
            data: event,
            dataType: 'jsonp',
            type: type,
            cache: false,
            timeout: 299000
          }).done(function(/*data*/) {
            noopdone = true;
            if (!success) {
              setTimeout(noopfn, 3000);
            }
          }).fail(function() {
            // since JSONP, never called
          });
          setTimeout(function() {
            if (!noopdone) {
              failfn();
            }
          }, 3000);
        };
        noopfn();
      }, 3000);
    }

    // This prevents Firefox from spinning indefinitely
    // while it waits for a response.
    /*
    if(url == 'jsonp' && $.browser.mozilla) {
      $.jsonp({
        'url': 'about:',
        timeout: 0
      });
    }
    */
  }

  /**
   * Create an xibbit object.
   * @author Daniel Howard
   **/
  function xibbit(config) {
    /* jshint validthis: true */
    var self = this;
    var cookie = null;
    self.config = config;
    if (typeof self.config.log === 'undefined') {
      self.config.log = false;
    }
    // set defaults for socket.io
    if (typeof self.config.socketio === 'undefined') {
      self.config.socketio = {};
    }
    if (typeof self.config.socketio.url !== 'string') {
      var h = window.location.protocol;
      var d = window.location.hostname;
      var p = window.location.port;
      self.config.socketio.host = h + '//' + d + (p? ':' + p: '');
    }
    if (self.config.socketio.start !== false) {
      self.config.socketio.start = true;
    }
    // set defaults for poll
    if (typeof self.config.poll === 'undefined') {
      self.config.poll = {};
    }
    if (typeof self.config.poll.url === 'undefined') {
      self.config.poll.url = '/events';
    }
    if (typeof self.config.poll.strategy !== 'string') {
      self.config.poll.strategy = 'short';
    }
    if (typeof self.config.poll.min !== 'number') {
      self.config.poll.min = 1000;
    }
    if (typeof self.config.poll.max !== 'number') {
      self.config.poll.max = 299000;
    }
    if (self.config.poll.start !== false) {
      self.config.poll.start = true;
    }
    self.connected = false;
    self.eventId = 1;
    self.instance = null;
    // do not allow parallel callback events; wait until previous event completes
    if ((typeof self.config.seq === 'undefined') || (self.config.seq !== true)) {
      self.config.seq = false;
    }
    if ((typeof self.config.preserveSession === 'undefined') || (self.config.preserveSession !== false)) {
      if (typeof Storage === 'undefined') {
        try {
          cookie = cookies.get('xibbit');
          if (cookie) {
            self.instance = cookie.instance;
          }
        } catch (e) {
          // only store session values in JavaScript
        }
      } else {
        try {
          cookie = sessionStorage.getItem('xibbit');
          if (cookie) {
            try {
              cookie = JSON.parse(cookie);
            } catch (e) {
              cookie = null;
            }
          }
          if (cookie) {
            self.instance = cookie.instance;
          }
        } catch (e) {
          // only store session values in JavaScript
        }
      }
    }
    if (self.config.log) {
      console.log('xibbit.instance='+self.instance);
    }
    self.requestEvents = {};
    self.waitingEvents = [];
    self.seqEvents = [];
    self.socket = null;
    // try to connect to Socket.IO
    if (self.config.socketio.start) {
      self.config.socketio.start = false;
      self.start('socket.io');
    }
    // use poll if sockets not available
    if (self.config.poll.start) {
      self.config.poll.start = false;
      self.start('poll');
    }
  }

  /**
   * Return true if the events are working.
   * @author Daniel Howard
   **/
  xibbit.prototype.isConnected = function() {
    return this.connected;
  };

  /**
   * Provide a callback for an event.
   * @author Daniel Howard
   **/
  xibbit.prototype.on = function(type, fn) {
    var self = this;
    $(self).on(type, function(evt, event) {
      $.proxy(fn, self)(event);
    });
  };

  /**
   * Remove all callbacks for an event.
   * @author Daniel Howard
   **/
  xibbit.prototype.off = function(type) {
    var self = this;
    $(self).off(type);
  };

  /**
   * Send an event and, optionally, provide a callback to
   * process a response.
   * @author Daniel Howard
   **/
  xibbit.prototype.send = function(event, callback) {
    var self = this;
    if (!self.connected) {
      self.waitingEvents.push({
        'event': event,
        'callback': callback
      });
    } else if (callback && self.config.seq && !$.isEmptyObject(this.requestEvents)) {
      self.seqEvents.push({
        'event': event,
        'callback': callback
      });
    } else {
      event._id = this.eventId++;
      if (self.config.log || event._log) {
        console.log('%c'+JSON.stringify(event), 'color:lightgreen');
      }
      if (callback) {
        var evt = $.extend({}, event);
        evt._response = {
          callback: callback
        };
        this.requestEvents[event._id] = evt;
      }
      if (this.socket) {
        this.socket.emit('server', event);
      } else {
        poll(self, event);
      }
    }
  };

  /**
   * Only provided for consistency with server implementations.
   * @author Daniel Howard
   **/
  xibbit.prototype.receive = function() {
    return [];
  };

  /**
   * Start event polling if using polling and polling is stopped.
   * @author Daniel Howard
   **/
  xibbit.prototype.start = function(method) {
    var self = this;
    if ((method === 'socket.io') && !self.config.socketio.start) {
      var query = {};
      if ((self.config.socketio.transports === 'polling') && self.instance) {
        query.instance = self.instance;
      }
      var params = (self.config.socketio.transports === 'polling')? {
        path: self.config.poll.url,
        query: query,
        transports: ['polling']
      }: self.config.socketio.host+'/';
      // try to connect to Socket.IO
      setTimeout(function() {
        $.getScript(self.config.socketio.host+'/socket.io/socket.io.js', function() {
          self.socket = io(params);
          self.connected = true;
          var evt = {
            'type': 'connection',
            'on': 'socket.io'
          };
          self.config.socketio.start = true;
          self.socket.on('disconnect', function() {
            self.connected = false;
            self.socket = null;
            var evt = {
              'type': 'connection',
              'on': false
            };
            $(self).trigger(evt.type, evt);
          });
          self.socket.on('client', function(event) {
            event = $.extend(true, {}, event);
            self.dispatchEvent(event);
          });
          var instanceEvent = {
            type: '_instance'
          };
          if (self.instance !== null) {
            instanceEvent.instance = self.instance;
            if (self.config.socketio.transports === 'polling') {
              self.socket.io.engine.transport.query.instance = self.instance;
            }
          }
          // send _instance event
          self.send(instanceEvent, function(event) {
            // process _instance event
            self.instance = event.instance;
            if (self.config.socketio.transports === 'polling') {
              self.socket.io.engine.transport.query.instance = self.instance;
            }
            preserveSession(self);
            // send connected event
            $(self).trigger(evt.type, evt);
            // send any waiting events
            $.each(self.waitingEvents, function(index, event) {
              self.send(event.event, event.callback);
            });
            self.waitingEvents = [];
          });
        });
      }, 1);
    }
    if ((method === 'poll') && !self.config.poll.start) {
      setTimeout(function() {
        if (!self.config.poll.start && !self.socket) {
          self.config.poll.start = true;
          poll(self);
        }
      }, 0);
    }
  };

  /**
   * Stop event polling if using polling and polling is running.
   * @author Daniel Howard
   **/
  xibbit.prototype.stop = function(method) {
    var self = this;
    if ((method === 'poll') && self.config.poll.start) {
      self.config.poll.start = false;
    }
    if ((method === 'socket.io') && self.config.socketio.start) {
      //TODO disconnect from the socket
    }
  };

  /**
   * Dispatch events from the server to client listeners.
   * @author Daniel Howard
   **/
  xibbit.prototype.dispatchEvent = function(event) {
    var stacktrace = event && event.e_stacktrace;
    if (event && (event._id || event.type)) {
      if ((this.config.log) || event._log) {
        // notifications are in blue; response events are in green
        if (event.e) {
          if (stacktrace) {
            delete event.e_stacktrace;
            console.log('%c'+stacktrace, 'color:' + (event._id? 'deeppink': 'darkgoldenrod'));
          }
          console.log('%c'+JSON.stringify(event), 'color:' + (event._id? 'darkorange': 'darkgoldenrod'));
          if (stacktrace) {
            event.e_stacktrace = stacktrace;
          }
        } else {
          console.log('%c'+JSON.stringify(event), 'color:' + (event._id? 'green': 'blue'));
        }
      }
      if (event._id) {
        if (this.requestEvents[event._id]) {
          var callback = this.requestEvents[event._id]._response.callback;
          delete this.requestEvents[event._id];
          callback(event);
        }
        // send next seq event
        if (this.config.seq && (this.seqEvents.length > 0)) {
          var seqEvent = this.seqEvents.shift();
          this.send(seqEvent.event, seqEvent.callback);
        }
      } else if (event.type) {
        $(this).trigger(event.type, event);
      }
    } else {
      console.log('%cmalformed event -- '+JSON.stringify(event), 'color:red');
    }
  };
  return xibbit;
}();
