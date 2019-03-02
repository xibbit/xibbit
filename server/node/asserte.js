///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////

/**
 * Throw an exception if the assert condition is false.
 *
 * @param cond boolean A boolean for the assertion.
 * @param msg The message to use if the assertion fails.
 * @throws Exception The assertion failed.
 *
 * @author Daniel Howard
 **/
function asserte(cond, msg, callback) {
  if (!cond) {
    if (callback) {
      callback(msg);
    } else {
      throw new Error(msg);
    }
  }
};
exports.asserte = asserte;
/**
 * Throw an exception if the event object has too few or too many arguments.
 *
 * @param event array The event that should be minimal.
 * @throws Exception The assertion failed.
 *
 * @author Daniel Howard
 **/
function noAsserte(event) {
  // check the required properties
  asserte(event['type'], 'missing:type');
  asserte(event['_id'], 'missing:_id');
  asserte(event['_session'], 'missing:_session');
  asserte(event['_conn'], 'missing:_conn');
  // check the "from" property
  var keys = Object.keys(event).length;
  if ((Object.keys(event).length === 5) && event['from']) {
    --keys;
  }
  if (keys !== 4) {
    // find at least one extra property
    if (event['from']) {
      delete event['from'];
    }
    delete event['type'];
    delete event['_id'];
    delete event['_session'];
    delete event['_conn'];
    keys = Object.keys(event);
    throw new Error('property:'+keys[0]);
  }
}
exports.noAsserte = noAsserte;
