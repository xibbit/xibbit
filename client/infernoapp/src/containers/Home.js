///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
import { Component } from 'inferno';
import { connect } from 'inferno-redux'
import Profile from './Profile';
import Intro from './Intro';

class Home extends Component {
  render() {
    const {signedIn} = this.props;
    return (
      <div className="home-view">
        { signedIn ? <Profile /> : <Intro /> }
      </div>
    );
  }
}

const mapStateToProps = state => ({
  signedIn: state.app.loggedIn
})

export default connect(
  mapStateToProps
)(Home)
