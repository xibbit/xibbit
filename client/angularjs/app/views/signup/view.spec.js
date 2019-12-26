///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
'use strict';

describe('myApp.views.SignUpView module', function() {

  beforeEach(module('myApp'));
  beforeEach(module('myApp.views'));

  describe('SignUpView controller', function(){

    it('should ....', inject(function($controller, $rootScope, _XibbitService_, _Pwd_) {
      var scope = $rootScope.$new();
      //spec body
      var signUpViewCtrl = $controller('SignUpView', {
        $scope: scope,
        XibbitService: _XibbitService_,
        Pwd: _Pwd_
      });
      expect(signUpViewCtrl).toBeDefined();
    }));

  });
});