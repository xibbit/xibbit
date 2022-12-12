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
import SampleComponent from '../components/sample-component';
import NotifyComponent from '../components/notify-component';
import xibbitObject from '../../modules/xibbitobject';
import Home from './home';

export default function() {
    let signedIn = xibbitObject.getSessionValue('loggedIn');
    const signOut = () => {
        xibbitObject.send({
            type: 'logout',
        }, event => {
            if (event.i) {
                signedIn = false;
                xibbitObject.loggedIn = false;
                xibbitObject.addSessionValue('loggedIn', false);
                m.redraw();
            }
        });
    };
    return {        
        view() {
            /* return m('div', [
                m('h2', 'Congratulations, you made it!'),
                m('p', 'You\'ve spun up your very first Mithril app :-)'),
                m(SampleComponent),
            ]); */
            return (
                <div>
                    <ul className="menu">
                        <li><a href="#!/index">Home</a></li>
                        { !signedIn ? <li><a href="#!/signin">Sign In</a></li> : null }
                        { !signedIn ? <li><a href="#!/signup">Sign Up</a></li> : null }
                        { signedIn ? <li><a href="#!/index" onclick={signOut}>Sign Out</a></li> : null }
                    </ul>
                    <hr style={{width: '100%'}} />
                    <Home />
                    <hr style={{width: '100%'}} />
                    <NotifyComponent />
                    <h2>Congratulations, you made it!</h2>
                    <p>You've spun up your very first Mithril app :-)</p>
                    <SampleComponent />
                </div>
            );
        },
    };
}
