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
self.on('api', 'user_create', (event, {pf}, callback) => {

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
  now = new Date();
  var nullDateTime = '1970-01-01 00:00:00';
  nullDateTime = new Date('1970-01-01T00:00:00Z');
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
