///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
'use strict';

/**
 * @ngdoc controller
 * @name myApp.views.controller:HomeViewCtrl
 * @description
 * # HomeViewCtrl
 * Controller that is ready for future development.
 * @author DanielWHoward
 */
angular.module('myApp.views', ['ngRoute', 'myApp', 'ngCookies'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'views/home/view.html',
    controller: 'HomeViewCtrl',
    controllerAs: 'HomeView'
  });
}])

.controller('HomeViewCtrl', [
  '$scope', '$timeout', 'XibbitService',
  function($scope, $timeout, XibbitService) {
    var HomeView = this;
    XibbitService = XibbitService.scope($scope);
  }
]);
