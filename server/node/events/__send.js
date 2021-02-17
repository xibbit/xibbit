///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
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
self.api('__send', function(event, vars, callback) {
  var hub = vars.hub;
  var pf = vars.pf;
  var useInstances = vars.useInstances;

  if (useInstances) {
    var now = moment(new Date()).tz(config.time_zone).format('YYYY-MM-DD HH:mm:ss');
    var sent = false;
    // get the sender
    eventFrom = event['event']['from']? event['event']['from']: 'x';
    pf.readOneRow({
      'table': 'users',
      'where': {
        'email': eventFrom
    }}, function(e, from) {
    // get the receiver
    pf.readOneRow({
      'table': 'users',
      'where': {
        'username': event['event']['to']
    }}, function(e, to) {
    // resolve the "to" address to instances
    var instances = hub.sessions;
    var q = {
      'table': 'instances'
    };
    if ((to !== null) && (event['event']['to'] !== 'all')) {
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
      sent = true;
      // clone the event so we can safely modify it
      var evt = event.event;
      // "to" is an instance ID in events table
      var instanceId = instances[i].instance;
      // overwrite "from" and add "fromid" field
      if (from !== null) {
        evt['from'] = from['username'];
        evt['fromid'] = from['uid'];
      }
      promises.push((function(evt, instanceId) {
        return function promise() {
          pf.insertRow({
            table: 'sockets_events',
            values: {
              id: 0,
              sid: instanceId,
              event: JSON.stringify(evt),
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
        callback(null, event);
      });
    } else {
      event.e = 'unimplemented';
      callback(null, event);
    }
    });
    });
    });
  } else {
    event['e'] = 'unimplemented';
    callback(null, event);
  }
});
};
