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
import { Component } from 'inferno';
import '../App.css';
import xibbitObject from '../modules/xibbitobject';

class Intro extends Component {
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
