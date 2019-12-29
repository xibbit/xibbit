///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
import { Component } from 'inferno';
import { bindActionCreators } from 'redux'
import { connect } from 'inferno-redux'
import '../App.css';
import { model } from '../reducers/app'
import { signIn } from '../actions/signin'
import Pwd from '../modules/pwd';
import xibbitObject from '../modules/xibbitobject';

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
      var path = '/';
      if (event.from) {
//        xibbitObject.setSessionValue('me', event.me);
        this.props.model('loggedIn', true)
        // collect additional user settings if needed
        if (event.i && (event.i.substring(0, 8) === 'collect:')) {
          path = event.i.substring(8).split(':');
          path = '/'+path[0];
        }
        this.context.router.history.push(path);
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
