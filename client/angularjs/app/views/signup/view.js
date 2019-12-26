///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
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
