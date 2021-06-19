// The MIT License (MIT)
//
// xibbit 1.5.1 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @version 1.5.1
// @copyright xibbit 1.5.1 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
var crypto = require('crypto');
var moment = require('moment-timezone');
var mysql = require('mysql');
var Promise = require('bluebird');

var config = require('../config');
var pwd = require('../pwd');
pwd = Promise.promisifyAll(pwd);

function install(callback) {
let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>installation</title>
<style>
.warn {
  background-color: yellow;
}
.error, .php_error {
  background-color: red;
}
</style>
</head>
<body>`;
// get the current time
let now = moment(new Date()).tz(config.time_zone).format('YYYY-MM-DD HH:mm:ss');
let nullDateTime = '1970-01-01 00:00:00';
const daysMap = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
// connect to the database
let link = mysql.createConnection({
  host: config.sql_host,
  user: config.sql_user,
  password: config.sql_pass
});
link = Promise.promisifyAll(link);

let q = '';
let dataInserted = false;
link.connectAsync().catch(e => {
  html += `<div class="error">${config.sql_host} mysqli_connect() had a MySQL error (${e.errno}): ${e.code}</div>\n`;
}).then(() => {
// create the database
q = `CREATE DATABASE \`${config.sql_db}\``;
return link.queryAsync(q);
}).catch(e => {
  if (e.errno == 1007) {
  } else {
    html += `<div class="error">${config.sql_host} CREATE DATABASE had a MySQL error (${e.errno}): ${e.code}</div>\n`;
  }
}).then(() => {
// select the database
q = `USE ${config.sql_db}`;
return link.queryAsync(q);
}).catch(e => {
  html += `<div class="error">${config.sql_host} USE ${config.sql_db} had a MySQL error (${e.errno}): ${e.code}</div>\n`;
}).then(() => {
  return link.queryAsync('SET NAMES \'utf8\'');
}).then(() => {
// create the sockets table
q = 'CREATE TABLE `'+config.sql_prefix+'sockets` ( '
  +'`id` bigint(20) unsigned NOT NULL auto_increment,'
  +'`sid` text,'
  +'`connected` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  +'`touched` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  +'`props` text,'
  +'UNIQUE KEY `id` (`id`));';
return link.queryAsync(q);
}).then(() => {
  html += `<div>${q}</div>\n`;
}, e => {
  if (e.errno == 1050) {
    html += `<div class="warn">Table ${config.sql_prefix}sockets already exists!</div>\n`;
  } else {
    html += `<div class="error">Table ${config.sql_prefix}sockets had a MySQL error (${e.errno}): ${e}</div>\n`;
  }
}).then(e => {
// create the sockets_events table
q = 'CREATE TABLE `'+config.sql_prefix+'sockets_events` ( '
  +'`id` bigint(20) unsigned NOT NULL auto_increment,'
  +'`sid` text,'
  +'`event` mediumtext,'
  +'`touched` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  +'UNIQUE KEY `id` (`id`));';
return link.queryAsync(q);
}).then(() => {
  html += `<div>${q}</div>\n`;
}, e => {
  if (e.errno == 1050) {
    html += `<div class="warn">Table ${config.sql_prefix}sockets_events already exists!</div>\n`;
  } else {
    html += `<div class="error">Table ${config.sql_prefix}sockets_events had a MySQL error (${e.errno}): ${e}</div>\n`;
  }
}).then(() => {
// create the sockets_sessions table
q = 'CREATE TABLE `'+config.sql_prefix+'sockets_sessions` ( '
  +'`id` bigint(20) unsigned NOT NULL auto_increment,'
  +'`socksessid` varchar(25) NOT NULL,'
  +'`connected` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  +'`touched` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  +'`vars` text,'
  +'UNIQUE KEY `id` (`id`),'
  +'UNIQUE KEY `socksessid` (`socksessid`));';
return link.queryAsync(q);
}).then(() => {
  html += `<div>${q}</div>\n`;
}, e => {
  if (e.errno == 1050) {
    html += `<div class="warn">Table ${config.sql_prefix}sockets_sessions already exists!</div>\n`;
  } else {  
    html += `<div class="error">Table ${config.sql_prefix}sockets_sessions had a MySQL error (${e.errno}): ${e}</div>\n`;
  }
}).then(() => {
// add data to the sockets_sessions table
q = `SELECT id FROM ${config.sql_prefix}sockets_sessions`;
return link.queryAsync(q);
}).then(rows => {
  let values = [];
  if (rows.length > 0) {
    html += `<div class="warn">Table ${config.sql_prefix}sockets_sessions already has data!</div>\n`;
  } else {
    values.push(`0, 'global', '${now}', '${now}', '{}'`);
    values = (typeof values_sockets_sessions !== 'undefined')? values_sockets_sessions: values;
  }
  return values;
}).mapSeries(function(value) {
let q = `INSERT INTO ${config.sql_prefix}sockets_sessions VALUES (${value})`;
return link.queryAsync(q).then(() => {
  html += `<div>${q}</div>\n`;
}, e => {
  html += `<div class="error">Table ${config.sql_prefix}sockets_sessions had a MySQL error (${e.errno}): ${e}</div>\n`;
  html += `<div class="error">${q}</div>\n`;
});
}).then(() => {
// create the locks table
q = 'CREATE TABLE `'+config.sql_prefix+'locks` ( '
  +'`name` varchar(20),'
  +'`created` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  +'`json` text,'
  +'UNIQUE KEY `name` (`name`));';
return link.queryAsync(q);
}).then(() => {
  html += `<div>${q}</div>\n`;
}, e => {
  if (e.errno == 1050) {
    html += `<div class="warn">Table ${config.sql_prefix}locks already exists!</div>\n`;
  } else {
    html += `<div class="error">Table ${config.sql_prefix}locks had a MySQL error (${e.errno}): ${e}</div>\n`;
  }
}).then(() => {
// create the at table
q = 'CREATE TABLE `'+config.sql_prefix+'at` ( '
  +'`id` bigint(20) unsigned NOT NULL auto_increment,'
  +'`cmd` text,'
  +'`executed` datetime,' // 2014-12-23 06:00:00 (PST)
  +'`dow` varchar(3),'
  +'`elapsed` text,'
  +'UNIQUE KEY `id` (`id`));';
return link.queryAsync(q);
}).then(() => {
  html += `<div>${q}</div>\n`;
}, e => {
  if (e.errno == 1050) {
    html += `<div class="warn">Table ${config.sql_prefix}at already exists!</div>\n`;
  } else {
    html += `<div class="error">Table ${config.sql_prefix}at had a MySQL error (${e.errno}): ${e}</div>\n`;
  }
}).then(() => {
// add data to the at table
q = `SELECT id FROM ${config.sql_prefix}at`;
return link.queryAsync(q);
}).then(rows => {
  let values = [];
  if (rows.length > 0) {
    html += `<div class="warn">Table ${config.sql_prefix}at already has data!</div>\n`;
  } else {
    values.push(`0, '#min hour day mon dow command', '${now}', '${moment(new Date()).tz(config.time_zone).format('ddd').toUpperCase()}', ''`);
    values = (typeof values_at !== 'undefined')? values_at: values;
  }
  return values;
}).mapSeries(function(value) {
let q = `INSERT INTO ${config.sql_prefix}at VALUES (${value})`;
return link.queryAsync(q).then(() => {
  html += `<div>${q}</div>\n`;
}, e => {
  html += `<div class="error">Table ${config.sql_prefix}at had a MySQL error (${e.errno}): ${e}</div>\n`;
  html += `<div class="error">${q}</div>\n`;
});
}).then(() => {
// create the users table
q = 'CREATE TABLE `'+config.sql_prefix+'users` ( '
  +'`id` bigint(20) unsigned NOT NULL auto_increment,'
  +'`uid` bigint(20) unsigned NOT NULL,'
  +'`username` text,'
  +'`email` text,'
  +'`pwd` text,'
  +'`created` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  +'`connected` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  +'`touched` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  +'`json` text,'
  +'UNIQUE KEY `id` (`id`));';
return link.queryAsync(q);
}).then(() => {
  html += `<div>${q}</div>\n`;
}, e => {
  if (e.errno == 1050) {
    html += `<div class="warn">Table ${config.sql_prefix}users already exists!</div>\n`;
  } else {
    html += `<div class="error">Table ${config.sql_prefix}users had a MySQL error (${e.errno}): ${e}</div>\n`;
  }
}).then(() => {
// add data to the users table
q = `SELECT id FROM ${config.sql_prefix}users`;
return link.queryAsync(q);
}).then(rows => {
  let values = [];
  if (rows.length > 0) {
    html += `<div class="warn">Table ${config.sql_prefix}users already has data!</div>\n`;
  } else {
    values = [0, 1];
  }
  return values;
}).mapSeries(function(value) {
  if (value === 0) {
    return pwd.pwd_hashAsync(crypto.createHash('sha256').update('admin@xibbit.github.io'+'xibbit.github.io'+'passw0rd').digest('hex'), '', '', false).then(hash =>
      "0, 1, 'admin', 'admin@xibbit.github.io', '"+hash+"', '"+now+"', '"+nullDateTime+"', '"+nullDateTime+"', '{\"roles\":[\"admin\"]}'"
    );
  } else if (value === 1) {
    return pwd.pwd_hashAsync(crypto.createHash('sha256').update('user1@xibbit.github.io'+'xibbit.github.io'+'passw0rd').digest('hex'), '', '', false).then(hash =>
      "0, 2, 'user1', 'user1@xibbit.github.io', '"+hash+"', '"+now+"', '"+nullDateTime+"', '"+nullDateTime+"', '{}'"
    );
  }
}).mapSeries(function(value) {
  let q = `INSERT INTO ${config.sql_prefix}users VALUES (${value})`;
  return link.queryAsync(q).then(() => {
    html += `<div>${q}</div>\n`;
  }, e => {
    html += `<div class="error">INSERT INTO: ${config.sql_prefix}users had a MySQL error (${e.errno}): ${e}</div>\n`;
    html += `<div class="error">${q}</div>\n`;
  });
}).then(() => {
// create the instances table
q = 'CREATE TABLE `'+config.sql_prefix+'instances` ( '
  +'`id` bigint(20) unsigned NOT NULL auto_increment,'
  +'`instance` text,'
  +'`connected` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  +'`touched` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  +'`sid` text,'
  +'`uid` bigint(20) unsigned NOT NULL,'
  +'`json` text,'
  +'UNIQUE KEY `id` (`id`));';
link.queryAsync(q).then(() => {
  html += `<div>${q}</div>\n`;
}, e => {
  if (e.errno == 1050) {
    html += `<div class="warn">Table ${config.sql_prefix}instances already exists!</div>\n`;
  } else {
    html += `<div class="error">Table ${config.sql_prefix}instances had a MySQL error (${e.errno}): ${e}</div>\n`;
  }
}).finally(() => {
// close the database
if (link) {
  link.end();
}
html += `
<div>Done.</div>
</body>
</html>`;
callback(null, html);
});
});
}
exports.install = install;
