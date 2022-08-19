<?php
// The MIT License (MIT)
//
// xibbit 1.5.2 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @version 1.5.2
// @copyright xibbit 1.5.2 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
mysqli_report(MYSQLI_REPORT_OFF);
require_once('../config.php');
require_once('../pwd.php');
?>
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
.warn, .error { display: none; }
<?php print '.php_error { display: none; } .warn, .error { display: block; }'; ?>
</style>
</head>
<body>
<div class="php_error">if you can see this, PHP not available; please install or configure</div>
<?php
// get the current time
date_default_timezone_set('America/Los_Angeles');
$now = date('Y-m-d H:i:s');
$nullDateTime = '1970-01-01 00:00:00';
$daysMap = array('SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT');
// detect and handle php-mysqli not installed error
if (!function_exists('mysqli_connect')) {
  function mysqli_connect($sql_host, $sql_user, $sql_pass) {
    return false;
  }
  function mysqli_select_db($link, $q) {
    return false;
  }
  function mysqli_query($link, $q) {
    return false;
  }
  function mysqli_num_rows($result) {
    return 0;
  }
  function mysqli_errno() {
    return -1;
  }
  function mysqli_error() {
    return 'php-mysqli not available; please install or configure';
  }
  function mysqli_close($link) {
  }
}
// connect to the database
$link = @mysqli_connect($sql_host, $sql_user, $sql_pass);
if (!$link) {
  print '<div class="error">'.$sql_host.' mysqli_connect() had a MySQL error ('.mysqli_connect_errno().'): '.mysqli_connect_error().'</div>'."\n";
}
// create the database
$q = 'CREATE DATABASE `'.$sql_db.'`';
$result = @mysqli_query($link, $q);
if (!$result) {
  if (mysqli_errno($link) == 1007) {
  } else {
    print '<div class="error">'.$sql_host.' CREATE DATABASE had a MySQL error ('.mysqli_errno($link).'): '.mysqli_error($link).'</div>'."\n";
  }
}
// select the database
$result = mysqli_select_db($link, $sql_db);
if (!$result) {
  print '<div class="error">'.$sql_host.' mysqli_select_db() had a MySQL error ('.mysqli_errno($link).'): '.mysqli_error($link).'</div>'."\n";
}
@mysqli_query($link, 'SET NAMES \'utf8\'');

// create the sockets table
$q = 'CREATE TABLE `'.$sql_prefix.'sockets` ( '
  .'`id` bigint(20) unsigned NOT NULL auto_increment,'
  .'`sid` text,'
  .'`connected` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  .'`touched` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  .'`props` text,'
  .'UNIQUE KEY `id` (`id`));';
if (mysqli_query($link, $q)) {
  print '<div>'.$q.'</div>'."\n";
} else {
  if (mysqli_errno($link) == 1050) {
    print '<div class="warn">Table '.$sql_prefix.'sockets already exists!</div>'."\n";
  } else {
    print '<div class="error">Table '.$sql_prefix.'sockets had a MySQL error ('.mysqli_errno($link).'): '.mysqli_error($link).'</div>'."\n";
  }
}

// create the sockets_events table
$q = 'CREATE TABLE `'.$sql_prefix.'sockets_events` ( '
  .'`id` bigint(20) unsigned NOT NULL auto_increment,'
  .'`sid` text,'
  .'`event` mediumtext,'
  .'`touched` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  .'UNIQUE KEY `id` (`id`));';
if (mysqli_query($link, $q)) {
  print '<div>'.$q.'</div>'."\n";
} else {
  if (mysqli_errno($link) == 1050) {
    print '<div class="warn">Table '.$sql_prefix.'sockets_events already exists!</div>'."\n";
  } else {
    print '<div class="error">Table '.$sql_prefix.'sockets_events had a MySQL error ('.mysqli_errno($link).'): '.mysqli_error($link).'</div>'."\n";
  }
}

// create the sockets_sessions table
$q = 'CREATE TABLE `'.$sql_prefix.'sockets_sessions` ( '
  .'`id` bigint(20) unsigned NOT NULL auto_increment,'
  .'`socksessid` varchar(25) NOT NULL,'
  .'`connected` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  .'`touched` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  .'`vars` text,'
  .'UNIQUE KEY `id` (`id`),'
  .'UNIQUE KEY `socksessid` (`socksessid`));';
if (mysqli_query($link, $q)) {
  print '<div>'.$q.'</div>'."\n";
} else {
  if (mysqli_errno($link) == 1050) {
    print '<div class="warn">Table '.$sql_prefix.'sockets_sessions already exists!</div>'."\n";
  } else {
    print '<div class="error">Table '.$sql_prefix.'sockets_sessions had a MySQL error ('.mysqli_errno($link).'): '.mysqli_error($link).'</div>'."\n";
  }
}
// add data to the sockets_sessions table
$q = 'SELECT id FROM '.$sql_prefix.'sockets_sessions';
$result = mysqli_query($link, $q);
if (mysqli_num_rows($result) == 0) {
  $values = array();
  $values[] = "0, 'global', '".$now."', '".$now."', '{}'";
  $values = isset($values_sockets_sessions)? $values_sockets_sessions: $values;
  foreach ($values as $value) {
    $q = 'INSERT INTO '.$sql_prefix.'sockets_sessions VALUES ('.$value.')';
    $result = mysqli_query($link, $q);
    if (!$result) {
      print '<div class="error">INSERT INTO: Table '.$sql_prefix.'sockets_sessions had a MySQL error ('.mysqli_errno($link).'): '.mysqli_error($link).'</div>'."\n";
      print '<div class="error">'.$q.'</div>'."\n";
    } else {
      print '<div>'.$q.'</div>'."\n";
    }
  }
} else {
  print '<div class="warn">Table '.$sql_prefix.'sockets_sessions already has data!</div>'."\n";
}

// create the locks table
$q = 'CREATE TABLE `'.$sql_prefix.'locks` ( '
  .'`name` varchar(20),'
  .'`created` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  .'`json` text,'
  .'UNIQUE KEY `name` (`name`));';
if (mysqli_query($link, $q)) {
  print '<div>'.$q.'</div>'."\n";
} else {
  if (mysqli_errno($link) == 1050) {
    print '<div class="warn">Table '.$sql_prefix.'locks already exists!</div>'."\n";
  } else {
    print '<div class="error">Table '.$sql_prefix.'locks had a MySQL error ('.mysqli_errno($link).'): '.mysqli_error($link).'</div>'."\n";
  }
}

// create the at table
$q = 'CREATE TABLE `'.$sql_prefix.'at` ( '
  .'`id` bigint(20) unsigned NOT NULL auto_increment,'
  .'`cmd` text,'
  .'`executed` datetime,' // 2014-12-23 06:00:00 (PST)
  .'`dow` varchar(3),'
  .'`elapsed` text,'
  .'UNIQUE KEY `id` (`id`));';
if (mysqli_query($link, $q)) {
  print '<div>'.$q.'</div>'."\n";
} else {
  if (mysqli_errno($link) == 1050) {
    print '<div class="warn">Table '.$sql_prefix.'at already exists!</div>'."\n";
  } else {
    print '<div class="error">Table '.$sql_prefix.'at had a MySQL error ('.mysqli_errno($link).'): '.mysqli_error($link).'</div>'."\n";
  }
}

// add data to the at table
$q = 'SELECT id FROM '.$sql_prefix.'at';
$result = mysqli_query($link, $q);
if (mysqli_num_rows($result) == 0) {
  $values = array();
  $values[] = "0, '#min hour day mon dow command', '".$now."', '".$daysMap[intval(date('w'))]."', ''";
  $values = isset($values_at)? $values_at: $values;
  foreach ($values as $value) {
    $q = 'INSERT INTO '.$sql_prefix.'at VALUES ('.$value.')';
    $result = mysqli_query($link, $q);
    if (!$result) {
      print '<div class="error">INSERT INTO: Table '.$sql_prefix.'at had a MySQL error ('.mysqli_errno($link).'): '.mysqli_error($link).'</div>'."\n";
      print '<div class="error">'.$q.'</div>'."\n";
    } else {
      print '<div>'.$q.'</div>'."\n";
    }
  }
} else {
  print '<div class="warn">Table '.$sql_prefix.'at already has data!</div>'."\n";
}

// create the users table
$q = 'CREATE TABLE `'.$sql_prefix.'users` ( '
  .'`id` bigint(20) unsigned NOT NULL auto_increment,'
  .'`uid` bigint(20) unsigned NOT NULL,'
  .'`username` text,'
  .'`email` text,'
  .'`pwd` text,'
  .'`created` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  .'`connected` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  .'`touched` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  .'`json` text,'
  .'UNIQUE KEY `id` (`id`));';
if (mysqli_query($link, $q)) {
  print '<div>'.$q.'</div>'."\n";
} else {
  if (mysqli_errno($link) == 1050) {
    print '<div class="warn">Table '.$sql_prefix.'users already exists!</div>'."\n";
  } else {
    print '<div class="error">Table '.$sql_prefix.'users had a MySQL error ('.mysqli_errno($link).'): '.mysqli_error($link).'</div>'."\n";
  }
}
// add data to the users table
$q = 'SELECT id FROM '.$sql_prefix.'users';
$result = mysqli_query($link, $q);
$dataInserted = false;
if (mysqli_num_rows($result) == 0) {
  $values = array();
  $values[] = "0, 1, 'admin', 'admin@xibbit.github.io', '".pwd_hash(hash('sha256', 'admin@xibbit.github.io'.'xibbit.github.io'.'passw0rd'))."', '".$now."', '".$nullDateTime."', '".$nullDateTime."', '{\"roles\":[\"admin\"]}'";
  $values[] = "0, 2, 'user1', 'user1@xibbit.github.io', '".pwd_hash(hash('sha256', 'user1@xibbit.github.io'.'xibbit.github.io'.'passw0rd'))."', '".$now."', '".$nullDateTime."', '".$nullDateTime."', '{}'";
  $values = isset($values_users)? $values_users: $values;
  foreach ($values as $value) {
    $q = 'INSERT INTO '.$sql_prefix.'users VALUES ('.$value.')';
    $result = mysqli_query($link, $q);
    if (!$result) {
      print '<div class="error">INSERT INTO: Table '.$sql_prefix.'users had a MySQL error ('.mysqli_errno($link).'): '.mysqli_error($link).'</div>'."\n";
      print '<div class="error">'.$q.'</div>'."\n";
    } else {
      $dataInserted = true;
      print '<div>'.$q.'</div>'."\n";
    }
  }
/*
  $q = 'ALTER TABLE '.$sql_prefix.'users  MODIFY COLUMN `id` bigint(20) unsigned AUTO_INCREMENT, AUTO_INCREMENT = 9;';
  $result = mysqli_query($link, $q);
  if (!$result) {
    print '<div class="error">Table '.$sql_prefix.'users had a MySQL error ('.mysqli_errno($link).'): '.mysqli_error($link).'</div>'."\n";
    print '<div class="error">'.$q.'</div>'."\n";
  } else {
    print '<div>'.$q.'</div>'."\n";
  }
*/
} else {
  print '<div class="warn">Table '.$sql_prefix.'users already has data!</div>'."\n";
}

// create the instances table
$q = 'CREATE TABLE `'.$sql_prefix.'instances` ( '
  .'`id` bigint(20) unsigned NOT NULL auto_increment,'
  .'`instance` text,'
  .'`connected` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  .'`touched` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  .'`sid` text,'
  .'`uid` bigint(20) unsigned NOT NULL,'
  .'`json` text,'
  .'UNIQUE KEY `id` (`id`));';
if (mysqli_query($link, $q)) {
  print '<div>'.$q.'</div>'."\n";
} else {
  if (mysqli_errno($link) == 1050) {
    print '<div class="warn">Table '.$sql_prefix.'instances already exists!</div>'."\n";
  } else {
    print '<div class="error">Table '.$sql_prefix.'instances had a MySQL error ('.mysqli_errno($link).'): '.mysqli_error($link).'</div>'."\n";
  }
}

// close the database
if ($link) {
  mysqli_close($link);
}
print '<div>Done.</div>'."\n";
?>
</body>
</html>
