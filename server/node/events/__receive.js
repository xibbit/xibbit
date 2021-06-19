// The MIT License (MIT)
//
// xibbit 1.5.1 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @version 1.5.1
// @copyright xibbit 1.5.1 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
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
    if (!event._session || !event._session.instance) {
      console.error('__receive did not get _session.instance');
    }
    var instance = event._session.instance;
    event.eventQueue = [];
    // get the events from the events table
    pf.readRows({
      table: 'sockets_events',
      where: {
        sid: instance
    }}, function(e, events) {
    var promises = promise.map([]);
    // this is intentionally not ACID; the client will handle dups
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
});
};
