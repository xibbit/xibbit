// The MIT License (MIT)
//
// xibbit 2.0.0 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @version 2.0.0
// @copyright xibbit 2.0.0 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
const {asserte} = require('../asserte');
const {has_string_keys} = require('../array');
const {on} = require('../xibbit_helpers');
/**
 * Handle user_profile_mail_update event.  Change
 * this user's mailing address and other values.
 *
 * Use Node.js async await style to show how it works.
 *
 * @author DanielWHoward
 **/
module.exports = on('user_profile_mail_update', (event, {pf}) =>
  async (resolve, reject) => { try {

  asserte(event.user, 'missing:user');
  asserte(has_string_keys(event.user), 'typeof:user');

  // get the current user
  const uid = event._session.uid;
  asserte(uid === parseInt(uid, 10), 'current user not found');
  asserte(uid > 0, 'current user not found');
  const me = await pf.readOneRow({
    table: 'users',
    where: {
      uid
  }});
  asserte(me !== null, 'current user not found');
  // remove all uneditable fields
  const readonly = [
    'id',
    'roles',
    'json',
    'n',
    'password'
  ];
  for (var k in readonly) {
    var key = readonly[k];
    if (event.user[key]) {
      delete event.user[key];
    }
  }
  // update the profile
  await pf.updateRow({
    table: 'users',
    values: event.user,
    where: {
      uid
  }});
  // info: profile updated
  event.i = 'profile updated';
  resolve(event);
} catch (e) { reject(e); } });
