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
const {asserte} = require('../asserte');
const {api} = require('../xibbit_helpers');
const promise = require('../misc/nanopromise');
var config = require('../config');
var moment = require('moment-timezone');
/**
 * Handle __send event.  Process 'all' and user
 * aliases to send this event to multiple
 * instances.
 *
 * Use Node.js callback style to show how it works.
 *
 * Use misc/nanopromise to show how it works.
 *
 * @author DanielWHoward
 **/
module.exports = self => {
self.on('api', '__send', function(event, vars, callback) {
  var hub = vars.hub;
  var pf = vars.pf;
  var useInstances = vars.useInstances;

  // assume that this event does not need special handling
  event.e = 'unimplemented';

  if (useInstances) {
    if (!event.event || !event.event.to) {
      console.error('__send did not get event.to');
    }
    var toStr = event.event.to;
    var now = moment(new Date()).tz(config.time_zone).format('YYYY-MM-DD HH:mm:ss');
    now = new Date();
    var sent = false;
    // get the sender
    eventFrom = event.event.from? event.event.from: 'x';
    pf.readOneRow({
      'table': 'users',
      'where': {
        'email': eventFrom
    }}, function(e, from) {
    // get the receiver
    pf.readOneRow({
      'table': 'users',
      'where': {
        'username': toStr
    }}, function(e, to) {
    // resolve the "to" address to instances
    var instances = hub.sessions;
    var q = {
      'table': 'instances'
    };
    if ((to !== null) && (toStr !== 'all')) {
      q = {
        'table': 'instances',
        'where': {
          'uid': to['uid']
      }};
    }
    pf.readRows(q, function(e, instances) {
      var promises = promise.map([]);
    // send an event to each instance
    for (var i=0; i < instances.length; ++i) {
      var keysToSkip = ['_conn'];
      sent = true;
      // clone the event so we can safely modify it
      var evt = hub.cloneEvent(event.event, keysToSkip);
      // "to" is an instance ID in events table
      var instanceId = instances[i].instance;
      // overwrite "from" and add "fromid" field
      if (from !== null) {
        evt['from'] = from['username'];
        evt['fromid'] = from['uid'];
      }
      promises.push((function(evt, instanceId) {
        return function promise() {
          var evtStr = JSON.stringify(evt);
          pf.insertRow({
            table: 'sockets_events',
            values: {
              id: 0,
              sid: instanceId,
              event: evtStr,
              touched: now
            }
          }, function() {
            promise.resolve(true);
          });
        };
      })(evt, instanceId));
    }
    if (sent) {
      promises.resolve(function() {
        delete event.e;
        callback(null, event);
      });
    } else {
      callback(null, event);
    }
    });
    });
    });
  } else {
    callback(null, event);
  }
});
};
