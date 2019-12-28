///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
import xibbitObject from '../../../modules/xibbitobject';

export default function() {
    let state = {
        action: '',
        user: '',
    };
    xibbitObject.on('notify_laughs', event => {
        state = { action: event.type, user: event.from };
        m.redraw();
    });
    xibbitObject.on('notify_jumps', event => {
        state = { action: event.type, user: event.from };
        m.redraw();
    });
    return {
        view: function() {
            const {action, user} = state;
            const msg = ({
                'notify_laughs': `${user} laughs out loud`,
                'notify_jumps': `${user} jumps up and down`,
            })[action];
            return m('main', [
                m('p', {
                    class: 'title',
                }, msg),
            ]);
        },
    };
}