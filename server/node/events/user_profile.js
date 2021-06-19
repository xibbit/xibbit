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
const {asserte, noAsserte} = require('../asserte');
const {on} = require('../xibbit_helpers');
const {array_merge} = require('../array');
/**
 * Handle user_profile event.  Get this user's
 * profile.
 *
 * Use Node.js async await style to show how it works.
 *
 * @author DanielWHoward
 **/
module.exports = on('user_profile', (event, {pf}) =>
  async (resolve, reject) => { try {

  noAsserte(event);

  // get the current user
  const uid = event._session.uid;
  asserte(uid === parseInt(uid, 10), 'current user not found');
  asserte(uid > 0, 'current user not found');
  let me = await pf.readOneRow({
    table: 'users',
    where: {
      uid
  }});
  asserte(me !== null, 'current user not found');
  // set default values for missing values
  me = array_merge({
    name: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    zip: ''
  }, me);
  // return the profile
  event.profile = {
    name: me.name,
    address: me.address,
    address2: me.address2,
    city: me.city,
    state: me.state,
    zip: me.zip
  };
  // info: profile returned
  event.i = 'profile found';
  resolve(event);
} catch (e) { reject(e); } });
