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
.error {
  background-color: red;
}
</style>
</head>
<body>`;
// get the current time
let now = moment(new Date()).tz(config.time_zone).format('YYYY-MM-DD HH:mm:ss');
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
  html += `<div class="error">${config.sql_host} had a MySQL error (${e.errno}): ${e.code}</div>\n`;
}).then(() => {
// create the database
q = `CREATE DATABASE \`${config.sql_db}\``;
return link.queryAsync(q);
}).catch(e => {
  if (e.errno == 1007) {
  } else {
    html += `<div class="error">${config.sql_host} had a MySQL error (${e.errno}): ${e.code}</div>\n`;
  }
}).then(() => {
// select the database
q = `USE ${config.sql_db}`;
return link.queryAsync(q);
}).catch(e => {
  html += `<div class="error">${config.sql_host} had a MySQL error (${e.errno}): ${e.code}</div>\n`;
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
    html += `<div class="error">${config.sql_host} had a MySQL error (${e.errno}): ${e.code}</div>\n`;
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
    html += `<div class="error">${config.sql_host} had a MySQL error (${e.errno}): ${e.code}</div>\n`;
  }
}).then(() => {
// create the sockets_sessions table
q = 'CREATE TABLE `'+config.sql_prefix+'sockets_sessions` ( '
  +'`id` bigint(20) unsigned NOT NULL auto_increment,'
  +'`socksessid` text,'
  +'`connected` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  +'`touched` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  +'`vars` text,'
  +'UNIQUE KEY `id` (`id`));';
return link.queryAsync(q);
}).then(() => {
  html += `<div>${q}</div>\n`;
}, e => {
  if (e.errno == 1050) {
    html += `<div class="warn">Table ${config.sql_prefix}sockets_sessions already exists!</div>\n`;
  } else {  
    html += `<div class="error">${config.sql_host} had a MySQL error (${e.errno}): ${e.code}</div>\n`;
  }
}).then(() => {
// create the events table
q = 'CREATE TABLE `'+config.sql_prefix+'events` ( '
  +'`id` bigint(20) unsigned NOT NULL auto_increment,'
  +'`to` text,'
  +'`from` text,'
  +'`type` text,'
  +'`json` text,'
  +'UNIQUE KEY `id` (`id`));';
return link.queryAsync(q);
}).then(() => {
  html += `<div>${q}</div>\n`;
}, e => {
  if (e.errno == 1050) {
    html += `<div class="warn">Table ${config.sql_prefix}events already exists!</div>\n`;
  } else {
    html += `<div class="error">${config.sql_host} had a MySQL error (${e.errno}): ${e.code}</div>\n`;
  }
}).then(() => {
// create the locks table
q = 'CREATE TABLE `'+config.sql_prefix+'locks` ( '
  +'`name` varchar(20),'
  +'`dt` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  +'`json` text,'
  +'UNIQUE KEY `name` (`name`));';
return link.queryAsync(q);
}).then(() => {
  html += `<div>${q}</div>\n`;
}, e => {
  if (e.errno == 1050) {
    html += `<div class="warn">Table ${config.sql_prefix}locks already exists!</div>\n`;
  } else {
    html += `<div class="error">${config.sql_host} had a MySQL error (${e.errno}): ${e.code}</div>\n`;
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
    html += `<div class="error">${config.sql_host} had a MySQL error (${e.errno}): ${e.code}</div>\n`;
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
    values.push(`0, '#min hour day mon dow command', '${now}', '${daysMap[intval(date('w'))]}', ''`);
    values = (typeof values_at !== 'undefined')? values_at: values;
  }
  return values;
}).mapSeries(function(value) {
let q = `INSERT INTO ${config.sql_prefix}at VALUES (${value})`;
return link.queryAsync(q).then(() => {
  html += `<div>${q}</div>\n`;
}, e => {
  html += `<div class="error">${config.sql_host} had a MySQL error (${e.errno}): ${e.code}</div>\n`;
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
    html += `<div class="error">${config.sql_host} had a MySQL error (${e.errno}): ${e.code}</div>\n`;
  }
});
}).then(() => {
// create the users table
q = 'CREATE TABLE `'+config.sql_prefix+'users` ( '
  +'`id` bigint(20) unsigned NOT NULL auto_increment,'
  +'`uid` bigint(20) unsigned NOT NULL,'
  +'`username` text,'
  +'`email` text,'
  +'`pwd` text,'
  +'`dt` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  +'`json` text,'
  +'UNIQUE KEY `id` (`id`));';
return link.queryAsync(q);
}).then(() => {
  html += `<div>${q}</div>\n`;
}, e => {
  if (e.errno == 1050) {
    html += `<div class="warn">Table ${config.sql_prefix}users already exists!</div>\n`;
  } else {
    html += `<div class="error">${config.sql_host} had a MySQL error (${e.errno}): ${e.code}</div>\n`;
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
    values.push("0, 1, 'admin', 'admin@xibbit.github.io', 2, '{}', 0");
    values.push("0, 2, 'user1', 'user1@xibbit.github.io', 1, '{}', 1");
    values = (typeof values_users !== 'undefined')? values_users: values;
  }
  return values;
}).mapSeries(function(value) {
  let q = `INSERT INTO ${config.sql_prefix}users VALUES (${value})`;
  return link.queryAsync(q).then(() => {
    html += `<div>${q}</div>\n`;
  }, e => {
    html += `<div class="error">${config.sql_host} had a MySQL error (${e.errno}): ${e.code}</div>\n`;
    html += `<div class="error">${q}</div>\n`;
  });
}).finally(() => {
// close the database
if (link) {
  link.end();
}
html += `
</body>
</html>`;
callback(null, html);
});
}
exports.install = install;
