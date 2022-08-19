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
/* global $, io */
/* exported xibbit */
'use strict';

var _$ = $;/*(function() {
  var jqll = function(node) {
    return {
      on: function(typ, fn) {},
      off: function(typ) {},
      trigger: function() {}
    };
  };
  jqll.ajax = function() {};  
  jqll.each = function() {};  
  jqll.extend = function() {};  
  jqll.getScript = function() {};  
  jqll.isArray = function() {};  
  jqll.isEmptyObject = function() {};
  jqll.isFunction = function() {};  
  jqll.isPlainObject = function() {};  
  jqll.now = function() {};  
  jqll.proxy = function() {};
  return jqll;
})();*/

/**
 * Create a xibbit object.
 * @author DanielWHoward
 **/
var xibbit = (function() {
  var $ = _$;

  /**
   * Create an xibbit object.
   * @author DanielWHoward
   **/
  function xibbit(config) {
    /* jshint validthis: true */
    var self = this;
    self.sessionKey = 'xibbit';
    self.config = config;
    if (typeof self.config.log === 'undefined') {
      self.config.log = false;
    }
    // set defaults for socket.io
    if (typeof self.config.socketio === 'undefined') {
      self.config.socketio = {};
    }
    if (self.config.socketio.start !== false) {
      self.config.socketio.start = true;
    }
    //TODO support multiple transports
    if (Array.isArray(self.config.socketio.transports) && self.config.socketio.transports.length) {
      self.config.socketio.transports = self.config.socketio.transports[0];
    }
    // set defaults for poll
    if (typeof self.config.poll === 'undefined') {
      self.config.poll = {};
    }
    if (self.config.socketio.transports === 'xio') {
      self.config.poll.start = self.config.socketio.start;
      self.config.socketio.start = false;
      if (self.config.socketio.min) {
        self.config.poll.min = self.config.socketio.min;
        delete self.config.socketio.min;
      }
      if (self.config.socketio.url) {
        self.config.poll.url = self.config.socketio.url;
        delete self.config.socketio.url;
      }
    }
    if (typeof self.config.poll.url === 'undefined') {
      self.config.poll.url = '/events';
    }
    if (typeof self.config.poll.min !== 'number') {
      self.config.poll.min = 1000;
    }
    if (typeof self.config.poll.max !== 'number') {
      self.config.poll.max = 299000;
    }
    if (self.config.poll.start !== true) {
      self.config.poll.start = false;
    }
    self.connected = false;
    self.eventId = 1;
    self.instance = null;
    // do not allow parallel callback events; wait until previous event completes
    if ((typeof self.config.seq === 'undefined') || (self.config.seq !== true)) {
      self.config.seq = false;
    }
    if ((typeof self.config.preserveSession === 'undefined') || (self.config.preserveSession !== false)) {
      self.instance = self.getSessionValue('instance') || null;
    }
    self.log('xibbit.instance='+self.getInstanceValue());
    self.requestEvents = {};
    self.waitingEvents = [];
    self.seqEvents = [];
    self.recentEvents = {};
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
   * @author DanielWHoward
   **/
  xibbit.prototype.getInstanceValue = function() {
    var self = this;
    return self.instance;
  };

  /**
   * Return true if the events are working.
   * @author DanielWHoward
   **/
  xibbit.prototype.isConnected = function() {
    return this.connected;
  };

  /**
   * Get a value for a key from the xibbit session.
   *
   * Even though sessions are not our mission, this
   * simple session storage API is provided for users.
   * @author DanielWHoward
   **/
  xibbit.prototype.getSessionValue = function(key) {
    var self = this;
    var value, cookie;
    if (typeof Storage === 'undefined') {
      var ca = (document && document.cookie)? document.cookie.split(';'): [];
      for (var c=0; c < ca.length; ++c) {
        cookie = ca[c];
        while (cookie.charAt(0) === ' ') {
          cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf(self.sessionKey+'=') === 0) {
          value = cookie.substring((self.sessionKey+'=').length);
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
        value = sessionStorage.getItem(self.sessionKey);
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
    return (value && key)? value[key] : value;
  };

  /**
   * Add or replace a value for a key from the xibbit
   * session.
   *
   * Even though sessions are not our mission, this
   * simple session storage API is provided for users.
   * @author DanielWHoward
   **/
  xibbit.prototype.addSessionValue = function(key, value) {
    var self = this;
    var sessionValue = self.getSessionValue() || {};
    // if value is undefined, delete the key instead of adding it
    if (typeof value === 'undefined') {
      delete sessionValue[key];
    } else {
      sessionValue[key] = value;
    }
    if (typeof Storage === 'undefined') {
      try {
        document.cookie = self.sessionKey+"="+JSON.stringify(sessionValue)+"; path=/";
      } catch (e) {
        // suppress any cookie setting errors
      }
    } else {
      try {
        sessionStorage.setItem(self.sessionKey, JSON.stringify(sessionValue));
      } catch (e) {
        // only store session values in JavaScript
      }
    }
    return value;
  };

  /**
   * Delete a key from the xibbit session.
   *
   * Even though sessions are not our mission, this
   * simple session storage API is provided for users.
   * @author DanielWHoward
   **/
  xibbit.prototype.removeSessionValue = function(key) {
    var self = this;
    self.addSessionValue(key);
  };

  /**
   * Save a session instance.
   * @author DanielWHoward
   **/
  xibbit.prototype.preserveSession = function(instance) {
    var self = this;
    self.addSessionValue('instance', instance);
    self.instance = instance;
  };

  /**
   * Provide a handler for an event.
   * @author DanielWHoward
   **/
  xibbit.prototype.on = function(type, fn) {
    var self = this;
    $(self).on(type, function(evt, event) {
      $.proxy(fn, self)(event);
    });
  };

  /**
   * Remove all handlers for an event.
   * @author DanielWHoward
   **/
  xibbit.prototype.off = function(type) {
    var self = this;
    $(self).off(type);
  };

  /**
   * Send an event and, optionally, provide a callback to
   * process a response.
   * @author DanielWHoward
   **/
  xibbit.prototype.send = function(event, callback) {
    var self = this;
    if (!self.connected) {
      self.waitingEvents.push({
        'event': event,
        'callback': callback
      });
    } else if (callback && self.config.seq && !$.isEmptyObject(self.requestEvents)) {
      self.seqEvents.push({
        'event': event,
        'callback': callback
      });
    } else {
      event._id = self.eventId++;
      if (self.config.log || event._log) {
        var msg = this.reorderJson(JSON.stringify(event),
          ['type', 'to', 'from', '_id'],
          ['i', 'e']
        );
        self.log(msg, self.logColors.request);
      }
      if (callback) {
        var evt = $.extend({}, event);
        evt._response = {
          callback: callback
        };
        self.requestEvents[event._id] = evt;
      }
      if (self.socket) {
        var marshalledEvent = event; //JSON.stringify(event); //golang
        self.socket.emit('server', marshalledEvent);
      } else {
        self.xioPoll(event);
      }
    }
  };

  /**
   * Only provided for consistency with server implementations.
   * @author DanielWHoward
   **/
  xibbit.prototype.receive = function() {
    return [];
  };

  /**
   * Start event polling if using polling and polling is stopped.
   * @author DanielWHoward
   **/
  xibbit.prototype.start = function(method) {
    var self = this;
    if ((method === 'socket.io') && !self.config.socketio.start) {
      var query = {};
      if ((self.config.socketio.transports === 'polling') && self.instance) {
        query.instance = self.getInstanceValue();
      }
      var url = self.config.socketio.url;
      var sampleUrl = url;
      if (typeof url === 'function') {
        sampleUrl = url();
      }
      var isPhp = sampleUrl.endsWith('.php');
      var host = '';
      if (sampleUrl.startsWith('http')) {
        var pos = sampleUrl.indexOf('/');
        for (var s=0; (pos !== -1) && (s < 2); ++s) {
          pos = sampleUrl.indexOf('/', pos+1);
        }
        if (pos === -1) {
          pos = sampleUrl.length;
        }
        host = sampleUrl.substring(0, pos);
      } else {
        var h = window.location.protocol;
        var d = window.location.hostname;
        var p = window.location.port;
        host = h + '//' + d + (p? ':' + p: '');
      }
      var transport = self.config.socketio.transports;
      var transports = [transport];
      if (isPhp) {
        transports = ['polling'];
      }
      var params = isPhp? {
        path: url,
        query: query,
        nsp: '/',
        transports: transports,
        upgrade: false,
        compress: false,
        outOfBand: function(data) {
          data = self.getStringFromDirtyHtml(data);
          self.log(data, self.logColors.outofband_error);
        }
      }: {
        url: host+'/',
//        path: '/ws',
        transports: transports
      };
      // try to connect to Socket.IO
      setTimeout(function() {
        var js_location = self.config.socketio.js_location;
        if (!js_location) {
          js_location = host;
        }
        $.getScript(js_location+'/socket.io/socket.io.js', function() {
          var url = params.url;
          if (url) {
            delete params.url;
          }
          if (Object.keys(params).length === 0) {
            params = url;
            url = '';
          }
          self.socket = url ? io(url, params): io(params);
          self.connected = true;
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
            // deep clone
            event = $.extend(true, {}, event);
            self.dispatchEvent(event);
          });
          self.initInstance(method);
        });
      }, 1);
    }
    if ((method === 'poll') && !self.config.poll.start) {
      setTimeout(function() {
        if (!self.config.poll.start && !self.socket) {
          self.connected = true;
          self.config.poll.start = true;
          self.initInstance(method);
        }
      }, 0);
    }
  };

  /**
   * Stop event polling if using polling and polling is running.
   * @author DanielWHoward
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
   * Send the _instance event.
   * @author DanielWHoward
   **/
  xibbit.prototype.initInstance = function(method) {
    var self = this;
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
      // send any waiting events
      $.each(self.waitingEvents, function(index, event) {
        self.send(event.event, event.callback);
      });
      self.waitingEvents = [];
      if (method === 'poll') {
        self.xioPoll();
      }
    });
  };

  /**
   * Dispatch events from the server to client listeners.
   * @author DanielWHoward
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
        // debounce
        var debounceMs = 2 * 1000;
        var now = new Date();
        var eventStr = JSON.stringify(event);
        var keys = Object.keys(this.recentEvents);
        for (var k=0; k < keys.length; ++k) {
          if ((this.recentEvents[keys[k]].getTime() + debounceMs) < now.getTime()) {
            delete this.recentEvents[keys[k]];
          }
        }
        // only trigger event if it hasn't been sent recently
        if (!this.recentEvents[eventStr]) {
          $(this).trigger(event.type, event);
          this.recentEvents[eventStr] = now;
        }
      }
    } else {
      this.log('malformed event -- '+JSON.stringify(event), this.logColors.malformed);
    }
  };

  /**
   * Do a short poll using the xio protocol.
   * @author DanielWHoward
   **/
  xibbit.prototype.xioPoll = function(events) {
    var self = this;
    var query = '';
    var instanceValue = self.getInstanceValue();
    if (instanceValue !== null) {
      query += 'instance=' + instanceValue + '&';
    }
    var strEvents = events? JSON.stringify(events): '{}';
    var uriEncodedEvents = encodeURIComponent(strEvents);
    query += '&XIO=' + uriEncodedEvents;

    var url = $.isFunction(self.config.poll.url)? self.config.poll.url(): self.config.poll.url;
    var type = 'POST';
    var data = query;
    var jsonp = false;
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
        setTimeout(function() {
          self.xioPoll();
        }, (delay < 0)? 0: delay);
      }
    }).fail(function(jqXHR) {
      var responseText = jqXHR.responseText;
      if (pollEvent) {
        self.log('{"type":"_poll","i":"'+jqXHR.status+':'+jqXHR.statusText+'"}', self.logColors.response);
        self.xioPoll({type: '_poll'});
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
            self.xioPoll();
          }, self._reconnectIn);
        }
      }
    });
  };

  /**
   * Return a file upload structure.
   * @author DanielWHoward
   **/
  xibbit.prototype.createUploadFormData = function(event) {
    var fd = new FormData();
    fd.append('sid', this.socket.io.engine.id);
    fd.append('instance', this.instance);
    for (var k in event) {
      if ((k !== 'type') && Object.prototype.hasOwnProperty.call(event, k)) {
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
   * @author DanielWHoward
   **/
  xibbit.prototype.getStringFromDirtyHtml = function(data) {
    data = data.replace(/(<([^>]+)>)/ig, ''); // HTML tags
    data = data.replace(/\n+/g, ' '); // newline -> space
    data = data.replace(/:\s+/g, ': '); // extra spaces
    data = data.replace(/#/g, '\n#'); // PHP stack trace
    data = data.replace(/&quot;/g, '"'); // real quotes
    data = data.replace(/&gt;/g, '>'); // greater than
    return data;
  };

  /**
   * Reorder keys in a JSON string.
   * @author DanielWHoward
   */
  xibbit.prototype.reorderJson = function(s, first, last) {
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
        k = last[i - first.length - 1];
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
   * Logging colors.
   * @author DanielWHoward
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
   * @author DanielWHoward
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
          // restore the stack trace
          if (stacktrace) {
            event.e_stacktrace = stacktrace;
          }
        } else {
          // response events are in green; notifications are in blue
          color = event._id? this.logColors.response: this.logColors.notification;
          msg = JSON.stringify(event);
        }
        msg = this.reorderJson(msg,
          ['type', 'to', 'from', '_id'],
          ['i', 'e']
        );
        this.log(msg, color);
      }
    }
  };
  return xibbit;
})();
