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
import 'dart:convert';
import 'package:crypto/crypto.dart';
import '../modules/services/xibbitservice.dart';
import '../actions/login.dart';

class SigninPage extends StatefulWidget {
  final Store<dynamic> store;

  const SigninPage({super.key, required this.store});

  @override
  _SigninPage createState() => _SigninPage(store: store);
}

class _SigninPage extends State<SigninPage> {
  final Store<dynamic> store;

  final _formKey = GlobalKey<FormState>();

  _SigninPage({required this.store});

  String _msg = '';

  TextEditingController emailController = TextEditingController();
  FocusNode emailFocus = FocusNode();

  TextEditingController pwdController = TextEditingController();
  FocusNode pwdFocus = FocusNode();

  @override
  Widget build(BuildContext context) {
    // This method is rerun every time setState is called, for instance as done
    // by the _incrementCounter method above.
    //
    // The Flutter framework has been optimized to make rerunning build methods
    // fast, so that you can just rebuild anything that needs updating rather
    // than having to individually change instances of widgets.
    return StoreProvider<dynamic>(
      store: store,
      child: Scaffold(
        appBar: AppBar(
          // Here we take the value from the SigninPage object that was created by
          // the App.build method, and use it to set our appbar title.
          title: const Text('Sign In'),
        ),
        body: Form(
          key: _formKey,
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              children: <Widget>[
                TextFormField(
                  decoration: const InputDecoration(
                    hintText: 'Your email address',
                    labelText: 'Email address',
                  ),
                  enableSuggestions: false,
                  autocorrect: false,
                  controller: emailController,
                  focusNode: emailFocus,
                  validator: (value) {
                    if (value!.isEmpty) {
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
                  obscureText: true,
                  enableSuggestions: false,
                  autocorrect: false,
                  controller: pwdController,
                  focusNode: pwdFocus,
                  validator: (value) {
                    if (value!.isEmpty) {
                      return 'Enter your password.';
                    }
                    return null;
                  },
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 16.0),
                  child: ElevatedButton(
                    onPressed: () {
                      String email = emailController.text;
                      String pwd = pwdController.text;
                      xibbitService.send({
                        'type': 'login',
                        'to': email,
                        'pwd': sha256
                            .convert(
                                utf8.encode('${email}xibbit.github.io$pwd'))
                            .toString()
                      }, (event) {
                        if (event['loggedIn']) {
                          xibbitService.setSessionValue('me', event['me']);
                          store.dispatch(login({}));
                          Navigator.of(context).pop();
                        } else {
                          setState(() {
                            _msg = event['e'];
                          });
                        }
                      });
                    },
                    child: const Text('Sign In'),
                  ),
                ),
                Text(_msg),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
