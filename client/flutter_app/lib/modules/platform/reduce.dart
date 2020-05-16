///////////////////////////////////////////////////////
//                    xibbit 1.50                    //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//             Do not remove this notice             //
///////////////////////////////////////////////////////

///
/// A base class for actions.
///
class ReduxAction {
  Map payload;
  ReduxAction(Map<String, Object> payload) {
    this.payload = payload;
  }
  Object operator [](String key) => payload[key];
  operator []=(String key, Object value) => payload[key] = value;
}

// some useful function types
typedef Reducer = Object Function({Object state,
ReduxAction action});
typedef ReducerMapper = Reducer Function(
    Map<String, Function>, Object);

///
/// Build an initial state.
///
Object getInitialState(Map<String, Function>
reducerMap,
        ReduxAction initAction) =>
    reducerMap.entries.fold({}, (state, entry) {
      (state as Map)[entry.key] = entry.value(action:
      initAction);
      return state;
    });

///
/// Combine a map of reducers into a single reducer.
///
final ReducerMapper combineReducers =
    (Map<String, Function> reducerMap,
    [Object castToAction]) =>
        ({Object state, ReduxAction action}) {
          final Function castAction =
            castToAction == null ? (action) => action :
            castToAction as Function;
      if (state == null) {
        state = {};
      }
      var changed = false;
      var newState = {};
      reducerMap.forEach((key, valueReducer) {
        final stateAsMap = state as Map;
        final newValueState = stateAsMap.containsKey
        (key)
            ? valueReducer(
                state: stateAsMap[key], action:
                action)
            : valueReducer(action: action);
        if (newValueState != stateAsMap[key]) {
          changed = true;
        }
        newState[key] = newValueState;
      });
      return changed ? newState : state;
    };

final flutterReducer = (Reducer myReducer) =>
    (Map<dynamic, dynamic> state, dynamic action) =>
        myReducer(state: state, action: action as
        ReduxAction)
            as Map<dynamic, dynamic>;
