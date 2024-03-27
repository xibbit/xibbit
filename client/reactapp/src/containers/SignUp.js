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
import React from 'react';
import '../App.css';
import Pwd from '../modules/pwd';
import xibbitObject from '../modules/xibbitobject';

class SignUp extends React.Component {
  state = {
    username: '',
    email: '',
    pwd: '',
    error: ''
  }

  onUsernameChange = event => {
    this.setState({
      username: event.target.value
    });
  }

  onEmailChange = event => {
    this.setState({
      email: event.target.value
    });
  }

  onPwdChange = event => {
    this.setState({
      pwd: event.target.value
    });
  }

  submit = event => {
    const { username, email, pwd } = this.props;
    event.preventDefault();
    xibbitObject.send({
      type: 'user_create',
      username,
      email,
      pwd: Pwd.encrypt(email, pwd)
    }, function(event) {
      this.setState({
        error: event.i || event.e
      });
    });
  }

  render() {
    const { username, email, pwd, error } = this.state;
    return (
      <div className="signup-view">
        <form name="SignUpView.form" onSubmit={this.submit}>
          <div className="row">
            <label className="text-input-label" htmlFor="username">User name</label>
            <input className="form-control text-input autoFocus" type="text" placeholder="User name" name="username" value={username} onChange={this.onUsernameChange} data-ng-pattern="/^[a-z][a-z0-9]{2,11}$/" required="required" autoFocus="autofocus" autoComplete="username" data-username-pattern />
          </div>
          <div className="row">
            <label className="text-input-label" htmlFor="email">E-mail</label>
            <input className="form-control text-input" type="email" placeholder="E-mail" name="email" value={email} onChange={this.onEmailChange} data-ng-pattern="/^[_a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/" required="required" autoComplete="username" />
          </div>
          <div className="row">
            <label className="text-input-label" htmlFor="pwd">Password</label>
            <input className="form-control text-input" type="password" placeholder="Password" name="pwd" value={pwd} onChange={this.onPwdChange} data-ng-minlength="1" required="required" autoComplete="current-password" />
          </div>
          <div className="row">
            <button type="submit">Sign Up</button>
          </div>
        </form>
        <div className="row">
        {error}
        </div>
      </div>
    );
  }
}

export default SignUp;
