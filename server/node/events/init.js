///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
const {asserte, noAsserte} = require('../asserte');
const {api} = require('../xibbit_helpers');
/**
 * Handle init event.  Return information to
 * initialize this app.  Nothing right now.
 *
 * Use Node.js callback style to show how it works.
 *
 * @author DanielWHoward
 **/
module.exports = self => {
self.api('init', (event, {pf}, callback) => {

  noAsserte(event);

  // info: initial values loaded
  event.i = 'initialized';
  callback(null, event);
});
};
