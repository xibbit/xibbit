// The MIT License (MIT)
//
// xibbit 1.50 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @copyright xibbit 1.50 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
'use strict';

/**
 * @ngdoc controller
 * @name myApp.views.controller:ProfileView
 * @description
 * # ProfileView
 * Controller that reads and writes the user profile.
 * @author DanielWHoward
 */
angular.module('myApp.views')

.controller('ProfileView', [
  '$scope', 'XibbitService',
  function($scope, XibbitService) {
    var ProfileView = this;
    XibbitService = XibbitService.scope($scope);
    ProfileView.profile = {};
    ProfileView.error = '';
    XibbitService.send({
      type: 'user_profile'
    }, function(event) {
      if (event.i) {
        ProfileView.profile = event.profile;
      } else {
        ProfileView.error = event.e;
      }
    });
    /**
     * Change the user profile on the server.
     * @author DanielWHoward
     */
    ProfileView.updateProfile = function() {
      XibbitService.send({
        type: 'user_profile_mail_update',
        user: ProfileView.profile
      }, function(event) {
        ProfileView.error = event.i || event.e;
      });
    };
  }
]);
