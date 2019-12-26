///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
'use strict';

describe('myApp.views.HomeViewCtrl module', function() {

  beforeEach(module('myApp'));
  beforeEach(module('myApp.views'));

  describe('HomeViewCtrl controller', function(){

    it('should ....', inject(function($rootScope, $controller) {
      //spec body
      var scope = $rootScope.$new();
      var view1Ctrl = $controller('HomeViewCtrl', {$scope: scope});
      expect(view1Ctrl).toBeDefined();
    }));

  });
});
