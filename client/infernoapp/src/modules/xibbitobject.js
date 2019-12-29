///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
import Xibbit from './xibbit';
import url_config from './url_config';

export default new Xibbit({
  preserveSession: true,
  seq: true,
  socketio: {
    start: true,
    transports: url_config.client_transports,
    min: (url_config.client_transports.indexOf('xio') !== -1)? 3000: null,
    url: url_config.server_platform === 'php'? function() {
      return url_config.server_base.php+'/app.php';
    } : url_config.server_base[url_config.server_platform]
  },
  log: url_config.client_debug
});
