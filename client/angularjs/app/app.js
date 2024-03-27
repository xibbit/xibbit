// The MIT License (MIT)
//
// xibbit 2.0.0 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @version 2.0.0
// @copyright xibbit 2.0.0 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
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
