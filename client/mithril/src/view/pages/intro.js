///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
export default function() {
    var msg = 'this is a msg';
    return {        
        view() {
            return m('div', {
                class: 'intro-view',
            }, [
                m('div', {
                    class: 'row',
                    style: 'color: skyblue'
                }, msg),
            ]);
        },
    };
}
