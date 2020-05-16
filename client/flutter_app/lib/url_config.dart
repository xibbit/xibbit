///////////////////////////////////////////////////////
//                    xibbit 1.50                    //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//             Do not remove this notice             //
///////////////////////////////////////////////////////
const String client_platform = 'ios'; //'ios','android'
const String client_base = '';
const bool client_debug = true;
const List<String> client_transports = [
  'polling'
]; //'websocket','polling','short','rest','xio'
const String server_platform = 'php';
const String server_host =
    client_platform == 'android' ? '10.0.2.2' : 'localhost';
const Map server_base = {
  'go': 'http://${server_host}:8080',
  'node': 'http://${server_host}:8000',
  'php': 'http://${server_host}/xibbit/server/php'
};
