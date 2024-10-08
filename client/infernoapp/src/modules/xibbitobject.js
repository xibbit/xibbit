// The MIT License (MIT)
//
// xibbit 2.0.0 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @version 2.0.0
// @copyright xibbit 2.0.0 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
import Xibbit from './xibbit';
import url_config from './url_config';

class XibbitService extends Xibbit {

  upload(url, event, callback) {
    if (url_config.server_platform === 'django') {
      // get Cross-Site Request Forgery security token
      this.getUploadForm(url, (html) => {
        var csrfmiddlewaretoken = '';
        var quote = '';
        var attribName = '';
        var pos = html.indexOf('csrfmiddlewaretoken');
        if (pos !== -1) {
          quote = html[pos-1];
          attribName = html.substring(pos-6);
        }
        if (attribName.startsWith('name=') && (['"', "'"].indexOf(quote) >= 0)) {
          attribName = 'value=' + quote;
          pos = html.indexOf(attribName, pos);
        }
        if (pos !== -1) {
          csrfmiddlewaretoken = html.substring(pos + attribName.length);
          pos = csrfmiddlewaretoken.indexOf(quote);
        }
        if (pos !== -1) {
          csrfmiddlewaretoken = csrfmiddlewaretoken.substring(0, pos);
        }
        event.csrfmiddlewaretoken = csrfmiddlewaretoken;
        this.uploadEvent(url, event, function(evt) {
          if (callback) {
            callback(evt);
          }
        });
      });
    } else {
      this.uploadEvent(url, event, function(evt) {
        if (callback) {
          callback(evt);
        }
      });
    }
  }
}

export default new XibbitService({
  preserveSession: true,
  seq: true,
  socketio: {
    eio_protocol: url_config.server_eio_protocol[url_config.server_platform],
    start: true,
    transports: url_config.client_transports,
    min: (url_config.client_transports.indexOf('xio') !== -1)? 3000: null,
    url: url_config.server_platform === 'php'? function() {
      return url_config.server_base.php+'/app.php';
    } : url_config.server_base[url_config.server_platform],
    js_location: url_config.server_base[url_config.server_platform]
  },
  log: url_config.client_debug
});
