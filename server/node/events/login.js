///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
const {asserte, noAsserte} = require('../asserte');
const {pwd_verify} = require('../pwd');
const {api} = require('../xibbit_helpers');
/**
 * Handle login event.  Sign in a user.
 *
 * Use Node.js callback style to show how it works.
 *
 * @author DanielWHoward
 **/
module.exports = self => {
self.api('login', (event, {hub, pf}, callback) => {

  asserte(event.to, 'missing:to');
  asserte(typeof event.to === 'string', 'typeof:to');
  asserte(event.to.match(/^[_a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/) !== null, 'regexp:to');
  asserte(event.pwd, 'missing:pwd');
  asserte(typeof event.pwd === 'string', 'typeof:pwd');
  const {to, pwd} = event;
  const passwd = pwd;

  // save the password but remove it from the event
  delete event.pwd;
  let verified = true;
  if (verified) {
    // find user in the database
    pf.readOneRow({
      table: 'users',
      where: {
        email: to
    }}, function(e, me) {
    if (me === null) {
      // if there is no user, force the password code to run
      //  with fake data so the user cannot guess usernames
      //  based on timing
      me = {
        pwd: '$5$9f9b9bc83f164e1f1f392499e2561f05940c1d6c47bcad69e3bd311e620ab9d5$ee2334e03ba30379fb09cd1df0d4088ea8a853411062be0f83925ccdd2037aaf'
      };
    }
    // compare but do not allow user to guess hash string based on timing
    pwd_verify(passwd, me.pwd, function(e, verified) {
    if (typeof verified === 'string') {
      const upgradedPwd = verified;
      pf.updateRow({
        table: 'users',
        values: {
          pwd: upgradedPwd},
        where: {
          id: me.id
      }});
      verified = true;
    }
    if (verified) {
      // find user in the database
      pf.readRows({
        table: 'users',
        where: {
          uid: me.uid
      }}, function(e, me) {
      if ((me.length === 1) && (me[0].username === 'user')) {
        event.i = 'collect:username';
      }
      me = me[me.length-1];
      // connect to this user
      event.username = me.username;
      hub.connect(event, me.username, true);
      // add UID and user to the session variables
      event._session.uid = me.id;
      event._session.user = me;
      // return user info
      event.me = {
        roles: me.roles || []
      };
      // update the instance with UID
      pf.readOneRow({
        table: 'instances',
        'where': {
          instance: event._session.instance
      }}, function(e, row) {
        if (row !== null) {
          const values = {
            uid: event._session.uid
          };
          pf.updateRow({
            table: 'instances',
            values,
            where: {
              uid: event._session.uid,
              instance: event._session.instance
          }}, function() {
            hub.send({
              type: 'notify_login',
              to: 'all',
              from: to
            });
            // info: user logged in
            if (!event.i) {
              event.i = 'logged in';
            }
            callback(null, event);
          });
        } else {
          hub.send({
            type: 'notify_login',
            to: 'all',
            from: to
          });
          // info: user logged in
          if (!event.i) {
            event.i = 'logged in';
          }
          callback(null, event);
        }
      });
      });
    } else {
      // error: user not found or wrong password
      event.e = 'unauthenticated';
      callback(null, event);
    }
    });
    });
  } else {
    // error: user not found or wrong password
    event.e = 'unauthenticated';
    callback(null, event);
  }
});
};
