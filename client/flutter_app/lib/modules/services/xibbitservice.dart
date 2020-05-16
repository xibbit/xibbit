///////////////////////////////////////////////////////
//                    xibbit 1.50                    //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//             Do not remove this notice             //
///////////////////////////////////////////////////////

/* global _, _events, client_debug, client_poll, client_socketio, client_transports, server_platform, server_base */
//'use strict';

import 'dart:math';
import '../../xibbit.dart';
import '../../url_config.dart';
import '../store.dart';
import '../../actions/event.dart';

class Session {
  Session();
  Map<String, Object> load() {
    return null;
  }

  void save(Map<String, Object> session) {}
}

Session mySession = Session();
final difference = (a, b) => a;
final resolve = (a) => a;

/**
 * @name XibbitService
 * @description
 * # XibbitService
 * Service to send and receive events from the
 * backend.
 */
class XibbitService {
  Xibbit xibbit;
  // load the session
  Map<String, Object> session = {
    'loggedIn': false,
    'collectUserFields': [],
    'me': {'advertiser': false}
  };

  Function setSessionValue = (key, value) {};

  XibbitService() {
    var self = this;
    var preserveSession = true;
    var loadSession = () {
      return {};
    };
    self.setSessionValue = (key, value) {
      loadSession();
      self.session[key] = value;
    };
    if (preserveSession) {
      loadSession = () {
        var session;
        try {
          session = mySession.load();
          if (session != null) {
            self.session = session;
          }
        } catch (e) {
          // use the default session values
        }
      };
      self.setSessionValue = (key, value) {
        loadSession();
        self.session[key] = value;
        try {
          mySession.save(self.session);
        } catch (e) {
          // only store session values in JavaScript
        }
      };
    }
    loadSession();
    if (!(self.session['collectUserFields'] is List)) {
      self.setSessionValue('collectUserFields', []);
    }
    // create events bus
    //    var h = window.location.protocol;
    //    var d = window.location.hostname;
    //    var p = window.location.port;
    //    var u = h + '//' + d + (p? ':' + p: '');
    self.xibbit = new Xibbit({
      'preserveSession': preserveSession,
      'seq': true,
      'socketio': {
        'start': true,
        'transports': client_transports,
        'min': (client_transports.indexOf('xio') != -1) ? 3000 : null,
        'url': server_platform == 'php'
            ? () {
                const String app_path_mod = '';
                //   Map hacks = self.session['hacks'];
                //   int mod_security_1 = hacks['mod_security_1'];
                //   app_path_mod = (mod_security_1 is int? Random(0).nextInt(mod_security_1): '');
                return server_base[server_platform] + '/app' + app_path_mod + '.php';
              }
            : server_base[server_platform]
      },
      'log': client_debug
    });
    self.xibbit.on('notify_instance', (event) {
      store.dispatch(notify(event));
    });
    self.xibbit.on('notify_login', (event) {
      store.dispatch(notify(event));
    });
    self.xibbit.on('notify_logout', (event) {
      store.dispatch(notify(event));
    });
    self.xibbit.on('notify_laughs', (event) {
      store.dispatch(notify(event));
    });
    self.xibbit.on('notify_jumps', (event) {
      store.dispatch(notify(event));
    });
  }
  /**
   * Return true if the user is signed in.
   */
  bool isLoggedIn() {
    var self = this;
    return self.session['loggedIn'];
  }

  /**
   * Return true if the user is signed in but the
   * user profile is incomplete.
   */
  bool isCollectingMoreInfo() {
    var self = this;
    List collectUserFields = self.session['collectUserFields'];
    return collectUserFields.length > 0;
  }

  ///
  /// Mark incomplete profile fields as completed.
  ///
  collectedUserFields([fields]) {
    var self = this;
    List collectUserFields = self.session['collectUserFields'];
    if (collectUserFields.length > 0) {
      // convert to an array of collected values
      if (!fields || (fields == true)) {
        fields = self.session['collectUserFields'];
      }
      // remove collected fields from the uncollected fields
      fields = difference(self.session['collectUserFields'], fields);
      self.setSessionValue('collectUserFields', fields);
      collectUserFields = self.session['collectUserFields'];
      if (collectUserFields.length == 0) {
        self.setSessionValue('loggedIn', true);
      }
    }
  }

  /**
   * Send an event to the backend.
   */
  send(Map<String, Object> event, Function callback) {
    var self = this;
    var retVal = self.xibbit.send(event, (Map<String, Object> evt) {
      var loggingIn = false;
      var fields = List<Map<String, Object>>();
      if ((evt['e'] == null) && (evt['i'] != null)) {
        var type = event['type'] as String;
        if ((type.length >= 5 && type.substring(0, 5) == 'login') ||
            (type.length >= 6 && type.substring(0, 6) == 'logout')) {
          if ((event['type'] != 'login_email') &&
              (event['type'] != 'login_pwd')) {
            loggingIn = ((event['type'] as String).substring(0, 5) == 'login');
            if (loggingIn &&
                ((evt['i'] as String).substring(0, 8) == 'collect:')) {
              fields = (evt['i'] as String)
                  .substring(8)
                  .split(':')
                  .map((String field) {
                Map<String, Object> args = ((evt['collect'] is Map) &&
                        ((evt['collect'] as Map)[field] != null))
                    ? (evt['collect'] as Map)[field]
                    : {};
                args['route'] = field;
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
      if (callback is Function) {
        callback(evt);
      }
      resolve(evt);
    });
    return retVal;
  }

  /**
   * Create a new XibbitService service that encapsulates the
   * $scope and uses it sensibly.
   */
  scope(scope, collectUserFields) {
    var self = this;
    var p = this;
    var obj = {}; //Object.create(p);
    obj['events'] = [];
    // override the send() method and automatically
    // do $scope.$apply() in the callback
    obj['send'] = (event, callback) {
      return p.send(event, (evt) {
        scope.$apply(() {
          if (callback) {
            callback(evt);
          }
        });
      });
    };
    obj['on'] = (name, callback) {
      obj['events'].push(name);
      self.xibbit.on(name, (event) {
        scope.$apply(() {
          if (callback) {
            callback(event);
          }
        });
      });
    };
    scope.$on('\$destroy', () {
      for (var e = 0; e < obj['events'].length; ++e) {
        xibbit.off(obj['events'][e]);
      }
    });
    // stop collecting data for most views
    if (!collectUserFields) {
      self.collectedUserFields();
    }
    return obj;
  }
}

XibbitService xibbitService = XibbitService();
