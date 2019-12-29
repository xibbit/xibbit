///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
import { version, Component } from 'inferno';
import { bindActionCreators } from 'redux'
import { connect } from 'inferno-redux'
import { withRouter, Route, Link } from 'inferno-router';
import Home from './containers/Home';
import SignIn from './containers/SignIn';
import SignUp from './containers/SignUp';
import { signIn } from './actions/signin'
import { model } from './reducers/app'
import Logo from './logo';
import './App.css';
import xibbitObject from './modules/xibbitobject';

class App extends Component {
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
          <div>
            <Route exact path="/" render={() => (<Home />)} />
            <Route exact path="/signin" render={() => (<SignIn />)} />
            <Route exact path="/signup" render={() => (<SignUp />)} />
          </div>
          <Logo width="80" height="80" />
          <p>{`Welcome to Inferno ${version}`}</p>
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
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
