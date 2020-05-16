///////////////////////////////////////////////////////
//                    xibbit 1.50                    //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//             Do not remove this notice             //
///////////////////////////////////////////////////////
import 'package:redux/redux.dart';
import '../reducers/index.dart';

// a single global store
final store = Store<Map>(rootReducer, initialState: initialState);
