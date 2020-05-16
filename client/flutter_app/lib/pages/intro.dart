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
import './signup.dart';
import './signin.dart';

class IntroPage extends StatelessWidget {
  final Store<dynamic> store;

  IntroPage({Key key, this.store}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return new StoreProvider<dynamic>(
      store: store,
      child: new StoreConnector<dynamic, String>(
        converter: (store) =>
            rootSelectors(store.state).getEventsSelectors().getMessage(),
        builder: (context, lastEvent) => Center(
          // Center is a layout widget. It takes a single child and positions it
          // in the middle of the parent.
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: <Widget>[
              Text('$lastEvent'),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: <Widget>[
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8.0),
                    child: RaisedButton(
                      onPressed: () {
                        signUp(store, context);
                      },
                      child: Text('Sign Up'),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8.0),
                    child: RaisedButton(
                      onPressed: () {
                        signIn(store, context);
                      },
                      child: Text('Sign In'),
                    ),
                  ),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }

  signUp(store, context) {
    Navigator.of(context).push(new MaterialPageRoute(
        builder: (context) => new SignupPage(store: store)));
  }

  signIn(store, context) {
    Navigator.of(context).push(new MaterialPageRoute(
        builder: (context) => new SigninPage(store: store)));
  }
}
