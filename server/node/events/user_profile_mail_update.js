///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
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
