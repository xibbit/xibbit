// The MIT License (MIT)
//
// xibbit 1.5.3 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @version 1.5.3
// @copyright xibbit 1.5.3 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
import React from 'react';
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { withRouter, Route, Switch } from 'react-router'
import { Link } from 'react-router-dom'
import Home from './containers/Home';
import SignIn from './containers/SignIn';
import SignUp from './containers/SignUp';
import { signIn } from './actions/signin'
import { model } from './reducers/app'
import xibbitObject from './modules/xibbitobject';
import './modules/hello';
import logo from './logo.svg';
import './App.css';

class App extends React.Component {
  signOut = () => {
    xibbitObject.send({
      type: 'logout'
    }, event => {
      if (event.i) {
        this.props.model('loggedIn', false)
      }
    });
  }

  render() {
    const {signedIn} = this.props;
    return (
    <div className="App">
      <header className="App-header">
        <ul className="menu">
          <li><Link to="/">Home</Link></li>
          { !signedIn ? <li><Link to="/signin">Sign In</Link></li> : null }
          { !signedIn ? <li><Link to="/signup">Sign Up</Link></li> : null }
          { signedIn ? <li><Link to="/" onClick={this.signOut}>Sign Out</Link></li> : null }
        </ul>
        <hr style={{width: '100%'}} />
        <Switch>
          <Route exact path="/index.html" render={() => (<Home />)} />
          <Route exact path="/" render={() => (<Home />)} />
          <Route exact path="/signin" render={() => (<SignIn />)} />
          <Route exact path="/signup" render={() => (<SignUp />)} />" +
        </Switch>
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
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

export default withRouter(connect(
  mapStateToProps,
  mapDispatchToProps
)(App))
