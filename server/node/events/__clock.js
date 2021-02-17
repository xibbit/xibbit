///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
const {asserte} = require('../asserte');
/**
 * Handle __clock event.  Remove saved instances if
 * they have not been heard from in a while.
 *
 * Use Node.js callback style to show how it works.
 *
 * @author DanielWHoward
 **/
module.exports = self => {
  self.api('__clock', (event, {hub, pf}, callback) => {

    // use seconds since epoch instead of datetime string to demo how this is done
    var now = Math.floor(new Date().getTime() / 1000);
    var globalVars = event.globalVars;

    if (!globalVars.lastRandomEventTime ||
        (now > (globalVars.lastRandomEventTime + 10))) {
      globalVars.lastRandomEventTime = now;
      if (globalVars.numRandom) {
        ++globalVars.numRandom;
      } else {
        globalVars.numRandom = 1;
      }
      if (!globalVars.lastRandomEventIndex) {
        globalVars.lastRandomEventIndex = 0;
      }
      globalVars.lastRandomEventIndex =
        (globalVars.lastRandomEventIndex + 1) % 4;
      var eventIndex = globalVars.lastRandomEventIndex;

      var randomUsers = [
        ['admin', 1],
        ['user1', 2]
      ];
      var randomTypes = [
        'notify_laughs',
        'notify_jumps'
      ];
      randomUser = randomUsers[eventIndex % 2][0];
      randomType = randomTypes[Math.floor(eventIndex/2)];
      hub.send({
        'type': randomType,
        'to': 'all',
        'from': randomUser
      }, '', false, function() {
        event.globalVars = globalVars;
        callback(null, event);
      });
    } else {
      callback(null, event);
    }
  });
};
