// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:reselect/reselect.dart';
import '../lib/modules/platform/reduce.dart' as reducers;
import '../lib/modules/platform/select.dart';
import '../lib/actions/action.dart' as actions;
import 'package:redux/redux.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:flutter_public_figure/main.dart';

final rootConfig = {};

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
final downcast = (reducers.ReduxAction action) => action as Action;

final reducerMap = remap(Map<String, Function>(), rootConfig, 'reducer');

final selectorMap = remap(Map<String, Function>(), rootConfig, 'selector');

final initialState =
    reducers.getInitialState(reducerMap as Map<String, Function>, actions.Action({'type': actions.ActionTypes.Init}));

final rootReducer = reducers.flutterReducer(reducers.combineReducers(reducerMap as Map<String, Function>, downcast));

final store = Store<Map>(rootReducer, initialState: initialState as Map<dynamic, dynamic>);

void main() {
  testWidgets('Counter increments smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(MyApp(store: store));

    // Verify that our counter starts at 0.
    expect(find.text('0'), findsOneWidget);
    expect(find.text('1'), findsNothing);

    // Tap the '+' icon and trigger a frame.
    await tester.tap(find.byIcon(Icons.add));
    await tester.pump();

    // Verify that our counter has incremented.
    expect(find.text('0'), findsNothing);
    expect(find.text('1'), findsOneWidget);
  });
}
