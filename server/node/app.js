///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
var timeZone = 'America/Los_Angeles';
var config = require('./config');
var XibDb = require('./xibdb');
var pfapp = require('./pfapp');

var express = require('express');
var app = express();
var http = require('http').Server(app);
var multer = require('multer');
var uploadStorage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now());
  }
});
var upload = multer({ storage: uploadStorage });
var socketio = require('socket.io')(http, { // comment out to disable Socket.IO
//  path: '/ws'
});
var mysql = require('mysql');
var Promise = require('bluebird');
XibDb = Promise.promisifyAll(XibDb);
pfapp = Promise.promisifyAll(pfapp);

var APP_HOST = 'localhost';
var APP_PORT = 8000;

// connect to the MySQL database
var link = mysql.createConnection({
  host: config.sql_host,
  user: config.sql_user,
  password: config.sql_pass,
  database: config.sql_db
});
link.connect(function(e) {
if (e) {
  console.error(e);
  link = null;
}
// map the MySQL database to arrays and JSON
var xdb = new XibDb({
  'json_column': 'json', // freeform JSON column name
  'sort_column': 'n', // array index column name
  'link_identifier': link,
});
xdb = Promise.promisifyAll(xdb);

// Public Figure specific database
var pf = new pfapp(xdb, config.sql_prefix);
pf = Promise.promisifyAll(pf);

// _events eventing system
var XibbitHub = require('./xibbit')();

// create and configure the XibbitHub object
var hub = new XibbitHub({
  'socketio': socketio,
  'mysql': {
    'link': link,
    'SQL_PREFIX': config.sql_prefix
  },
  'vars': {
    'pf': pf,
    'hacks': config.hacks
  },
  time_zone: config.time_zone
});

// start the xibbit system
hub.start();

//fallback to serving the Node.js folder (url_config.js)
app.use(express.static('../../client/angularjs/app'));

// fallback to serving the Node.js folder (url_config.js)
app.use(express.static('public'));

// start server
http.listen(APP_PORT, APP_HOST, function(){
  console.log(`public figure server started on port ${APP_PORT}...`);
});
});
