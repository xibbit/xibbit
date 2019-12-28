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
        email: '',
        pwd: '',
        error: '',
    };
    const submit = event => {
        event.preventDefault();
        xibbitObject.send({
            type: 'login',
            to: state.email,
            pwd: Pwd.encrypt(state.email, state.pwd),
        }, event => {
            var path = '/';
            if (event.i && event.from) {
                xibbitObject.loggedIn = true;
                xibbitObject.addSessionValue('loggedIn', true);
                xibbitObject.addSessionValue('me', event.me);
                // collect additional user settings if needed
                if (event.i && (event.i.substring(0, 8) === 'collect:')) {
                    path = event.i.substring(8).split(':');
                    path = '/'+path[0];
                }
                path = '#!' + path;
                document.location = path;
            } else {
                state.error = event.i || event.e;
                m.redraw();
            }
        });
    };
    return {
        view() {
            return (
                <div class="signin-view">
                    <form name="signin" onsubmit={submit}>
                        <div class="row">
                            <label class="text-input-label" for="email">E-mail</label>
                            <input class="form-control text-input" type="email" placeholder="E-mail" name="email" value={ state.email } oninput={ e => { state.email = e.target.value; } } data-ng-pattern="/^[_a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/" required="required" autocomplete="username" />
                        </div>
                        <div class="row">
                            <label class="text-input-label" for="pwd">Password</label>
                            <input class="form-control text-input" type="password" placeholder="Password" name="pwd" value={ state.pwd } oninput={ e => { state.pwd = e.target.value; } } data-ng-minlength="1" required="required" autocomplete="current-password" />
                        </div>
                        <div class="row">
                            <button type="submit">Sign In</button>
                        </div>
                    </form>
                    {m('.row', state.error)}
                </div>
            );
        },
    };
}
