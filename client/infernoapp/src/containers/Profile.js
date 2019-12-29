///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
import { Component } from 'inferno';
import '../App.css';
import xibbitObject from '../modules/xibbitobject';

class Profile extends Component {
  constructor(props) {
    super(props);
    xibbitObject.send({
      type: 'user_profile'
    }, event => {
      if (event.i) {
        this.setState({
          profile: event.profile
        })
      }
      this.setState({
        error: event.i || event.e
      })
    });
  }

  state = {
    profile: {
      name: '',
      address: '',
      address2: '',
      city: '',
      state: '',
      zip: ''
    },
    error: ''
  }

  onNameChange = event => {
    this.setState({
      profile: { ...this.state.profile, name: event.target.value }
    });
  }

  onAddressChange = event => {
    this.setState({
      profile: { ...this.state.profile, address: event.target.value }
    });
  }

  onAddress2Change = event => {
    this.setState({
      profile: { ...this.state.profile, address2: event.target.value }
    });
  }

  onCityChange = event => {
    this.setState({
      profile: { ...this.state.profile, city: event.target.value }
    });
  }

  onStateChange = event => {
    this.setState({
      profile: { ...this.state.profile, state: event.target.value }
    });
  }

  onZipChange = event => {
    this.setState({
      profile: { ...this.state.profile, zip: event.target.value }
    });
  }

  submit = event => {
    const { profile } = this.state;
    event.preventDefault();
    xibbitObject.send({
      type: 'user_profile_mail_update',
      user: profile
    }, event => {
      this.setState({
        error: event.i || event.e
      });
    });
  }

  render() {
    const { profile, error } = this.state;
    return (
      <div className="profile-view">
        <form name="ProfileView.form" onSubmit={this.submit}>
          <div className="form-control">
            <label>Name</label>
            <input type="text" value={profile.name} onInput={this.onNameChange} placeholder="Name" />
          </div>
          <div className="form-control">
            <label>Address</label>
            <input type="text" value={profile.address} onInput={this.onAddressChange} placeholder="Address" />
          </div>
          <div className="form-control">
            <input type="text" value={profile.address2} onInput={this.onAddress2Change} />
          </div>
          <div className="form-control">
            <label>City</label>
            <input type="text" value={profile.city} onInput={this.onCityChange} placeholder="City" />
          </div>
          <div className="row">
            <div className="form-control">
              <label>State</label>
              <input type="text" value={profile.state} onInput={this.onStateChange} placeholder="State" />
            </div>
            <div className="form-control">
              <label>Postal</label>
              <input type="text" value={profile.zip} onInput={this.onZipChange} placeholder="Postal code" />
            </div>
          </div>
          <div className="row">
            <button type="submit" data-ng-disabled="ProfileView.form.$invalid">Update</button>
          </div>
        </form>
        <div className="row">
        {error}
        </div>
      </div>
    );
  }
}

export default Profile;
