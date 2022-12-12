// The MIT License (MIT)
//
// xibbit 1.5.3 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// @version 1.5.3
// @copyright xibbit 1.5.3 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
///
/// A base class for actions.
///
class ReduxAction {
  late Map payload;
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
    [Object? castToAction]) =>
        ({Object? state, ReduxAction? action}) {
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
      return (changed ? newState : state) as Object;
    };

final flutterReducer = (Reducer myReducer) =>
    (Map<dynamic, dynamic> state, dynamic action) =>
        myReducer(state: state, action: action as
        ReduxAction)
            as Map<dynamic, dynamic>;
