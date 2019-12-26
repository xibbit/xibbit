///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
'use strict';

describe('myApp.views.SignInView module', function() {

  beforeEach(module('myApp'));
  beforeEach(module('myApp.views'));

  describe('SignInView controller', function(){

    it('should ....', inject(function($rootScope, $controller) {
      var scope = $rootScope.$new();
      //spec body
      var signInViewCtrl = $controller('SignInView', {$scope: scope});
      expect(signInViewCtrl).toBeDefined();
    }));

  });
});