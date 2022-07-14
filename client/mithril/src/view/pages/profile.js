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
import xibbitObject from '../../modules/xibbitobject';
import url_config from '../../modules/url_config';

export default function() {
    let state = {
        profile: {
            name: '',
            address: '',
            address2: '',
            city: '',
            state: '',
            zip: '',
        },
        profile_image: '',
        error: '',
    };
    let profile_image = '';
    xibbitObject.send({
        type: 'user_profile',
    }, event => {
        if (event.i) {
            const username = xibbitObject.getSessionValue('me').username;
            const publicFolder = url_config.server_base[url_config.server_platform]+'/public/images';
            profile_image = publicFolder+'/'+username+'.png';
            state.profile = event.profile;
            state.profile_image = profile_image + '?r=' + Math.floor(Math.random() * 1000);
        }
        state.error = event.i || event.e;
        m.redraw();
    });
    const submit = event => {
        const { profile } = state;
        event.preventDefault();
        xibbitObject.send({
            type: 'user_profile_mail_update',
            user: profile,
        }, event => {
            state.error = event.i || event.e;
            m.redraw();
        });
    };
    const uploadProfileImage = event => {
        const urls = {
            go: '/user/profile/upload_photo',
            node: '/user/profile/upload_photo',
            php: url_config.server_base[url_config.server_platform]+'/app.php', // /user_profile_upload_photo.php
        };
        const url = urls[url_config.server_platform];
        xibbitObject.upload(url, {
            type: 'user_profile_upload_photo',
            image: event.target.files[0],
        }, event => {
            state.profile_image = profile_image + '?r=' + Math.floor(Math.random() * 1000);
            state.error = event.i || event.e;
            m.redraw();
        });
    };
    return {        
        view() {
            return (
                <div class="profile-view">
                    <div class="form-control">
                        <label>Upload image</label>
                        <input class="form-control" type="file" onchange={ uploadProfileImage }></input>
                    </div>
                    <div>
                        <img alt="Profile" src={state.profile_image} />
                    </div>
                    <form name="profile" onsubmit={submit}>
                        <div class="form-control">
                            <div>Name</div>
                            <input type="text" value={ state.profile.name } oninput={ e => { state.profile.name = e.target.value; } } placeholder="Name" />
                        </div>
                        <div class="form-control">
                            <div>Address</div>
                            <input type="text" value={ state.profile.address } oninput={ e => { state.profile.address = e.target.value; } } placeholder="Address" />
                            <input type="text" value={ state.profile.address2 } oninput={ e => { state.profile.address2 = e.target.value; } } />
                        </div>
                        <div class="form-control">
                            <div>City</div>
                            <input type="text" value={ state.profile.city } oninput={ e => { state.profile.city = e.target.value; } } placeholder="City" />
                        </div>
                        <div class="form-control">
                            <div class="row">
                                <div class="form-control">
                                    <div>State</div>
                                    <input type="text" value={ state.profile.state } oninput={ e => { state.profile.state = e.target.value; } } placeholder="State" />
                                </div>
                                <div class="form-control">
                                    <div>Postal</div>
                                    <input type="text" value={ state.profile.zip } oninput={ e => { state.profile.state = e.target.zip; } } placeholder="Postal code" />
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <button type="submit" data-ng-disabled="ProfileView.form.$invalid">Update</button>
                        </div>
                    </form>
                    <div class="row">
                        {state.error}
                    </div>
                </div>
            );
        },
    };
}
