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
import { Component } from 'inferno';
import { bindActionCreators } from 'redux'
import { connect } from 'inferno-redux'
import '../App.css';
import { model } from '../reducers/app'
import { signIn } from '../actions/signin'
import Pwd from '../modules/pwd';
import xibbitObject from '../modules/xibbitobject';
import url_config from '../modules/url_config';

// if the 'basename' attribute on BrowserRouter worked, the 'basename'
// variable should not be needed at all in this file
const basename = url_config.server_platform === 'django'? '/static': '';

class SignIn extends Component {
  state = {
    email: '',
    pwd: '',
    error: ''
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
    const { email, pwd } = this.state;
    event.preventDefault();
    xibbitObject.send({
      type: 'login',
      to: email,
      pwd: Pwd.encrypt(email, pwd)
    }, event => {
      var path = `${basename}/`;
      if (event.loggedIn) {
        xibbitObject.addSessionValue('me', event.me);
        this.props.model('loggedIn', true)
        // collect additional user settings if needed
        if (event.i && (event.i.substring(0, 8) === 'collect:')) {
          path = event.i.substring(8).split(':');
          path = '/'+path[0];
        }
        this.context.router.history.push(path);
        xibbitObject.addSessionValue('reduxState', {'loggedIn': true});
      } else {
        this.setState({
          error: event.i || event.e
        });
      }
    });
  }

  render() {
    const { email, pwd, error } = this.state;
    return (
      <div className="signin-view">
        <form name="SignInView.form" onSubmit={this.submit}>
          <div className="row">
            <label className="text-input-label" htmlFor="email">E-mail</label>
            <input className="form-control text-input" type="email" placeholder="E-mail" name="email" value={email} onInput={this.onEmailChange} data-ng-pattern="/^[_a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/" required="required" autoComplete="username" />
          </div>
          <div className="row">
            <label className="text-input-label" htmlFor="pwd">Password</label>
            <input className="form-control text-input" type="password" placeholder="Password" name="pwd" value={pwd} onInput={this.onPwdChange} data-ng-minlength="1" required="required" autoComplete="current-password" />
          </div>
          <div className="row">
            <button type="submit">Sign In</button>
          </div>
        </form>
        <div className="row">
        {error}
        </div>
      </div>
  );
  }
}

const mapStateToProps = state => ({
  signedIn: state.app.loggedIn
})

const mapDispatchToProps = dispatch => bindActionCreators({
  signIn,
  model
}, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SignIn)
