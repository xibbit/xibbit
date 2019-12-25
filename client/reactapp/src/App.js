///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
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
