///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
'use strict';

/**
 * @ngdoc service
 * @name myApp.service:Hello
 * @description
 * # Hello
 * Service to send a hello event to the backend
 * and make it available to the app.
 * @author DanielWHoward
 */
angular.module('myApp')
  .service('Hello', [
    '$q', 'XibbitService',
  function($q, XibbitService) {
    var self = this;
    var eventDeferred = $q.defer();
    self.event = eventDeferred.promise;
    self.apply = function(event) {
      console.log('app inited');
    };
    var hello = {
      type: 'init'
    };
    XibbitService.send(hello, function(event) {
      self.apply(event);
    });
  }]);
