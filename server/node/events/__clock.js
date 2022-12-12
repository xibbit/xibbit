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
/**
 * Handle __clock event.  Remove saved instances if
 * they have not been heard from in a while.
 *
 * Use Node.js callback style to show how it works.
 *
 * @author DanielWHoward
 **/
module.exports = self => {
  self.api('__clock', (event, {hub}, callback) => {

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
        callback(null, event);
      });
    } else {
      callback(null, event);
    }
  });
};
