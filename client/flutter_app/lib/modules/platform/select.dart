///////////////////////////////////////////////////////
//                    xibbit 1.50                    //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//             Do not remove this notice             //
///////////////////////////////////////////////////////

import 'package:reselect/reselect.dart';

const emptyMap = {};

///
/// Return a function that generates stateful selectors;
/// that is, the state is "trapped" in the selector
/// functions.
///
dynamic combineSelectors(
        Map initialSelectors, Selector<dynamic, Map> selector) =>
    (state) {
      Map selectors = selector(state);
      if (state is Map && selectors is Map) {
        initialSelectors.entries.forEach((entry) {
          String capitalized =
              entry.key[0].toUpperCase() + entry.key.substring(1);
          selectors['get' + capitalized + 'Selectors'] =
              entry.value(state[entry.key]);
        });
      }
      return selectors;
    };
