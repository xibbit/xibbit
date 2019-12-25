///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
import React from 'react';
import '../App.css';
import xibbitObject from '../modules/xibbitobject';

class Intro extends React.Component {
  constructor(props) {
    super(props);
    this.state = { action: '', user: '' };
  }

  componentDidMount() {
    xibbitObject.on('notify_laughs', event => {
      this.setState({
        action: event.type,
        user: event.from
      });
    });
    xibbitObject.on('notify_jumps', event => {
      this.setState({
        action: event.type,
        user: event.from
      });
    });
  }

  componentWillUnmount() {
    xibbitObject.off('notify_laughs');
    xibbitObject.off('notify_jumps');
  }

  render() {
  const {action, user} = this.state;
  const msg = ({
    'notify_laughs': `${user} laughs out loud`,
    'notify_jumps': `${user} jumps up and down`
  })[action];
  return (
    <div className="intro-view">
      <div className="row" style={{color: 'skyblue'}}>
      {msg}
      </div>
    </div>
  );
  }
}

export default Intro;
