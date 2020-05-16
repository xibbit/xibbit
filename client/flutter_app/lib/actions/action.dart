///////////////////////////////////////////////////////
//                    xibbit 1.50                    //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//             Do not remove this notice             //
///////////////////////////////////////////////////////

import '../modules/platform/reduce.dart';

// app action enumeration
enum ActionTypes {
  Init,
  Login,
  Logout,
  Event,
  SetProfile,
}

///
/// An action for this app.
///
class Action extends ReduxAction {
  Action(Map<String, Object> initial) : super(initial);
  ActionTypes get type => payload['type'];
  Map get event => payload['event'];
}
