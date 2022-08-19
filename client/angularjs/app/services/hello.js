// The MIT License (MIT)
//
// xibbit 1.5.2 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @version 1.5.2
// @copyright xibbit 1.5.2 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
'use strict';

/**
 * @ngdoc service
 * @name myApp.service:Hello
 * @description
 * # Hello
 * Service to send a hello event to the backend
 * and make it available to the app.
 * @author DanielWHoward
 */
angular.module('myApp')
  .service('Hello', [
    '$q', 'XibbitService',
  function($q, XibbitService) {
    var self = this;
    var eventDeferred = $q.defer();
    self.event = eventDeferred.promise;
    self.xibbit_detector_func = function(state) {
      var xibbit_detector = document.getElementById('xibbit_detector');
      if (xibbit_detector) {
        var msg = {
          'angularjs_worked': 'AngularJS is working but please wait for xibbit backend...',
          'xibbit_failed': 'AngularJS is working but xibbit backend is not working',
          'xibbit_worked': 'xibbit is working'
        }[state];
        var changed = false;
        if (xibbit_detector.textContent && (xibbit_detector.textContent.indexOf(msg.xibbit_worked) === -1)) {
          xibbit_detector.textContent = msg;
          changed = true;
        } else if (xibbit_detector.innerHTML && (xibbit_detector.innerHTML.indexOf(msg.xibbit_worked) === -1)) {
          xibbit_detector.innerHTML = msg;
          changed = true;
        }
        if (changed) {
          if (state === 'angularjs_worked') {
            xibbit_detector.style.backgroundColor = '';
            xibbit_detector.style.color = '';
          } else if (state === 'xibbit_failed') {
            xibbit_detector.style.backgroundColor = 'red';
            xibbit_detector.style.color = 'black';
          } else if (state === 'xibbit_worked') {
            xibbit_detector.style.backgroundColor = '';
            xibbit_detector.style.color = '#60bb60';
            xibbit_detector.removeAttribute('id');
          }
        }
      }
    };
    self.xibbit_detector_func('angularjs_worked');
    setTimeout(function() {
      self.xibbit_detector_func('xibbit_failed');
    }, 2000);
    self.apply = function(event) {
      console.log('app inited');
    };
    var hello = {
      type: 'init'
    };
    XibbitService.send(hello, function(event) {
      self.apply(event);
      if (self.xibbit_detector_func) {
        self.xibbit_detector_func('xibbit_worked');
      }
    });
  }]);
