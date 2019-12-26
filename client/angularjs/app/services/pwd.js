///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
/* global sha256 */
'use strict';

/**
 * @ngdoc service
 * @name myApp.service:Pwd
 * @description
 * # Pwd
 * Do simple client-side password encryption.
 * @author DanielWHoward
 */
angular.module('myApp')
  .service('Pwd', [
  function() {
    var self = this;
    self.encrypt = function(email, pwd) {
      return sha256(email+'xibbit.github.io'+pwd);
    };
  }]);
