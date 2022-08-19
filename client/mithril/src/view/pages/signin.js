// The MIT License (MIT)
//
// xibbit 1.5.2 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @version 1.5.2
// @copyright xibbit 1.5.2 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
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
            if (event.loggedIn) {
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
