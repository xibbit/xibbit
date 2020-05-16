///////////////////////////////////////////////////////
//                    xibbit 1.50                    //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//             Do not remove this notice             //
///////////////////////////////////////////////////////

import 'package:flutter/material.dart';
import 'package:redux/redux.dart';
import 'package:flutter_redux/flutter_redux.dart';
import '../reducers/index.dart';
import './intro.dart';
import './profile.dart';

class HomePage extends StatelessWidget {
  final Store<dynamic> store;

  HomePage({Key key, this.store}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return new StoreProvider<dynamic>(
      store: store,
      child: Scaffold(
        appBar: AppBar(
          title: Text('Public Figure'),
        ),
        body: new StoreConnector<dynamic, bool>(
          converter: (store) =>
              rootSelectors(store.state).getLoginSelectors().isLoggedIn(),
          builder: (context, loggedIn) => loggedIn
              ? ProfilePage(store: store)
              : IntroPage(store: store)
        ),
      ),
    );
  }
}
