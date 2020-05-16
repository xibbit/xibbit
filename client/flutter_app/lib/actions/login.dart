///////////////////////////////////////////////////////
//                    xibbit 1.50                    //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//             Do not remove this notice             //
///////////////////////////////////////////////////////

import './action.dart';

// login action creator
final login = (payload) => Action({'type': ActionTypes.Login});

// logout action creator
final logout = (payload) => Action({'type': ActionTypes.Logout});
