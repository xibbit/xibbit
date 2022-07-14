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
/* global _, xibbit, client_debug, client_transports, server_platform, server_base */
'use strict';

/**
 * @ngdoc service
 * @name myApp.service:XibbitService
 * @description
 * # XibbitService
 * Service to send and receive events from the
 * backend.
 * @author DanielWHoward
 */
angular.module('myApp')
  .service('XibbitService', [
    '$q', '$location', '$cookies', '$http',
  function($q, $location, $cookies, $http) {
    var self = this;
    // load the session
    self.session = {
      loggedIn: false,
      collectUserFields: [],
      me: {}
    };
    var preserveSession = !$location.path().startsWith('/front/');
    var loadSession = function() { return {}; };
    self.setSessionValue = function(key, value) {
      loadSession();
      self.session[key] = value;
    };
    if (preserveSession) {
      if (typeof Storage === 'undefined') {
        loadSession = function() {
          var session = null;
          try {
            session = $cookies.getObject('Session');
            if (session) {
              self.session = session;
            }
          } catch (e) {
            // use the default session values
          }
        };
        self.setSessionValue = function(key, value) {
          loadSession();
          self.session[key] = value;
          try {
            $cookies.putObject('Session', self.session, { path: '/' });
          } catch (e) {
            // only store session values in JavaScript
          }
        };
      } else {
        loadSession = function() {
          var session = null;
          try {
            session = sessionStorage.getItem('Session');
            if (session) {
              self.session = JSON.parse(session);
            }
          } catch (e) {
            // use the default session values
          }
        };
        self.setSessionValue = function(key, value) {
          loadSession();
          self.session[key] = value;
          try {
            sessionStorage.setItem('Session', JSON.stringify(self.session));
          } catch (e) {
            // only store session values in JavaScript
          }
        };
      }
    }
    loadSession();
    if (typeof self.session.collectUserFields === 'undefined') {
      self.setSessionValue('collectUserFields', []);
    }
    // create events bus
//    var h = window.location.protocol;
//    var d = window.location.hostname;
//    var p = window.location.port;
//    var u = h + '//' + d + (p? ':' + p: '');
    var events = new xibbit({
      preserveSession: preserveSession,
      seq: true,
      socketio: {
        start: true,
        transports: client_transports,
        min: (client_transports.indexOf('xio') !== -1)? 3000: null,
        url: server_platform === 'php'? function() {
          return server_base.php+'/app.php';
        } : server_base[server_platform],
        js_location: server_base[server_platform]
      },
      log: client_debug
    });
    /**
     * Return true if the user is signed in.
     * @author DanielWHoward
     */
    this.isLoggedIn = function() {
      return self.session.loggedIn;
    };
    /**
     * Return true if the user is signed in but the
     * user profile is incomplete.
     * @author DanielWHoward
     */
    this.isCollectingMoreInfo = function() {
      return self.session.collectUserFields.length > 0;
    };
    /**
     * Mark incomplete profile fields as completed.
     * @author DanielWHoward
     */
    this.collectedUserFields = function(fields) {
      if (self.session.collectUserFields.length > 0) {
        // convert to an array of collected values
        if (!fields || (fields === true)) {
          fields = self.session.collectUserFields;
        }
        // remove collected fields from the uncollected fields
        fields = _.difference(self.session.collectUserFields, fields);
        self.setSessionValue('collectUserFields', fields);
        if (self.session.collectUserFields.length === 0) {
          self.setSessionValue('loggedIn', true);
        }
      }
    };
    /**
     * Send an event to the backend.
     * @author DanielWHoward
     */
    this.send = function(event, callback) {
      var defer = $q.defer();
      var promise = defer.promise;
      var retVal = null;
      retVal = events.send(event, function(evt) {
        var loggingIn = false;
        var fields = [];
        if (!evt.e && evt.i) {
          if ((event.type.substring(0, 5) === 'login') || (event.type.substring(0, 6) === 'logout')) {
            if ((event.type !== 'login_email') && (event.type !== 'login_pwd')) {
              loggingIn = (event.type.substring(0, 5) === 'login');
              if (loggingIn && (evt.i.substring(0, 8) === 'collect:')) {
                fields = _.map(evt.i.substring(8).split(':'), function(field) {
                  var args = (evt.collect && evt.collect[field])? evt.collect[field]: {};
                  args.route = field;
                  return args;
                });
                self.setSessionValue('collectUserFields', fields);
              } else {
                self.setSessionValue('loggedIn', loggingIn);
                self.setSessionValue('collectUserFields', []);
              }
            }
          }
        }
        if (callback) {
          callback(evt);
        }
        defer.resolve(evt);
      });
      return promise;
    };
    /**
     * Upload a file to the backend.
     * @author DanielWHoward
     */
    this.upload = function(url, event, callback) {
      var defer0 = $q.defer();
      var promise0 = defer0.promise;
      var defer = $q.defer();
      var promise = defer.promise;
      defer0.resolve();
      promise0.then(function() {
        events.uploadEvent(url, event, function(evt) {
          if (callback) {
            callback(evt);
          }
          defer.resolve(evt);
        });
      });
      return promise;
    };
    /**
     * Create a new XibbitService service that encapsulates the
     * $scope and uses it sensibly.
     * @author DanielWHoward
     */
    this.scope = function(scope, collectUserFields) {
      var p = this;
      var obj = Object.create(p);
      obj.events = [];
      // override the send() method and automatically
      // do $scope.$apply() in the callback
      obj.send = function(event, callback) {
        return p.send(event, function(evt) {
          scope.$apply(function() {
            if (callback) {
              callback(evt);
            }
          });
        });
      };
      obj.upload = function(url, event, callback) {
        return p.upload(url, event, function(evt) {
          scope.$apply(function() {
            if (callback) {
              callback(evt);
            }
          });
        });
      };
      obj.on = function(name, callback) {
        obj.events.push(name);
        events.on(name, function(event) {
          scope.$apply(function() {
            if (callback) {
              callback(event);
            }
          });
        });
      };
      scope.$on('$destroy', function() {
        for (var e=0; e < obj.events.length; ++e) {
          events.off(obj.events[e]);
        }
      });
      // stop collecting data for most views
      if (!collectUserFields) {
        self.collectedUserFields();
      }
      return obj;
    };
  }]);
