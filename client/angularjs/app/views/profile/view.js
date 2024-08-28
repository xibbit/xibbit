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
/* global server_base, server_platform */
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
    /**
     * Upload a profile image.
     */
    var username = XibbitService.session.me.username;
    var publicFolder = server_base[server_platform]+'/public/images';
    var profile_image = publicFolder+'/'+username+'.png';
    if (server_platform === 'django') {
      profile_image = '/public/images/'+username+'.png';
    }
    ProfileView.profile_image = profile_image + '?r=' + Math.floor(Math.random() * 1000);
    ProfileView.uploadProfileImage = function(element) {
      var urls = {
        golang: '/user/profile/upload_photo',
        node: '/user/profile/upload_photo',
        php: server_base[server_platform]+'/app.php', // /user_profile_upload_photo.php
        django: '/upload_photo/image_upload'
      };
      var url = urls[server_platform];
      XibbitService.upload(url, {
        'type': 'user_profile_upload_photo',
        'image': element.files[0]
      }, function(event) {
        ProfileView.profile_image = profile_image + '?r=' + Math.floor(Math.random() * 1000);
        ProfileView.error = event.i || event.e;
      });
    };
  }
]);
