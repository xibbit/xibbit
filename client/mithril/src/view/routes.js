// The MIT License (MIT)
//
// xibbit 1.50 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @copyright xibbit 1.50 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
import PageLayout from './components/page-layout';

// Individual pages
import IndexPage from './pages/landing-page';
import Splash from './components/splash-loader/index';
import MaintenancePage from './components/maintenance-layout/index';
import SignIn from './pages/signin';
import SignUp from './pages/signup';

function loadSpinner() {
    let $splashDiv = document.getElementById('splash');
    if (!$splashDiv) {
        $splashDiv = document.createElement('div');
        $splashDiv.setAttribute('id', 'splash');
        const $root = document.body.querySelector('#root');
        $root.appendChild($splashDiv);
    }
    m.render($splashDiv, m(Splash));
}
function hideSpinner() {
    let $splashDiv = document.getElementById('splash');
    if ($splashDiv) {
        m.render($splashDiv, null);
    }
}

const Routes = {
    '/splash': {
        render: function() {
            return m(PageLayout, m(Splash));
        },
    },
    '/index': {
        onmatch() {
            // Show Loader until the promise has been resolved or rejected.
            loadSpinner();
            return new Promise((resolve /*, reject*/) => {
                //Fetch all necessary data here
                setTimeout(function() {
                    //m.render($root, null);
                    resolve();
                }, 2000);
            }).catch((/* e */) => {
                // In case of server error we can show the maintenance page.
                return MaintenancePage;
            });
        },
        render(vnode) {
            hideSpinner();
            if (typeof vnode.tag === 'function') {
                //If onmatch returns a component or a promise that resolves to a component, comes here.
                return vnode;
            }
            return m(PageLayout, m(IndexPage));
        },
    },
    '/signin': {
        render: function() {
            return m(PageLayout, m(SignIn));
        },
    },
    '/signup': {
        render: function() {
            return m(PageLayout, m(SignUp));
        },
    },
};

const DefaultRoute = '/index';

export { Routes, DefaultRoute };
