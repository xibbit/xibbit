///////////////////////////////////////////////////////
//                    xibbit 1.50                    //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//             Do not remove this notice             //
///////////////////////////////////////////////////////

import './action.dart';

// change profile action creator
final setprofile = (payload) => Action({
      'type': ActionTypes.SetProfile,
      'profile': payload['profile'],
    });
