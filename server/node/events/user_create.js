///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
const {asserte} = require('../asserte');
const {pwd_hash} = require('../pwd');
const {api} = require('../xibbit_helpers');
var config = require('../config');
var moment = require('moment-timezone');
/**
 * Handle user_create event.  Create a new user.
 *
 * Use Node.js callback style to show how it works.
 *
 * @author DanielWHoward
 **/
module.exports = self => {
self.api('user_create', (event, {pf}, callback) => {

  asserte(event.username, 'missing:username');
  asserte(typeof event.username === 'string', 'typeof:username');
  asserte(!event.username.includes(pf.usernamesNotAllowed), 'invalid:username');
  asserte(event.username.match(/^[a-z][a-z0-9]{2,11}$/) !== null, 'regexp:username');
  asserte(event.email, 'missing:email');
  asserte(typeof event.email === 'string', 'invalid:email');
  asserte(event.email.match(/^[_a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/) !== null, 'regexp:email');
  asserte(event.pwd, 'missing:pwd');
  asserte(typeof event.pwd === 'string', 'typeof:pwd');

  const {username, email} = event;
  pwd_hash(event.pwd, '', '', false, function(e, hashedPwd) {

  var now = moment(new Date()).tz(config.time_zone).format('YYYY-MM-DD HH:mm:ss');
  var nullDateTime = '1970-01-01 00:00:00';
  // see if the user is already in the database
  pf.readOneRow({
    table: 'users',
    where: {
      or: 'or',
      username,
      email,
  }}, function(e, me) {
  // insert the user into the database
  if (me === null) {
    // insert the user
    pf.insertRow({
      table: 'users',
      values: {
        id: 0,
        uid: 0,
        username,
        email,
        pwd: hashedPwd,
        created: now,
        connected: nullDateTime,
        touched: nullDateTime
    }}, function(e, user) {
    id = user.id;
    uid = user.id;
    // update the uid
    values = {
      uid
    };
    pf.updateRow({
      table: 'users',
      values,
      where: {
        id
    }}, function() {
    delete event.pwd;
    event.i = 'created';
    callback(null, event);
    });
    });
  } else {
    delete event.pwd;
    event.e = 'already exists';
    callback(null, event);
  }
  });
  });
});
};
