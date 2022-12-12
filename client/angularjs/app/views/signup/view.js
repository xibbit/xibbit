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
 * @name myApp.views.controller:SignUpView
 * @description
 * # SignUpView
 * Controller that creates a new user.
 * @author DanielWHoward
 */
angular.module('myApp.views')

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/signup', {
    templateUrl: 'views/signup/view.html',
    controller: 'SignUpView',
    controllerAs: 'SignUpView'
  });
}])

.controller('SignUpView', [
  '$scope', '$location', 'XibbitService', 'Pwd',
  function($scope, $location, XibbitService, Pwd) {
    var SignUpView = this;
    XibbitService = XibbitService.scope($scope, true);
    SignUpView.user = {};
    SignUpView.error = '';
    /**
     * Create the user.
     * @author DanielWHoward
     */
    SignUpView.submit = function() {
      XibbitService.send({
        type: 'user_create',
        username: SignUpView.user.username,
        email: SignUpView.user.email,
        pwd: Pwd.encrypt(SignUpView.user.email, SignUpView.user.pwd)
      }, function(event) {
        SignUpView.error = event.i || event.e;
      });
    };
  }
]);
