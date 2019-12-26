///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
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
        if (event.from) {
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
