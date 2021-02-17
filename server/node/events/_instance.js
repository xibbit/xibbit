///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
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
self.api('_instance', (event, {hub, pf, useInstances}, callback) => {

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
      event._session.instance = instance;
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
          instance: event._session.instance
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
