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
import 'package:flutter/material.dart';
import 'package:redux/redux.dart';
import 'package:flutter_redux/flutter_redux.dart';
import '../reducers/index.dart';
import './signup.dart';
import './signin.dart';

class IntroPage extends StatelessWidget {
  final Store<dynamic> store;

  const IntroPage({super.key, required this.store});

  @override
  Widget build(BuildContext context) {
    return StoreProvider<dynamic>(
      store: store,
      child: StoreConnector<dynamic, String>(
        converter: (store) =>
            rootSelectors(store.state).getEventsSelectors().getMessage(),
        builder: (context, lastEvent) => Center(
          // Center is a layout widget. It takes a single child and positions it
          // in the middle of the parent.
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: <Widget>[
              Text(lastEvent),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: <Widget>[
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8.0),
                    child: ElevatedButton(
                      onPressed: () {
                        signUp(store, context);
                      },
                      child: const Text('Sign Up'),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8.0),
                    child: ElevatedButton(
                      onPressed: () {
                        signIn(store, context);
                      },
                      child: const Text('Sign In'),
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
    Navigator.of(context).push(MaterialPageRoute(
        builder: (context) => SignupPage(store: store)));
  }

  signIn(store, context) {
    Navigator.of(context).push(MaterialPageRoute(
        builder: (context) => SigninPage(store: store)));
  }
}
