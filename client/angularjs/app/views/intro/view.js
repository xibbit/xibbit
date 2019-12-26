///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
'use strict';

/**
 * @ngdoc controller
 * @name myApp.views.controller:IntroView
 * @description
 * # IntroView
 * Controller that catches laughs and jumps events and
 * formats them for display.
 * @author DanielWHoward
 */
angular.module('myApp.views')

.controller('IntroView', [
  '$scope', 'XibbitService',
  function($scope, XibbitService) {
    var IntroView = this;
    XibbitService = XibbitService.scope($scope, true);
    IntroView.msg = '';
    XibbitService.on('notify_laughs', function(event) {
      IntroView.msg = ({
        'notify_laughs': event.from + ' laughs out loud',
        'notify_jumps': event.from + ' jumps up and down'
      })[event.type];
    });
    XibbitService.on('notify_jumps', function(event) {
      IntroView.msg = ({
        'notify_laughs': event.from + ' laughs out loud',
        'notify_jumps': event.from + ' jumps up and down'
      })[event.type];
    });
  }
]);
