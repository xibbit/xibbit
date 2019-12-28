///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
var client_base = '';
var client_debug = true;
var client_transports = [
  'polling'
]; //'websocket','polling','short','rest','xio'
var server_platform = 'php';
var server_base = {
  go: '',
  node: '',
  php: '/php'
};

module.exports = {
  client_base,
  client_debug,
  client_transports,
  server_platform,
  server_base
};
