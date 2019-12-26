///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
'use strict';

// Declare app level module which depends on views, and core components
angular.module('myApp', [
  'ngRoute',
  'ngCookies',
  'myApp.views',
  'myApp.view1',
  'myApp.view2',
  'myApp.version'
]).
factory('httpInterceptor', function() {
  return {
    request: function(config) {
      if (config.url.startsWith('views/') ||
          config.url.startsWith('view1/') ||
          config.url.startsWith('view2/')) {
        config.url = client_base + config.url;
      }
      return config;
    }
  };
}).
config([
  '$locationProvider', '$routeProvider',
  function($locationProvider, $routeProvider) {
  $locationProvider.hashPrefix('!');

  $routeProvider.otherwise({redirectTo: '/'});
}]).
config([
  '$httpProvider',
  function($httpProvider) {
  $httpProvider.interceptors.push('httpInterceptor');
}]).
controller('AppCtrl', [
  '$scope', 'XibbitService', 'Hello',
  function($scope, XibbitService, Hello) {
  Hello = Hello; // force use so Hello service is inited
  var App = this;
  $scope.$watch(function() {
    return XibbitService.isLoggedIn();
  }, function(newVal) {
    $scope.signedIn = newVal;
    App.signedIn = newVal;
  });
  App.signOut = function() {
    XibbitService.send({
      type: 'logout'
    }, function(event) {
      $scope.$apply(function() {});
    });
  }
}]);
