// The MIT License (MIT)
//
// xibbit 1.5.2 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @version 1.5.2
// @copyright xibbit 1.5.2 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
import 'package:flutter/material.dart';
import 'package:redux/redux.dart';
import 'package:flutter_redux/flutter_redux.dart';
import '../modules/services/xibbitservice.dart';
import '../actions/login.dart';
import '../actions/profile.dart';
import '../reducers/index.dart';

class ProfilePage extends StatefulWidget {
  final Store<dynamic> store;

  ProfilePage({Key? key, required this.store}) : super(key: key);

  @override
  _ProfilePage createState() => _ProfilePage(store: store);
}

class _ProfilePage extends State<ProfilePage> {
  final Store<dynamic> store;

  final _formKey = GlobalKey<FormState>();

  String _msg = '';

  _ProfilePage({required this.store}) {
    nameController = TextEditingController(
        text: rootSelectors(store.state).getProfileSelectors().getName());
    xibbitService.send({'type': 'user_profile'}, (event) {
      if (event['i'] != null) {
        store.dispatch(setprofile({'profile': event['profile']}));
      }
    });
  }

  late TextEditingController nameController;
  FocusNode nameFocus = new FocusNode();

  TextEditingController addressController = new TextEditingController();
  FocusNode addressFocus = new FocusNode();

  TextEditingController address2Controller = new TextEditingController();
  FocusNode address2Focus = new FocusNode();

  TextEditingController cityController = new TextEditingController();
  FocusNode cityFocus = new FocusNode();

  TextEditingController stateController = new TextEditingController();
  FocusNode stateFocus = new FocusNode();

  TextEditingController postalController = new TextEditingController();
  FocusNode postalFocus = new FocusNode();

  @override
  Widget build(BuildContext context) {
    return new StoreProvider<dynamic>(
      store: store,
      child: Form(
        key: _formKey,
        child: Padding(
          padding: EdgeInsets.all(24.0),
          child: Column(
            children: <Widget>[
              new StoreConnector<dynamic, String>(
                  converter: (store) => rootSelectors(store.state)
                      .getProfileSelectors()
                      .getName(),
                  builder: (context, name) => TextFormField(
                        decoration: const InputDecoration(
                          hintText: 'Your name',
                          labelText: 'Name',
                        ),
                        controller: nameController,
                        focusNode: nameFocus,
                        validator: (value) {
                          if (value!.isEmpty) {
                            return 'Enter your name.';
                          }
                          return null;
                        },
                      ),
                  onWillChange: (prev, change) {
                    nameController.text = rootSelectors(store.state)
                        .getProfileSelectors()
                        .getName();
                  }),
              new StoreConnector<dynamic, String>(
                  converter: (store) => rootSelectors(store.state)
                      .getProfileSelectors()
                      .getAddress(),
                  builder: (context, address) => TextFormField(
                        decoration: const InputDecoration(
                          hintText: 'Your street address',
                          labelText: 'Address',
                        ),
                        controller: addressController,
                        focusNode: addressFocus,
                        validator: (value) {
                          if (value!.isEmpty) {
                            return 'Enter your address.';
                          }
                          return null;
                        },
                      ),
                  onWillChange: (prev, change) {
                    addressController.text = rootSelectors(store.state)
                        .getProfileSelectors()
                        .getAddress();
                  }),
              new StoreConnector<dynamic, String>(
                  converter: (store) => rootSelectors(store.state)
                      .getProfileSelectors()
                      .getAddress2(),
                  builder: (context, address2) => TextFormField(
                        decoration: const InputDecoration(
                          hintText: 'Addtional street address',
                        ),
                        controller: address2Controller,
                        focusNode: address2Focus,
                        validator: (value) {
                          return null;
                        },
                      ),
                  onWillChange: (prev, change) {
                    address2Controller.text = rootSelectors(store.state)
                        .getProfileSelectors()
                        .getAddress2();
                  }),
              new StoreConnector<dynamic, String>(
                  converter: (store) => rootSelectors(store.state)
                      .getProfileSelectors()
                      .getCity(),
                  builder: (context, city) => TextFormField(
                        decoration: const InputDecoration(
                          hintText: 'Your city',
                          labelText: 'City',
                        ),
                        controller: cityController,
                        focusNode: cityFocus,
                        validator: (value) {
                          if (value!.isEmpty) {
                            return 'Enter your city.';
                          }
                          return null;
                        },
                      ),
                  onWillChange: (prev, change) {
                    cityController.text = rootSelectors(store.state)
                        .getProfileSelectors()
                        .getCity();
                  }),
              Row(children: <Widget>[
                Expanded(
                  child: new StoreConnector<dynamic, String>(
                      converter: (store) => rootSelectors(store.state)
                          .getProfileSelectors()
                          .getState(),
                      builder: (context, state) => TextFormField(
                            decoration: const InputDecoration(
                              hintText: 'Your state',
                              labelText: 'State',
                            ),
                            controller: stateController,
                            focusNode: stateFocus,
                            validator: (value) {
                              if (value!.isEmpty) {
                                return 'Enter your state.';
                              }
                              return null;
                            },
                          ),
                      onWillChange: (prev, change) {
                        stateController.text = rootSelectors(store.state)
                            .getProfileSelectors()
                            .getState();
                      }),
                ),
                Expanded(
                  child: new StoreConnector<dynamic, String>(
                      converter: (store) => rootSelectors(store.state)
                          .getProfileSelectors()
                          .getZip(),
                      builder: (context, zip) => TextFormField(
                            decoration: const InputDecoration(
                              hintText: 'Your postal code',
                              labelText: 'Postal Code',
                            ),
                            controller: postalController,
                            focusNode: postalFocus,
                            validator: (value) {
                              if (value!.isEmpty) {
                                return 'Enter your postal code.';
                              }
                              return null;
                            },
                          ),
                      onWillChange: (prev, change) {
                        postalController.text = rootSelectors(store.state)
                            .getProfileSelectors()
                            .getZip();
                      }),
                ),
              ]),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 16.0),
                child: ElevatedButton(
                  onPressed: () {
                    if (_formKey.currentState!.validate()) {
                      String name = nameController.text;
                      String address = addressController.text;
                      String address2 = address2Controller.text;
                      String city = cityController.text;
                      String state = stateController.text;
                      String zip = postalController.text;
                      Map<String, String> user = {
                        'name': name,
                        'address': address,
                        'address2': address2,
                        'city': city,
                        'state': state,
                        'zip': zip
                      };
                      xibbitService.send({
                        'type': 'user_profile_mail_update',
                        'user': user,
                      }, (event) {
                        if (event.containsKey('i')) {
                          setState(() {
                            _msg = 'Saved.';
                          });
                        } else {
                          setState(() {
                            _msg = event['e'];
                          });
                        }
                      });
                    }
                  },
                  child: Text('Save'),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 16.0),
                child: ElevatedButton(
                  onPressed: () {
                    xibbitService.send({
                      'type': 'logout',
                    }, (event) {
                      if (event['i'] != null) {
                        store.dispatch(logout({}));
                      }
                    });
                  },
                  child: Text('Sign out'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
