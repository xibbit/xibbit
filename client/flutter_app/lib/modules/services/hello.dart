///////////////////////////////////////////////////////
//                    xibbit 1.50                    //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//             Do not remove this notice             //
///////////////////////////////////////////////////////

import './xibbitservice.dart';

/**
 * @ngdoc service
 * @name Hello
 * @description
 * # Hello
 * Service to send a hello event to the backend
 * and make it available to the app.
 */
class Hello {
  Future<Object> event;

  Hello() {}

  void send() {
    Map<String, Object> evt = {'type': 'init'};
    this.event = xibbitService.send(evt, (event) => this.apply(event));
  }

  apply(Map<String, Object> event) {
    print('init event returned ' + event['i']);
  }
}
