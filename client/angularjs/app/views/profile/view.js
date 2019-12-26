///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
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
