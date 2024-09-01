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
import 'dart:async';
import 'dart:io';
import 'dart:math';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:async/async.dart';
import 'package:path/path.dart';
import 'package:cross_file/cross_file.dart';
import 'package:logging/logging.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:socket_io_client_flutter/http/req.dart';
import 'package:socket_io_client_flutter/socket_io_client_flutter.dart' as io;

final Logger _logger = Logger('xibbit');

///
/// A simple, more traditional promise object imitating
/// the jQuery promise API.
/// @author DanielWHoward
///
class AjaxStylePromise {
  static Map<String, String> persistentHeaders = {};
  Map<String, Object> opts = {};
  List<Function> successes = [];
  List<Function> failures = [];
  AjaxStylePromise(this.opts);
  AjaxStylePromise done(Function handler) {
    successes.add(handler);
    return this;
  }

  AjaxStylePromise fail(Function handler) {
    failures.add(handler);
    return this;
  }

  Future<http.Response> go() async {
    String method = opts['type'] as String;
    Map<String, String> headers = {
      'Content-Type': 'application/json',
      ...persistentHeaders
    };
    String data = opts['data'] as String;
    String url = opts['url'] as String;
    late Future future;
    if (method == 'GET') {
      url += '?$data';
      _logger.fine('AjaxStylePromise $method $url');
      future = http.get(Uri.parse(url), headers: headers);
    } else if (method == 'POST') {
      _logger.fine('AjaxStylePromise $method $url $data');
      future = http.post(Uri.parse(url), headers: headers, body: data);
    }
    future.then((response) {
      int status = response.statusCode;
      String responseText = response.body;
      _logger
          .fine('AjaxStylePromise $method $status $url $responseText');
      if (response.headers['set-cookie'] != null) {
        persistentHeaders['cookie'] = response.headers['set-cookie'];
      }
      for (var handler in successes) {
        if (response.statusCode == 200) {
          try {
            handler(json.decode(response.body));
          } catch (e) {
            handler(response.body);
          }
        }
      }
    }).catchError((e) {
      for (var handler in failures) {
        handler(e);
      }
    });
    return await future;
  }
}

///
/// A simple, more traditional REST call imitating the
/// jQuery ajax() API.
/// @author DanielWHoward
///
AjaxStylePromise ajax(Map<String, Object> opts) {
  return AjaxStylePromise(opts);
}

///
/// Create a Xibbit object.
/// @author DanielWHoward
///
class Xibbit {
  var config;
  bool instanceSent = false;
  late Future<SharedPreferences> instance;
  var seqEvents = [];
  var requestEvents = <int, Object>{};
  var waitingEvents = [];
  var recentEvents = <String, DateTime>{};
  var connected = false;
  var socket;
  int eventId = 1;
  int _reconnectIn = 0;
  int _lastReconnect = 0;
  int _pollStarted = 0;
  Map actions = {};
  String sessionKey = 'xibbit';

  ///
  /// Create an Xibbit object.
  /// @author DanielWHoward
  ///
  Xibbit(Map config) {
    /* jshint validthis: true */
    var self = this;
    self.config = config;
    if (self.config['log'] is! bool) {
      self.config['log'] = false;
    }
    // set defaults for socket.io
    if (self.config['socketio'] is! Map) {
      self.config['socketio'] = {};
    }
    if (self.config['socketio']['start'] != false) {
      self.config['socketio']['start'] = true;
    }
    //TODO support multiple transports
    if ((self.config['socketio']['transports'] is List<String>) &&
        (self.config['socketio']['transports'].length > 0)) {
      self.config['socketio']['transports'] =
          self.config['socketio']['transports'][0];
    }
    // set defaults for poll
    if (self.config['poll'] is! Map<String, Object>) {
      self.config['poll'] = {};
    }
    if (self.config['socketio']['transports'] == 'xio') {
      self.config['poll']['start'] = self.config['socketio']['start'];
      self.config['socketio']['start'] = false;
      if (self.config['socketio'].containsKey('min')) {
        self.config['poll']['min'] = self.config['socketio']['min'];
        self.config['socketio'].remove('min');
      }
      if (self.config['socketio'].containsKey('url')) {
        self.config['poll']['url'] = self.config['socketio']['url'];
        self.config['socketio'].remove('url');
      }
    }
    if (self.config['poll']['url'] is! String &&
        self.config['poll']['url'] is! Function) {
      self.config['poll']['url'] = '/events';
    }
    if (self.config['poll']['min'] is! int) {
      self.config['poll']['min'] = 1000;
    }
    if (self.config['poll']['max'] is! int) {
      self.config['poll']['max'] = 299000;
    }
    if (self.config['poll']['start'] != true) {
      self.config['poll']['start'] = false;
    }
    self.connected = false;
    self.eventId = 1;
    // do not allow parallel callback events; wait until previous event completes
    if ((!self.config['seq'] is bool) || (self.config['seq'] != true)) {
      self.config['seq'] = false;
    }
    WidgetsFlutterBinding.ensureInitialized();
    self.instance = SharedPreferences.getInstance();
    self.getInstanceValue().then((String? instance) {
      self.log('xibbit.instance=${instance ?? 'null'}');
    });
    self.requestEvents = {};
    self.waitingEvents = [];
    self.seqEvents = [];
    self.recentEvents = {};
    self.socket = null;
    // try to connect to Socket.IO
    if (self.config['socketio']['start']) {
      self.config['socketio']['start'] = false;
      self.start('socket.io');
    }
    // use poll if sockets not available
    if (self.config['poll']['start']) {
      self.config['poll']['start'] = false;
      self.start('poll');
    }
  }

  ///
  /// Return the instance value or null.
  /// @author DanielWHoward
  ///
  Future<String?> getInstanceValue() async {
    var self = this;
    SharedPreferences prefs = await self.instance;
    String? instance;
    try {
      instance = prefs.getString(self.sessionKey);
      if (instance != null) {
        instance = jsonDecode(instance)['instance'];
      }
    } catch (e) {}
    return instance;
  }

  ///
  /// Return true if the events are working.
  /// @author DanielWHoward
  ///
  bool isConnected() {
    var self = this;
    return self.connected;
  }

  var fns = {};

  ///
  /// Invoke a handler for an event.
  /// @author DanielWHoward
  ///
  void trigger(type, event) {
    var self = this;
    Function? fn = self.fns[type];
    if (fn != null) {
      fn(event);
    }
  }

  ///
  /// Get a value for a key from the xibbit session.
  ///
  /// Even though sessions are not our mission, this
  /// simple session storage API is provided for users.
  /// @author DanielWHoward
  ///
  dynamic getSessionValue([String? key]) async {
    var self = this;
    SharedPreferences prefs = await self.instance;
    final Map value = jsonDecode(prefs.getString(self.sessionKey) ?? '{}');
    return ((value is Map<String, Object>) && key is String)
        ? value[key]
        : value;
  }

  ///
  /// Add or replace a value for a key from the xibbit
  /// session.
  ///
  /// Even though sessions are not our mission, this
  /// simple session storage API is provided for users.
  /// @author DanielWHoward
  ///
  dynamic addSessionValue(String key, [dynamic value]) async {
    var self = this;
    var sessionValue = await self.getSessionValue() ?? {};
    // if value is undefined, delete the key instead of adding it
    if (value == null) {
      sessionValue.remove(key);
    } else {
      sessionValue[key] = value;
    }
    final prefs = await self.instance;
    prefs.setString(self.sessionKey, jsonEncode(sessionValue));
    return value;
  }

  ///
  /// Delete a key from the xibbit session.
  ///
  /// Even though sessions are not our mission, this
  /// simple session storage API is provided for users.
  /// @author DanielWHoward
  ///
  removeSessionValue(String key) async {
    var self = this;
    self.addSessionValue(key);
  }

  ///
  /// Save a session instance.
  /// @author DanielWHoward
  ///
  preserveSession(String instance) async {
    var self = this;
    self.addSessionValue('instance', instance);
  }

  ///
  /// Provide a handler for an event.
  /// @author DanielWHoward
  ///
  void on(String type, Function fn) {
    var self = this;
    self.fns[type] = fn;
  }

  ///
  /// Remove all handlers for an event.
  /// @author DanielWHoward
  ///
  void off(String type) {
    var self = this;
    self.fns.remove(type);
  }

  ///
  /// Send an event and, optionally, provide a callback to
  /// process a response.
  /// @author DanielWHoward
  ///
  void send(Map event, Function callback) {
    var self = this;
    if (!self.connected) {
      self.waitingEvents.add({'event': event, 'callback': callback});
    } else if ((callback != null) &&
        self.config['seq'] &&
        requestEvents.isNotEmpty) {
      self.seqEvents.add({'event': event, 'callback': callback});
    } else {
      event['_id'] = self.eventId++;
      if (self.config['log'] || event.containsKey('_log')) {
        var msg = reorderJson(
            jsonEncode(event), ['type', 'to', 'from', '_id'], ['i', 'e']);
        self.log(msg, self.logColors['request']);
      }
      // shallow clone
      final evt = Map<String, Object>.from(event);
      evt['_response'] = {'callback': callback};
      requestEvents[event['_id'] as int] = evt;
          if (socket != null) {
        var marshalledEvent = event; //JSON.stringify(event); //golang
        socket.emit('server', marshalledEvent);
      } else {
        self.xioPoll(event);
      }
    }
  }

  ///
  /// Only provided for consistency with server implementations.
  /// @author DanielWHoward
  ///
  receive() {
    return [];
  }

  ///
  /// Start event polling if using polling and polling is stopped.
  /// @author DanielWHoward
  ///
  void start(method) async {
    var self = this;
    if ((method == 'socket.io') && !self.config['socketio']['start']) {
      var query = {};
      if ((self.config['socketio']['transports'] == 'polling')) {
        String? instanceValue = await self.getInstanceValue();
        if (instanceValue != null) {
          query['instance'] = instanceValue;
        }
      }
      var url = self.config['socketio']['url'];
      var sampleUrl = url;
      if (url is Function) {
        sampleUrl = url();
      }
      var isPhp = sampleUrl.endsWith('.php');
      String host = '';
      if (sampleUrl.startsWith('http')) {
        var pos = sampleUrl.indexOf('/');
        for (var s = 0; (pos != -1) && (s < 2); ++s) {
          pos = sampleUrl.indexOf('/', pos + 1);
        }
        if (pos == -1) {
          pos = sampleUrl.length;
        }
        host = sampleUrl.substring(0, pos);
      }
      String transport = self.config['socketio']['transports'];
      List<String> transports = [transport];
      if (isPhp) {
        transports = ['polling'];
      }
      dynamic params = isPhp
          ? {
              'path': url,
              'query': query,
              'nsp': '/',
              'transports': transports,
              'upgrade': false,
              'compress': false,
              'outOfBand': (data) {
                data = self.getStringFromDirtyHtml(data);
                self.log(data, self.logColors['outofband_error']);
              }
            }
          : {
              'url': '$host/',
//              'path': '/ws',
              'transports': transports
            };
      // try to connect to Socket.IO
      url = params.containsKey('url') ? params['url'] : '';
      if ((url is String) && url != '') {
        params.remove('url');
      }
      if (params.isEmpty) {
        params = url;
        url = '';
      }
      var vio = io.getEioProtocolVersion(self.config['socketio']['eio_protocol'])['io'];
      self.socket = (url != '') ? vio(url, params) : vio(params);
      self.connected = true;
      self.config['socketio']['start'] = true;
      self.socket.on('disconnect', (unusedEvent) {
        self.connected = false;
        self.socket = null;
        var evt = {'type': 'connection', 'on': false};
        self.trigger(evt['type'], evt);
      });
      self.socket.on('client', (event) {
        // deep clone
        var encodedEvent = json.encode(event);
        var clonedEvent = json.decode(encodedEvent);
        self.dispatchEvent(clonedEvent);
      });
      self.initInstance(method);
    }
    if ((method == 'poll') && !self.config['poll']['start']) {
      Future.delayed(const Duration(milliseconds: 0), () {
        if (!self.config['poll']['start'] && (self.socket == null)) {
          self.connected = true;
          self.config['poll']['start'] = true;
          self.initInstance(method);
        }
      });
    }
  }

  ///
  /// Stop event polling if using polling and polling is running.
  /// @author DanielWHoward
  ///
  void stop(method) {
    var self = this;
    if ((method == 'poll') && self.config['poll']['start']) {
      self.config['poll']['start'] = false;
    }
    if ((method == 'socket.io') && self.config['socketio']['start']) {
      //TODO disconnect from the socket
    }
  }

  ///
  /// Send the _instance event.
  /// @author DanielWHoward
  ///
  initInstance(String method) async {
    var self = this;
    Map<String, Object> instanceEvent = {'type': '_instance'};
    String? instanceValue = await self.getInstanceValue();
    //HACK mobile apps do not need to use instanceValue but it
    // should harmless; fix servers the crash, though
    instanceValue = null;
    if (instanceValue != null) {
      instanceEvent['instance'] = instanceValue;
      if (self.config['socketio']['transports'] == 'polling') {
        self.socket.io.engine.transport.query['instance'] =
            instanceEvent['instance'];
      }
    }
    // send _instance event
    self.send(instanceEvent, (Map event) {
      // process _instance event
      if (self.config['socketio']['transports'] == 'polling') {
        self.socket.io.engine.transport.query['instance'] = event['instance'];
      }
      self.preserveSession(event['instance'] as String);
      // send any waiting events
      for (final event in self.waitingEvents) {
        self.send(event['event'], event['callback']);
      }
      self.waitingEvents = [];
      if (method == 'poll') {
        self.xioPoll();
      }
    });
  }

  ///
  /// Dispatch events from the server to client listeners.
  /// @author DanielWHoward
  ///
  dispatchEvent(Map event) {
    if ((event != null) && (event['_id'] != null)) {
      final id = event['_id'];
      // show the response on the console
      log(event);
      // send the response event to the callback
      if (requestEvents[id] != null) {
        Map<String, Object> request =
            requestEvents[id] as Map<String, Object>;
        Map<String, Object> response =
            request['_response'] as Map<String, Object>;
        Function callback = response['callback'] as Function;
        requestEvents.remove(id);
        callback(event);
      }
      // send next seq event
      if (config['seq'] && (seqEvents.isNotEmpty)) {
        var seqEvent = seqEvents[0];
        seqEvents.removeAt(0);
        send(seqEvent.event, seqEvent.callback);
      }
    } else if (event['type'] != null) {
      // debounce
      var debounceMs = 2 * 1000;
      var now = DateTime.now();
      var eventStr = jsonEncode(event);
      var keys = List<String>.from(recentEvents.keys);
      for (var key in keys) {
        if ((recentEvents[key]!.millisecondsSinceEpoch + debounceMs) <
            now.millisecondsSinceEpoch) {
          recentEvents.remove(key);
        }
      }
      // only trigger event if it hasn't been sent recently
      if (!recentEvents.containsKey(eventStr)) {
        // show the response on the console
        log(
            jsonEncode(event),
            logColors[
                event['__id'] != null ? 'notification' : 'response']);
        trigger(event['type'], event);
        recentEvents[eventStr] = now;
      }
    } else {
      log('malformed event -- ${jsonEncode(event)}',
          logColors['malformed']);
    }
  }

  ///
  /// Do a short poll.
  /// @author DanielWHoward
  ///
  xioPoll([Map? events]) async {
    var self = this;
    String query = '';
    String? instanceValue = await self.getInstanceValue();
    if (instanceValue != null) {
      query += 'instance=$instanceValue&';
    }
    String strEvents = events is Map ? jsonEncode(events) : '{}';
    String uriEncodedEvents = Uri.encodeComponent(strEvents);
    query += '&XIO=$uriEncodedEvents';

    var url = self.config['poll']['url'] is Function
        ? self.config['poll']['url']()
        : self.config['poll']['url'];
    String type = 'GET';
    String data = query;
    self._pollStarted = DateTime.now().millisecondsSinceEpoch;
    var pollEvent = (events != null) && (events['type'] == '_poll');
    ajax({
      'url': url,
      'type': type,
      'data': data,
      'dataType': 'json',
      'cache': false,
      'timeout': self.config['poll']['max'],
    }).done((event) {
      // pre-process _instance event
      if (event is List) {
        event.forEach((event) async {
          if ((event['type'] == '_instance') && (event['instance'] != null)) {
            self.preserveSession(event['instance']);
          }
        });
      } else if (event is Map<String, Object>) {
        if ((event['type'] == '_instance') && (event['instance'] != null)) {
          self.preserveSession(event['instance'] as String);
        }
      } else {
        self.log(event, self.logColors['response_error']);
      }
      // send connected event, if needed
      if (!self.connected) {
        self.connected = true;
        var evt = {'type': 'connection', 'on': 'poll'};
        self.trigger(evt['type'], evt);
        // send any waiting events
        for (var event in self.waitingEvents) {
          self.send(event['event'], event['callback']);
        }
        self.waitingEvents = [];
      }
      // send events to listeners
      if (event is List) {
        for (var event in event) {
          self.dispatchEvent(event);
        }
      } else if (event is Map<String, Object>) {
        self.dispatchEvent(event);
      }
      // restart the poll
      if (self.config['poll']['start'] != null &&
          self.socket == null &&
          events == null) {
        int delay = self._pollStarted +
            (self.config['poll']['min'] as int) -
            DateTime.now().millisecondsSinceEpoch;
        delay = (self.config['poll']['strategy'] == 'long') ? 0 : delay;
        Future.delayed(Duration(milliseconds: (delay < 0) ? 0 : delay), () {
          if (self.config['poll']['strategy'] == 'long') {
            self.xioPoll({'type': '_poll'});
          } else {
            self.xioPoll();
          }
        });
      }
    }).fail((jqXHR) {
      var responseText = String.fromCharCodes(jqXHR.bodyBytes);
      if (pollEvent) {
        self.log(
            '${'${'{"type":"_poll","i":"' +
                jqXHR.status}:' +
                jqXHR.statusText}"}',
            self.logColors['response']);
        self.xioPoll({'type': '_poll'});
      } else {
        // clean up error data and write to the console
        responseText = self.getStringFromDirtyHtml(responseText);
        self.log(
            '${'${jqXHR.statusCode} ' +
                jqXHR.reasonPhrase} $responseText',
            self.logColors['outofband_error']);
              // send disconnected event, if needed
        if (self.connected && (self.socket == null)) {
          self.connected = false;
          var evt = {'type': 'connection', 'on': false};
          self.trigger(evt['type'], evt);
        }
        // try reconnecting in n*2 seconds (max 16)
        self._reconnectIn = (self._lastReconnect <
                DateTime.now().millisecondsSinceEpoch - 60000)
            ? 1000
            : min(self._reconnectIn * 2, 16000);
        self._lastReconnect = DateTime.now().millisecondsSinceEpoch;
        // restart the poll
        if (self.config['poll']['start'] && (self.socket == null)) {
          Future.delayed(Duration(milliseconds: self._reconnectIn), () {
            self.xioPoll();
          });
        }
      }
    }).go();
  }

  ///
  /// Return a file upload structure.
  /// @author DanielWHoward
  ///
  Future<http.MultipartRequest> createUploadFormData(
      String method, String url, Map event) async {
    var uri = Uri.parse(url);
    var fd = http.MultipartRequest(method, uri);

    fd.fields['sid'] = socket.io.engine.id;
    fd.fields['instance'] = (await getInstanceValue())!;
    for (String k in event.keys) {
      if (k != 'type') {
        if (event[k] is XFile) {
          var stream =
              http.ByteStream(DelegatingStream.typed(event[k].openRead()));
          var length = File(event[k].path).lengthSync();
          var multipartFileSign = http.MultipartFile(
              event['type'] + '_' + k, stream, length,
              filename: basename(event[k].path));
          fd.files.add(multipartFileSign);
        } else {
          fd.fields[k] = event[k];
        }
      }
    }
    return fd;
  }

  ///
  /// Return the contents of a web page.
  /// @author DanielWHoward
  ///
  Future getUploadForm(String url, Function callback) async {
    var self = this;
    // get the submit form
    try {
      final uri = Uri.parse(url);
      final response = await http.get(uri);
      if (response.statusCode != 200) {
        throw HttpException('${response.statusCode}');
      }
      callback(response.body);
    } on Exception catch (e) {
      var color = self.logColors['app_error'];
      var responseData = e.toString();
      //HACK add a response ID so the event will have the right color
      Map event = {};
      event['_id'] = self.eventId++;
      self.log('getUploadForm() HTTP error:', color);
      callback(responseData);
    }
  }

  ///
  /// Upload a file to the backend.
  ///
  void uploadEvent(String url, Map event, Function callback) async {
    Map copyOddClasses(Map o) {
      var odd = {};
      for (var k in o.keys) {
        if (event[k] is XFile) {
          XFile file = event[k];
          odd[k] = {'type': 'File', 'absolute': file.path};
        } else {
          odd[k] = o[k];
        }
      }
      return odd;
    }

    var fd = createUploadFormData('POST', url, event);
    // log the upload event to the console
    log(jsonEncode(copyOddClasses(event)), logColors['request']);

    var request = await fd;
    request.headers.addAll({"Accept": "application/json"});

    request.headers.addAll(FlutterHttpRequest.headers);

    var response = await request.send();

    response.stream
        .transform(utf8.decoder)
        .transform(json.decoder)
        .listen((data) {
      if (response.statusCode == 200) {
        var color = logColors['response'];
        if (data is List) {
          event = data[0];
        } else {
          color = logColors['app_error'];
          if (data is String) {
            event['e'] = 'Backend Error';
            event['e_stacktrace'] = getStringFromDirtyHtml(data);
          } else {
            event['e'] = 'Format Error';
            event['e_stacktrace'] =
                'response is not an array or an HTML string';
            event['e_data'] = data;
          }
        }
        //HACK add a response ID so the event will have the right color
        event['_id'] = eventId++;
        log(copyOddClasses(event), color);
        callback(event);
      } else {
        var color = logColors['response'];
        var resp = data;
        String responseData = resp as String;
        dynamic evt = responseData;
        if (evt is String) {
          try {
            evt = jsonDecode(responseData);
          } catch (e) {
            // do nothing
          }
        }
        if (evt is List) {
          event = evt[0];
        } else {
          color = logColors['app_error'];
          event['e'] = 'Error';
          event['e_stacktrace'] = responseData is String
              ? getStringFromDirtyHtml(responseData)
              : 'response is not a string';
        }
        //HACK add a response ID so the event will have the right color
        event['_id'] = eventId++;
        log(copyOddClasses(event), color);
        callback(event);
      }
    });
  }

  ///
  /// Return a string with HTML tags turned into string characters.
  /// @author DanielWHoward
  ///
  String getStringFromDirtyHtml(String data) {
    data = data.replaceAll(RegExp(r"(<([^>]+)>)"), ''); // HTML tags
    data = data.replaceAll(RegExp(r"\n+"), ' '); // newline -> space
    data = data.replaceAll(RegExp(r"\:\s+"), ': '); // extra spaces
    data = data.replaceAll(RegExp(r"\#"), '\n#'); // PHP stack trace
    data = data.replaceAll(RegExp(r"&quot;"), '"'); // real quotes
    data = data.replaceAll(RegExp(r"&gt;"), '>'); // greater than
    return data;
  }

  ///
  /// Reorder keys in a JSON string.
  /// @author DanielWHoward
  ///
  String reorderJson(s, first, last) {
    var i = 0;
    var targets = [];
    var sMap = jsonDecode(s);
    // separate into an array of objects/maps
    for (i = 0; i < (first.length + last.length + 1); ++i) {
      var k = '';
      targets.add({});
      if (i < first.length) {
        k = first[i];
      } else if (i > first.length) {
        k = last[i - first.length - 1];
      }
      if ((k != '') && sMap.containsKey(k)) {
        targets[i][k] = sMap[k];
        sMap.remove(k);
      }
    }
    targets[first.length] = sMap;
    // build JSON string from array of objects/maps
    s = '';
    for (i = 0; i < targets.length; ++i) {
      var target = targets[i];
      if (target.length > 0) {
        var sTarget = jsonEncode(target);
        if (s == '') {
          s = sTarget;
        } else {
          s = s.substring(0, s.length - 1) + "," + sTarget.substring(1);
        }
      }
    }
    return s;
  }

  ///
  /// Logging colors.
  /// @author DanielWHoward
  ///
  final logColors = {
    'request': 'lightgreen',
    'malformed': 'red',
    'response': 'green',
    'notification': 'blue',
    'app_error': 'deeppink',
    'response_error': 'deeppink',
    'outofband_error': 'darkorange',
    'notification_error': 'darkgoldenrod'
  };

  ///
  /// Log string or event to the console.
  /// @author DanielWHoward
  ///
  void log(Object obj, [String? color]) {
    String? msg = obj is String ? obj : null;
    Map? event = obj is Map ? obj : null;
    var stacktrace = ((event != null) && (event['e_stacktrace'] != null))
        ? event['e_stacktrace']
        : null;
    // use color enum or standard color name
    color = color != null && logColors[color] != null
        ? logColors[color]
        : color;
    if (config['log'] ||
        ((event != null) && (event['_log'] is bool) && event['_log'] as bool)) {
      if (obj is String) {
        // log colored text to the console
        print(msg);
      } else {
        if (event!.containsKey('e')) {
          // response errors are pink; notification errors are brown
          color = event['_id'] != null
              ? logColors['response_error']
              : logColors['notification_error'];
          // log the stack trace separately
          if (stacktrace != null) {
            event.remove('e_stacktrace');
            log(stacktrace, color);
          }
          // log the event without the stack trace
          msg = jsonEncode(event);
          // restore the stack trace
          if (stacktrace != null) {
            event['e_stacktrace'] = stacktrace;
          }
        } else {
          // response events are in green; notifications are in blue
          color = event['_id'] != null
              ? logColors['response']
              : logColors['notification'];
          msg = jsonEncode(event);
        }
        msg = reorderJson(msg, ['type', 'to', 'from', '_id'], ['i', 'e']);
        log(msg, color);
      }
    }
  }
}
