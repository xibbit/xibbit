///////////////////////////////////////////////////////
//                    xibbit 1.50                    //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//             Do not remove this notice             //
///////////////////////////////////////////////////////

import './action.dart';

// notification action creator
final notify = (payload) => Action({'type': ActionTypes.Event, 'event': payload});
