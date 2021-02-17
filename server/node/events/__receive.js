///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
const {asserte} = require('../asserte');
const {api} = require('../xibbit_helpers');
const promise = require('../misc/nanopromise');
var moment = require('moment-timezone');
var config = require('../config');
/**
 * Handle __receive event.  Change event queue to
 * use instances instead of usernames.
 *
 * Use Node.js callback style to show how it works.
 *
 * Use misc/nanopromise to show how it works.
 *
 * @author DanielWHoward
 **/
module.exports = self => {
self.api('__receive', (event, {pf, useInstances}, callback) => {
  // assume that this event does not need special handling
  event.e = 'unimplemented';

  if (useInstances) {
    if (event._session && event._session.instance) {
      var instance = event._session.instance;
      event.eventQueue = [];
      // get the events from the events table
      pf.readRows({
        table: 'sockets_events',
        where: {
          sid: instance
      }}, function(e, events) {
      var promises = promise.map([]);
      for (var f=0; f < events.length; ++f) {
        const evt = events[f].event;
        // delete the event from the events table
        pf.deleteRow({
          table: 'sockets_events',
          where: {
            id: events[f].id
        }});
        promises.push((function(f) {
          return function promise() {
            pf.deleteRow({
              table: 'sockets_events',
              where: {
                id: events[f].id
            }}, function() {
              promise.resolve(true);
            });
          };
        })(f));
        event.eventQueue.push(evt);
      }
      delete event.e;
      promises.resolve(function() {
        callback(null, event);
      });
      });
    } else {
      callback(null, event);
    }
  } else {
    callback(null, event);
  }
});
};
