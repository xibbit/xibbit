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
   * Create an xibbit object.
   * @author Daniel Howard
   **/
  function xibbit(config) {
    /* jshint validthis: true */
    var self = this;
    var key = 'xibbit';
    var value = null;
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
        var ca = (document && document.cookie)? document.cookie.split(';'): [];
        for (var c=0; c < ca.length; ++c) {
          cookie = ca[c];
          while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1, cookie.length);
          }
          if (cookie.indexOf(key+'=') === 0) {
            value = cookie.substring((key+'=').length);
            value = decodeURIComponent(value);
            try {
              value = JSON.parse(value);
            } catch (e) {
              // use unparsed value
            }
          }
        }
      } else {
        try {
          value = sessionStorage.getItem(key);
          if (value) {
            try {
              value = JSON.parse(value);
            } catch (e) {
              value = null;
            }
          }
        } catch (e) {
          // only store session values in JavaScript
        }
      }
      if (value && value.instance) {
        self.instance = value.instance;
      }
    }
    self.log('xibbit.instance='+self.getInstanceValue());
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
   * Return the instance value or null.
   * @author Daniel Howard
   **/
  xibbit.prototype.getInstanceValue = function() {
    var self = this;
    return self.instance;
  };

  /**
   * Return true if the events are working.
   * @author Daniel Howard
   **/
  xibbit.prototype.isConnected = function() {
    return this.connected;
  };

  /**
   * Save a session instance.
   * @author Daniel Howard
   **/
  xibbit.prototype.preserveSession = function(instance) {
    var self = this;
    var key = 'xibbit';
    var value = {
      instance: instance
    };
    self.instance = instance;
    if ((typeof self.config.preserveSession === 'undefined') || (self.config.preserveSession !== false)) {
      if (typeof Storage === 'undefined') {
        try {
          document.cookie = key+"="+JSON.stringify(value)+"; path=/";
        } catch (e) {
          // suppress any cookie setting errors
        }
      } else {
        try {
          sessionStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
          // only store session values in JavaScript
        }
      }
    }
  };

  /**
   * Provide a handler for an event.
   * @author Daniel Howard
   **/
  xibbit.prototype.on = function(type, fn) {
    var self = this;
    $(self).on(type, function(evt, event) {
      $.proxy(fn, self)(event);
    });
  };

  /**
   * Remove all handlers for an event.
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
        self.log(JSON.stringify(event), self.logColors.request);
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
        self.shortPoll(event);
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
        query.instance = self.getInstanceValue();
      }
      var params = (self.config.socketio.transports === 'polling')? {
        path: self.config.poll.url,
        query: query,
        transports: ['polling'],
        outOfBand: function(data) {
          data = self.getStringFromDirtyHtml(data);
          self.log(data, self.logColors.outofband_error);
        }
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
          if (self.getInstanceValue() !== null) {
            instanceEvent.instance = self.getInstanceValue();
            if (self.config.socketio.transports === 'polling') {
              self.socket.io.engine.transport.query.instance = instanceEvent.instance;
            }
          }
          // send _instance event
          self.send(instanceEvent, function(event) {
            // process _instance event
            self.instance = event.instance;
            if (self.config.socketio.transports === 'polling') {
              self.socket.io.engine.transport.query.instance = self.instance;
            }
            self.preserveSession(event.instance);
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
          self.shortPoll();
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
    if (event && (event._id || event.type)) {
      var _id = event._id;
      this.log(event);
      if (event._id) {
        // send the response event to the callback
        if (this.requestEvents[event._id]) {
          var request = this.requestEvents[_id];
          var response = request._response;
          var callback = response.callback;
          delete this.requestEvents[_id];
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
      this.log('malformed event -- '+JSON.stringify(event), this.logColors.malformed);
    }
  };

  /**
   * Do a short poll.
   * @author Daniel Howard
   **/
  xibbit.prototype.shortPoll = function(events) {
    var self = this;
    var query = '';
    if (self.getInstanceValue() === null) {
      // send _instance event
      var instanceEvent = {
        type: '_instance'
      };
      query += '_event=' + encodeURIComponent(JSON.stringify(instanceEvent));
      self.log(JSON.stringify(instanceEvent), self.logColors.request);
    } else {
      query += 'instance='+self.getInstanceValue();
      query += '&_event=' + encodeURIComponent(events? JSON.stringify(events): '{}');
    }

    var url = $.isFunction(self.config.poll.url)? self.config.poll.url(): self.config.poll.url;
    var type = 'GET';
    var data = query;
    var jsonp = false;
    var success = false;
    self._pollStarted = $.now();
    var pollEvent = events && (events.type === '_poll');
    $.ajax({
      url: url,
      type: type,
      data: data,
      dataType: jsonp? 'jsonp': 'json',
      cache: false,
      timeout: self.config.poll.max,
      xhr: function() {
        var xhr = new window.XMLHttpRequest();
        return xhr;
      }
    }).done(function(event) {
      success = true;
      // pre-process _instance event
      if ($.isArray(event)) {
        $.each(event, function(key, event) {
          if ((event.type === '_instance') && event.instance) {
            self.preserveSession(event.instance);
          }
        });
      } else if($.isPlainObject(event)) {
        if ((event.type === '_instance') && event.instance) {
          self.preserveSession(event.instance);
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
            self.shortPoll({type: '_poll'});
          } else {
            self.shortPoll();
          }
        }, (delay < 0)? 0: delay);
      }
    }).fail(function(jqXHR) {
      var responseText = jqXHR.responseText;
      if (pollEvent) {
        self.log('{"type":"_poll","i":"'+jqXHR.status+':'+jqXHR.statusText+'"}', self.logColors.response);
        self.shortPoll({type: '_poll'});
      } else {
        // clean up error data and write to the console
        if (responseText) {
          responseText = self.getStringFromDirtyHtml(responseText);
          self.log(''+jqXHR.status+' '+jqXHR.statusText+' '+responseText, self.logColors.outofband_error);
        } else if (jqXHR.responseText === '') {
          self.log(''+jqXHR.status+' '+jqXHR.statusText+': server returned empty string', self.logColors.outofband_error);
        } else {
          self.log(''+jqXHR.status+' '+jqXHR.statusText+': unknown client or server error', self.logColors.outofband_error);
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
            self.shortPoll();
          }, self._reconnectIn);
        }
      }
    });
  };

  /**
   * Return a file upload structure.
   * @author Daniel Howard
   **/
  xibbit.prototype.createUploadFormData = function(event) {
    var fd = new FormData();
    fd.append('sid', this.socket.io.engine.id);
    fd.append('instance', this.instance);
    for (var k in event) {
      if ((k !== 'type') && event.hasOwnProperty(k)) {
        if (event[k] && event[k].constructor && event[k].constructor.name === 'File') {
          fd.append(event.type+'_'+k, event[k]);
        } else {
          fd.append(k, event[k]);
        }
      }
    }
    return fd;
  };

  /**
   * Return a string with HTML tags turned into string characters.
   * @author Daniel Howard
   **/
  xibbit.prototype.getStringFromDirtyHtml = function(data) {
    data = data.replace(/(<([^>]+)>)/ig, ''); // HTML tags
    data = data.replace(/\n+/g, ' '); // newline -> space
    data = data.replace(/\:\s+/g, ': '); // extra spaces
    data = data.replace(/\#/g, '\n#'); // PHP stack trace
    data = data.replace(/&quot;/g, '"'); // real quotes
    return data;
  };

  /**
   * Logging colors.
   * @author Daniel Howard
   */
  xibbit.prototype.logColors = {
    request: 'lightgreen',
    malformed: 'red',
    response: 'green',
    notification: 'blue',
    app_error: 'deeppink',
    response_error: 'deeppink',
    outofband_error: 'darkorange',
    notification_error: 'darkgoldenrod'
  };

  /**
   * Log string or event to the console.
   * @author Daniel Howard
   **/
  xibbit.prototype.log = function(obj, color) {
    var msg = typeof obj === 'string'? obj: null;
    var event = typeof obj === 'string'? null: obj;
    var stacktrace = event && event.e_stacktrace;
    // use color enum or standard color name
    color = this.logColors[color]? this.logColors[color]: color;
    if (this.config.log || (event && event._log)) {
      if (typeof obj === 'string') {
        // log colored text to the console
         console.log('%c'+msg, 'color:'+color);
      } else {
        if (event.e) {
          // response errors are pink; notification errors are brown
          color = event._id? this.logColors.response_error: this.logColors.notification_error;
          // log the stack trace separately
          if (stacktrace) {
            delete event.e_stacktrace;
            this.log(stacktrace, color);
          }
          // log the event without the stack trace
          msg = JSON.stringify(event);
          this.log(msg, color);
          // restore the stack trace
          if (stacktrace) {
            event.e_stacktrace = stacktrace;
          }
        } else {
          // response events are in green; notifications are in blue
          color = event._id? this.logColors.response: this.logColors.notification;
          msg = JSON.stringify(event);
          this.log(msg, color);
        }
      }
    }
  };
  return xibbit;
}();
