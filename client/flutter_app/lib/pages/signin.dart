///////////////////////////////////////////////////////
//                    xibbit 1.50                    //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//             Do not remove this notice             //
///////////////////////////////////////////////////////

import 'package:flutter/material.dart';
import 'package:redux/redux.dart';
import 'package:flutter_redux/flutter_redux.dart';
import 'dart:convert';
import 'package:crypto/crypto.dart';
import '../modules/services/xibbitservice.dart';
import '../actions/login.dart';

class SigninPage extends StatefulWidget {
  final Store<dynamic> store;

  SigninPage({Key key, this.store}) : super(key: key);

  @override
  _SigninPage createState() => _SigninPage(store: store);
}

class _SigninPage extends State<SigninPage> {
  final Store<dynamic> store;

  final _formKey = GlobalKey<FormState>();

  _SigninPage({this.store});

  String _msg = '';

  TextEditingController emailController = new TextEditingController();
  FocusNode emailFocus = new FocusNode();

  TextEditingController pwdController = new TextEditingController();
  FocusNode pwdFocus = new FocusNode();

  @override
  Widget build(BuildContext context) {
    // This method is rerun every time setState is called, for instance as done
    // by the _incrementCounter method above.
    //
    // The Flutter framework has been optimized to make rerunning build methods
    // fast, so that you can just rebuild anything that needs updating rather
    // than having to individually change instances of widgets.
    return new StoreProvider<dynamic>(
      store: store,
      child: Scaffold(
        appBar: AppBar(
          // Here we take the value from the SigninPage object that was created by
          // the App.build method, and use it to set our appbar title.
          title: Text('Sign In'),
        ),
        body: Form(
          key: _formKey,
          child: Padding(
            padding: EdgeInsets.all(24.0),
            child: Column(
              children: <Widget>[
                TextFormField(
                  decoration: const InputDecoration(
                    hintText: 'Your email address',
                    labelText: 'Email address',
                  ),
                  controller: emailController,
                  focusNode: emailFocus,
                  validator: (value) {
                    if (value.isEmpty) {
                      return 'Enter your email address.';
                    }
                    return null;
                  },
                ),
                TextFormField(
                  decoration: const InputDecoration(
                    hintText: 'Your password',
                    labelText: 'Password',
                  ),
                  controller: pwdController,
                  focusNode: pwdFocus,
                  validator: (value) {
                    if (value.isEmpty) {
                      return 'Enter your password.';
                    }
                    return null;
                  },
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 16.0),
                  child: RaisedButton(
                    onPressed: () {
                      String email = emailController.text;
                      String pwd = pwdController.text;
                      xibbitService.send({
                        'type': 'login',
                        'to': email,
                        'pwd': sha256
                            .convert(
                                utf8.encode(email + 'xibbit.github.io' + pwd))
                            .toString()
                      }, (event) {
                        if (event['from'] != null) {
                          store.dispatch(login({}));
                          Navigator.of(context).pop();
                        } else {
                          setState(() {
                            _msg = event['e'];
                          });
                        }
                      });
                    },
                    child: Text('Sign In'),
                  ),
                ),
                Text('$_msg'),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
