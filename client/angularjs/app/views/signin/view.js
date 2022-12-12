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
'use strict';

/**
 * @ngdoc controller
 * @name myApp.views.controller:SignInView
 * @description
 * # SignInView
 * Controller that signs in the user and navigates to
 * the user profile.
 * @author DanielWHoward
 */
angular.module('myApp.views')

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/signin', {
    templateUrl: 'views/signin/view.html',
    controller: 'SignInView',
    controllerAs: 'SignInView'
  });
}])

.controller('SignInView', [
  '$scope', '$location', 'XibbitService', 'Pwd',
  function($scope, $location, XibbitService, Pwd) {
    var SignInView = this;
    XibbitService = XibbitService.scope($scope, true);
    SignInView.error = '';
    /**
     * Log in the user.
     * @author DanielWHoward
     */
    SignInView.submit = function() {
      XibbitService.send({
        type: 'login',
        to: SignInView.email,
        pwd: Pwd.encrypt(SignInView.email, SignInView.pwd)
      }, function(event) {
        var path = '/';
        if (event.loggedIn) {
          XibbitService.setSessionValue('me', event.me);
          // collect additional user settings if needed
          if (event.i && (event.i.substring(0, 8) === 'collect:')) {
            path = event.i.substring(8).split(':');
            path = '/'+path[0];
          }
          $location.path(path);
        } else {
          SignInView.error = event.i || event.e;
        }
      });
    };
  }
]);
