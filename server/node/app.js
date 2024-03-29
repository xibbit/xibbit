// The MIT License (MIT)
//
// xibbit 1.5.3 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @version 1.5.3
// @copyright xibbit 1.5.3 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
var timeZone = 'America/Los_Angeles';
var config = require('./config');
var XibDb = require('./xibdb');
var pfapp = require('./pfapp');
var install = require('./misc/install');

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
    'useInstances': true,
    'hacks': config.hacks
  },
  time_zone: config.time_zone
});

// start the xibbit system
hub.start();

// serve url_config.js and socket.io from Node.js as top priorities
app.use("/url_config.js", express.static(__dirname + '/public/url_config.js'));
app.use("/socket.io", express.static(__dirname + '/public/socket.io'));
app.use("/socket.io.js.map", express.static(__dirname + '/public/socket.io/socket.io.js.map'));
app.use('/install', (req, res) => install.install((e, html) => res.send(html)))

// serve the client folder and ignore their url_config.js and socket.io versions
const clientFolders = {
  node: '.',
  react: '../../client/reactapp/build',
  angularjs: '../../client/angularjs/app',
  inferno: '../../client/infernoapp/build',
  mithril: '../../client/mithril/dist'
};
const clientFolder = clientFolders.angularjs;
app.use(express.static(clientFolder));

// start server
http.listen(APP_PORT, APP_HOST, function(){
  console.log(`public figure server started on port ${APP_PORT}...`);
});
});
