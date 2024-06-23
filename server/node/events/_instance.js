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
const {api} = require('../xibbit_helpers');
var moment = require('moment-timezone');
var config = require('../config');
/**
 * Handle _instance event.  Save instance so
 * events can be broadcast to it later.
 *
 * Use Node.js callback style to show how it works.
 *
 * @author DanielWHoward
 **/
module.exports = self => {
self.on('api', '_instance', (event, {hub, pf, useInstances}, callback) => {

  if (useInstances) {
    var now = moment(new Date()).tz(config.time_zone).format('YYYY-MM-DD HH:mm:ss');
    var localSid = '';
    var uid = event._session.uid || 0;
    var instance = event.instance;
    // see if the instance already exists
    pf.readOneRow({
      table: 'instances',
      'where': {
        instance: instance
    }}, function(e, row) {
    // save the instance
    if (row === null) {
      // this is a brand new instance/user
      var values = {
        id: 0,
        sid: localSid,
        uid: uid,
        instance: instance,
        connected: now,
        touched: now
      };
      event._session.instance_id = instance;
      pf.insertRow({
        'table': 'instances',
        values
      }, function(e, instance) {
        hub.send({
          'type': 'notify_instance',
          'to': 'all'
        });
        callback(null, event);
      });
    } else {
      // if the browser page is reloaded, a new socket is
      //  created with an existing instance
      var values = {
        sid: localSid,
        uid: uid,
        instance: instance,
        touched: now
      };
      pf.updateRow({
        table: 'instances',
        values,
        where: {
          instance: event._session.instance_id
      }}, function() {
        callback(null, event);
      });
    }
  });
  } else {
    callback(null, event);
  }
});
};
