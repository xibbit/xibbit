///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
const {noAsserte} = require('../asserte');
const {on} = require('../xibbit_helpers');
/**
 * Handle logout event.  Sign out a user.
 *
 * Use Node.js callback style to show how it works.
 *
 * @author DanielWHoward
 **/
module.exports = self => {
self.on('logout', (event, {hub, pf}, callback) => {

  noAsserte(event);

  // broadcast this instance logged out
  hub.send({
    type: 'notify_logout',
    to: 'all',
    from: event.from
  });
  // logout this instance
  hub.connect(event, event._session.username, false);
  // remove UID from the instance
  pf.readOneRow({
    table: 'instances',
    'where': {
      instance: event._session.instance
  }}, function(e, row) {
  if (row !== null) {
    var values = {
      uid: 0
    };
    pf.updateRow({
      table: 'instances',
      values: values,
      where: {
        instance: event._session.instance
    }}, function() {
      // remove UID and user info from the session
      delete event._session.uid;
      delete event._session.user;
      event.i = 'logged out';
      callback(null, event);
    });
  } else {
    // remove UID and user info from the session
    delete event._session.uid;
    delete event._session.user;
    event.i = 'logged out';
    callback(null, event);
  }
  });
});
};
