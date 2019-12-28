///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
import xibbitObject from '../../modules/xibbitobject';
import Pwd from '../../modules/pwd';

export default function() {
    let state = {
        username: '',
        email: '',
        pwd: '',
        error: '',
    };
    const submit = event => {
        const { username, email, pwd} = state;
        event.preventDefault();
        xibbitObject.send({
            type: 'user_create',
            username,
            email,
            pwd: Pwd.encrypt(email, pwd),
        }, function(event) {
            state.error = event.i || event.e;
            m.redraw();
        });
    };
    return {
        view() {
            return (
                <div class="signup-view">
                    <form name="SignUpView.form" onsubmit={submit}>
                        <div class="row">
                            <label class="text-input-label" htmlFor="username">User name</label>
                            <input class="form-control text-input autofocus" type="text" placeholder="User name" name="username" value={ state.username } oninput={ e => { state.username = e.target.value; } } data-ng-pattern="/^[a-z][a-z0-9]{2,11}$/" required="required" autofocus="autofocus" autocomplete="username" data-username-pattern />
                        </div>
                        <div class="row">
                            <label class="text-input-label" htmlFor="email">E-mail</label>
                            <input class="form-control text-input" type="email" placeholder="E-mail" name="email" value={ state.email } oninput={ e => { state.email = e.target.value; } } data-ng-pattern="/^[_a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/" required="required" autocomplete="username" />
                        </div>
                        <div class="row">
                            <label class="text-input-label" htmlFor="pwd">Password</label>
                            <input class="form-control text-input" type="password" placeholder="Password" name="pwd" value={ state.pwd } oninput={ e => { state.pwd = e.target.value; } } data-ng-minlength="1" required="required" autocomplete="current-password" />
                        </div>
                        <div class="row">
                            <button type="submit">Sign Up</button>
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
