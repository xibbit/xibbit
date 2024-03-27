// The MIT License (MIT)
//
// xibbit 2.0.0 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @version 2.0.0
// @copyright xibbit 2.0.0 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
import '../modules/platform/reduce.dart';
import '../modules/platform/select.dart';
import '../actions/action.dart';

///
/// Get login state.
///
final loginSelectors = combineSelectors(
  {},
  (state) => {'isLoggedIn': () => state as bool},
);

///
/// Put login state.
///
bool loginReducer({bool state = false, required Action action}) {
  ActionTypes type = action.type;
  switch (type) {
    case ActionTypes.Login:
      return true;
    case ActionTypes.Logout:
      return false;
    default:
      break;
  }
  return state;
}

///
/// Save login state.
///
Map eventsReducer({Map state = emptyMap, required Action action}) {
  ActionTypes type = action.type;
  switch (type) {
    case ActionTypes.Event:
      return action.event;
    default:
      break;
  }
  return state;
}

final eventsSelectors = combineSelectors(
    {},
    (state) => {
          'getType': () => (state as Map)['type'] as String,
          'getMessage': () {
            String msg = '';
            switch ((state as Map)['type']) {
              case 'notify_instance':
                msg = 'Somebody arrived.';
                break;
              case 'notify_login':
                String from = (state)['from'];
                msg = '$from signed in.';
                break;
              case 'notify_logout':
                String from = (state)['from'];
                msg = '$from signed out.';
                break;
              case 'notify_laughs':
                String user = (state)['from'];
                msg = '$user laughs out loud';
                break;
              case 'notify_jumps':
                String user = (state)['from'];
                msg = '$user jumps up and down';
                break;
              default:
                break;
            }
            return msg;
          },
        });

///
/// Get profile state.
///
final profileSelectors = combineSelectors(
  {},
  (state) => {
    'getName': () => (state as Map<String, String>)['name'],
    'getAddress': () => (state as Map<String, String>)['address'],
    'getAddress2': () => (state as Map<String, String>)['address2'],
    'getCity': () => (state as Map<String, String>)['city'],
    'getState': () => (state as Map<String, String>)['state'],
    'getZip': () => (state as Map<String, String>)['zip']
  },
);

const Map<String, String> defaultProfile = {
  'name': 'Xibbit X. Xibbit',
  'address': '9 Xibbit Road',
  'address2': '',
  'city': 'Xibbitown',
  'state': 'XX',
  'zip': '99999',
};

///
/// Put profile state.
///
Map<String, String> profileReducer(
    {Map<String, String> state = defaultProfile, required Action action}) {
  ActionTypes type = action.type;
  switch (type) {
    case ActionTypes.SetProfile:
      return (action['profile'] as Map).cast<String, String>();
    default:
      break;
  }
  return state;
}

final rootConfig = {
  'login': {
    'reducer': loginReducer,
    'selector': loginSelectors,
  },
  'events': {
    'reducer': eventsReducer,
    'selector': eventsSelectors,
  },
  'profile': {
    'reducer': profileReducer,
    'selector': profileSelectors,
  },
};

///
/// Return a new map that dereferences a key.
///
Map remap(Map tgt, Map src, Object key) {
  return src.entries.fold(tgt, (map, entry) {
    map[entry.key] = entry.value[key];
    return map;
  });
}

// cast a base action class to a derived action class
final downcast = (ReduxAction action) => action as Action;

final reducerMap = remap(<String, Function>{}, rootConfig, 'reducer');

final selectorMap = remap(<String, Function>{}, rootConfig, 'selector');

final initialState =
    getInitialState(reducerMap as Map<String, Function>, Action({'type': ActionTypes.Init}));

final rootReducer = flutterReducer(combineReducers(reducerMap as Map<String, Function>, downcast));

class _getLoginSelectors {
  final dynamic _selectors;
  _getLoginSelectors(this._selectors);
  isLoggedIn() => _selectors['isLoggedIn']();
}

class _getEventsSelectors {
  final dynamic _selectors;
  _getEventsSelectors(this._selectors);
  getMessage() => _selectors['getMessage']();
}

class _getProfileSelectors {
  final dynamic _selectors;
  _getProfileSelectors(this._selectors);
  getProfile() => _selectors['getProfile']();
  getName() => _selectors['getName']();
  getAddress() => _selectors['getAddress']();
  getAddress2() => _selectors['getAddress2']();
  getCity() => _selectors['getCity']();
  getState() => _selectors['getState']();
  getZip() => _selectors['getZip']();
}

class _RootSelector {
  final dynamic _selectors;
  _RootSelector(this._selectors);
  getLoginSelectors() => _getLoginSelectors(_selectors['getLoginSelectors']);
  getEventsSelectors() => _getEventsSelectors(_selectors['getEventsSelectors']);
  getProfileSelectors() => _getProfileSelectors(_selectors['getProfileSelectors']);
}

final dynamic rootSelectors = (state) =>
    _RootSelector(combineSelectors(selectorMap, (state) => {})(state));
