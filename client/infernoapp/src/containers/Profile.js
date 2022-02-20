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
import { Component } from 'inferno';
import '../App.css';
import xibbitObject from '../modules/xibbitobject';
import url_config from '../modules/url_config';

class Profile extends Component {
  constructor(props) {
    super(props);
    xibbitObject.send({
      type: 'user_profile'
    }, event => {
      if (event.i) {
        const username = xibbitObject.getSessionValue('me').username;
        const publicFolder = url_config.server_base[url_config.server_platform]+'/public/images';
        this.profile_image = publicFolder+'/'+username+'.png';
        if (url_config.server_platform === 'django') {
          this.profile_image = '/public/images/'+username+'.png';
        }
        this.setState({
          profile: event.profile,
          profile_image: this.profile_image + '?r=' + Math.floor(Math.random() * 1000)
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
    profile_image: '',
    error: ''
  }

  profile_image = '';

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

  uploadProfileImage = event => {
    const urls = {
      go: '/user/profile/upload_photo',
      node: '/user/profile/upload_photo',
      php: url_config.server_base[url_config.server_platform]+'/app.php', // /user_profile_upload_photo.php
      django: '/upload_photo/image_upload'
    };
    var url = urls[url_config.server_platform];
    xibbitObject.upload(url, {
      type: 'user_profile_upload_photo',
      image: event.target.files[0]
    }, event => {
      this.setState({
        profile_image: this.profile_image + '?r=' + Math.floor(Math.random() * 1000),
        error: event.i || event.e
      })
    });
  }

  render() {
    const { profile, profile_image, error } = this.state;
    return (
      <div className="profile-view">
        <div class="form-control">
          <label>Upload image</label>
          <input className="form-control" type="file" onChange={this.uploadProfileImage} />
        </div>
        <div>
          <img alt="Profile" src={profile_image} />
        </div>
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
