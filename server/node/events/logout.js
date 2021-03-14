// The MIT License (MIT)
//
// xibbit 1.50 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @copyright xibbit 1.50 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
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
