///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
import xibbitObject from '../../modules/xibbitobject';

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
        error: '',
    };
    xibbitObject.send({
        type: 'user_profile',
    }, event => {
        if (event.i) {
            state.profile = event.profile;
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
    return {        
        view() {
            return (
                <div class="profile-view">
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
