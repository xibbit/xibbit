///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
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
