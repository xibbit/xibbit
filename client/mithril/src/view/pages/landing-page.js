///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
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
