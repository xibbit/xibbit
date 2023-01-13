<?php
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
$timeZone = 'America/Los_Angeles';
date_default_timezone_set($timeZone);
/**
 * Call this directly to create a stack trace.
 * The stack trace will show up in console.log
 * of the client browser.
 **/
$showStackTrace = false;
function debugger() {
  global $showStackTrace;

  $showStackTrace = true;
  throw new Exception();
}
require_once('../../../server/php/xibbit.php');

$sql_prefix= 'test_';
$now = '2023-12-16 02:30:45';
$nullDateTime = '1970-01-01 00:00:00';

function sortJsonNative($o) {
  $s = '';
  if (is_array($o)) {
    if (count(array_filter(array_keys($o), 'is_string')) === 0) {
      $s .= '[';
      foreach ($o as $value) {
        if ($s !== '[') {
          $s .= ',';
        }
        $s .= sortJsonNative($value);
      }
      $s .= ']';
    } else {
      $keys = array_keys($o);
      sort($keys);
      $s .= '{';
      foreach ($keys as $key) {
        $value = $o[$key];
        if ($s !== '{') {
          $s .= ',';
        }
        $s .= sortJsonNative($key) . ':' . sortJsonNative($value);
      }
      $s .= '}';
    }
  } elseif (is_bool($o)) {
    $s = $o? 'true': 'false';
  } elseif (is_numeric($o) && is_int($o) && (strval(intval($o)) == $o)) {
    $s = strval($o);
  } elseif (is_numeric($o) && is_float($o)) {
    $s = strval($o);
    if (strpos($s, '.') === false) {
      $s .= '.0';
    }
  } elseif ($o instanceof DateTime) {
    $s = '"' . str_replace('"', "\\\"", $o->format('Y-m-d H:i:s')) . '"';
  } elseif (is_string($o)) {
    $s = '"' . str_replace('"', "\\\"", strval($o)) . '"';
  }
  return $s;
}

function assertBool($name, $output, $actual) {
  $color = 'green';
  $result = 'passed';
  $out = '';
  if ($output) {
    $quoted = $actual;
    $quoted = str_replace("\\", "\\\\", $quoted);
    $quoted = str_replace("\"", "\\\"", $quoted);
    $quoted = "\"" . $quoted . "\",";
    $out .= '<div>' . htmlentities($quoted) . '</div>';
  }
  if (!$actual) {
    $color = 'red';
    $result = 'failed to match actual to expected';
  }
  print('<div style="color:' . $color . ';">' . $name . ': ' . $result . '</div>');
  print($out);
}

function assertStr($name, $output, $actual, $expected) {
  $color = 'green';
  $result = 'passed';
  $out = '';
  if ($output) {
    $quoted = $actual;
    $quoted = str_replace("\\", "\\\\", $quoted);
    $quoted = str_replace("\"", "\\\"", $quoted);
    $quoted = "\"" . $quoted . "\",";
    $out .= '<div>' . htmlentities($quoted) . '</div>';
  }
  if ($actual !== $expected) {
    $color = 'red';
    $result = 'failed to match actual to expected';
  }
  print('<div style="color:' . $color . ';">' . $name . ': ' . $result . '</div>');
  print($out);
}
?>
<html>
<head>
</head>
<body>
<?php
// connect to the MySQL database
$link = new mysqli('localhost', 'root', 'mysql', 'publicfigure');

class LogMe {
  function __construct() {
  }
  function println($s, $l=2) {
    // $l: 0=info; 1=warn; 2=error
    switch ($l) {
      case 0:
        //print('<div>'.$s.'</div>'."\n");
        break;
      case 1:
        //print('<div class="warn">'.$s.'</div>'."\n");
        break;
      case 2:
        print('<div class="error">'.$s.'</div>'."\n");
        break;
    }
  }
}
$log = new LogMe();

// create and configure the XibbitHub object
$installer = new XibbitHub(array(
  'mysqli'=>array(
    'link'=>$link,
    'SQL_PREFIX'=>$sql_prefix
  )
), false);

$installer->dropDatabaseTables($log, true);

$installer->createDatabaseTables($log, '`json` text');

$installer->stopHub();

// add data to the users table
$q = 'SELECT id FROM '.$sql_prefix.'users';
$result = mysqli_query($link, $q);
$dataInserted = false;
if (mysqli_num_rows($result) == 0) {
  $values = array();
  $values[] = "0, 1, 'admin', 'admin@xibbit.github.io', 'password1', '".$now."', '".$nullDateTime."', '".$nullDateTime."', '{\"roles\":[\"admin\"]}'";
  $values[] = "0, 2, 'user1', 'user1@xibbit.github.io', 'password2', '".$now."', '".$nullDateTime."', '".$nullDateTime."', '{}'";
  $values = isset($values_users)? $values_users: $values;
  foreach ($values as $value) {
    $q = 'INSERT INTO '.$sql_prefix.'users VALUES ('.$value.')';
    $result = mysqli_query($link, $q);
    if (!$result) {
      print('<div class="error">INSERT INTO: Table '.$sql_prefix.'users had a MySQL error ('.mysqli_errno($link).'): '.mysqli_error($link).'</div>'."\n");
      print('<div class="error">'.$q.'</div>'."\n");
    } else {
      $dataInserted = true;
      $log->println($q, 0);
    }
  }
} else {
  print('<div class="warn">Table '.$sql_prefix.'users already has data!</div>'."\n");
}
/*
try {
  $q = 'DROP TABLE `'.$sql_prefix.'instances`;';
  mysqli_query($link, $q);
} catch (Exception $e) {
  $log->println($e->getMessage());
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
  $log->println($q, 0);
} else {
  if (mysqli_errno($link) == 1050) {
    print('<div class="warn">Table '.$sql_prefix.'instances already exists!</div>'."\n");
  } else {
    print('<div class="error">Table '.$sql_prefix.'instances had a MySQL error ('.mysqli_errno($link).'): '.mysqli_error($link).'</div>'."\n");
  }
}
*/

	//
	// #1
	//

try {
  //$_REQUEST['EIO'] = '3';
  $_REQUEST['transport'] = 'polling';
  //$_REQUEST['XIO'] = '{"type":"an_event"}';
  //$_REQUEST['sid'] = 'abc';
  //$_REQUEST['instance'] = 'def';
  //unset($_GET['callback']);
  //$_COOKIE['SOCKSESSID']
  //$_SESSION = array();
  //$_SESSION['instance_'.$instance]
  //$_FILES
  class Impl1 {
    function __construct() {
      $this->useSocketIO = true;
    }
    function mysql_real_escape_string($unescaped_string) {
      return $unescaped_string;
    }
    function &mysql_query(&$query) {
      return array();
    }
    function &mysql_fetch_assoc(&$result) {
      return null;
    }
    function mysql_free_query(&$result) {
    }
  };
  $wrapper = new SocketIOWrapper();
  $socket = $wrapper->wrapSocket(null, array(
    impl=>new Impl1()
  ));
  assertStr('SocketWrapper #1', false,
    get_class($socket),
    'SocketWrapper'
  );
} catch (Exception $e) {
  $log->println($e->getMessage());
  if ($showStackTrace) {
    print $e->getTraceAsString();
  }
}

	//
	// #2
	//

try {
  $_REQUEST['transport'] = 'polling';
  $_REQUEST['sid'] = 'abc';
  class Impl2 {
    function __construct() {
      $this->useSocketIO = false;
    }
    function mysql_real_escape_string($unescaped_string) {
      return $unescaped_string;
    }
    function &mysql_query(&$query) {
      return array();
    }
    function &mysql_fetch_assoc(&$result) {
      return null;
    }
    function mysql_free_query(&$result) {
    }
  };
  $wrapper = new SocketIOWrapper();
  $socket = $wrapper->wrapSocket(null, array(
    impl=>new Impl2()
  ));
  assertStr('ShortPollSocket #2', false,
    get_class($socket),
    'ShortPollSocket'
  );
} catch (Exception $e) {
  $log->println($e->getMessage());
}

	//
	// #3
	//

try {
  $_REQUEST['transport'] = 'polling';
  $_REQUEST['sid'] = 'abc';
  class Impl3 {
    function __construct() {
      $this->useSocketIO = true;
    }
    function mysql_real_escape_string($unescaped_string) {
      return $unescaped_string;
    }
    function &mysql_query(&$query) {
      return array();
    }
    function &mysql_fetch_assoc(&$result) {
      return null;
    }
    function mysql_free_query(&$result) {
    }
  };
  $wrapper = new SocketIOWrapper();
  $socket = $wrapper->wrapSocket(null, array(
    impl=>new Impl3()
  ));
  assertStr('SocketBroadcast #3', false,
    get_class($socket->broadcast),
    'SocketBroadcast'
  );
} catch (Exception $e) {
  $log->println($e->getMessage());
}

	//
	// #4
	//

try {
  $_REQUEST['sid'] = 'abc';
  class Impl4 {
    function __construct() {
      $this->useSocketIO = true;
    }
    function mysql_real_escape_string($unescaped_string) {
      return $unescaped_string;
    }
    function &mysql_query(&$query) {
      return array();
    }
    function &mysql_fetch_assoc(&$result) {
      return null;
    }
    function mysql_free_query(&$result) {
    }
  };
  $wrapper = new SocketIOWrapper();
  $socket = $wrapper->wrapSocket(null, array(
    impl=>new Impl4()
  ));
  $socket->broadcast->emit('client', array('type'=>'reggae'));
  assertBool('SocketBroadcast #4', false,
    get_class($socket->broadcast),
    'SocketBroadcast'
  );
} catch (Exception $e) {
  $log->println($e->getMessage());
}

	//
	// #5
	//

try {
  $_REQUEST['sid'] = 'abc';
  class Impl5 {
    var $q = '';
    var $r = 0;
    var $rows = array(
      array('vars'=>'{"var1":"x","var2":"y","var3":"z"}')
    );
    function __construct() {
      $this->useSocketIO = true;
    }
    function &mysql_query(&$query) {
      if (substr($query, 0, 11) === 'SELECT vars') {
        $this->r = 0;
        return $this->rows;
      }
      return false;
    }
    function &mysql_fetch_assoc(&$result) {
      if (is_array($result) && ($this->r < count($result))) {
        $row = $result[$this->r];
        $this->r++;
        return $row;
      }
      $r = 0;
      return null;
    }
    function mysql_free_query(&$result) {
    }
    function mysql_real_escape_string($unescaped_string) {
      return $unescaped_string;
    }
    function rand_secure($min, $max) {
      return $min;
    }
  };
  $session = new SocketSession(array(
    impl=>new Impl5()
  ));
  $session->load();
  assertStr('SocketSession.load #5', false,
    json_encode($_SESSION),
    "{\"var1\":\"x\",\"var2\":\"y\",\"var3\":\"z\"}"
  );
} catch (Exception $e) {
  $log->println($e->getMessage());
}

	//
	// #6
	//

try {
  // create and configure the XibbitHub object
  unset($_REQUEST['sid']);
  $hub = new XibbitHub(array(
    'mysqli'=>array(
      'link'=>$link,
      'SQL_PREFIX'=>$sql_prefix
    ),
    'vars'=>array(
      'useInstances'=>true
    )
  ));
  $wrapper = new SocketIOWrapper();
  $socket = $wrapper->wrapSocket(null, array(
    impl=>new Impl4()
  ));
  $hub->sessions[0]['session_data'] = array('value'=>'thequickbrownfox');
  $hub->sessions[0]['_conn']['sockets'][] = $socket;
  $retVal = $hub->getSession($socket);
  assertStr('XibbitHub.getSession #6', false,
    json_encode($retVal['session_data']),
    "{\"value\":\"thequickbrownfox\"}"
  );
} catch (Exception $e) {
  $log->println($e->getTraceAsString());
}
$hub = null;

	//
	// #7 
	//

try {
  // create and configure the XibbitHub object
  unset($_REQUEST['sid']);
  $_REQUEST['EIO'] = '3';
  $_REQUEST['transport'] = 'polling';
  $_REQUEST['instance'] = 'def';
  $_REQUEST['t'] = 'ghi';
  $output = '';
  class ValueStream1 {
    function __construct() {
    }
    function write($data) {
      global $output;
      $output = $data;
    }
    function flush() {
    }
  }
  class Hub7 extends XibbitHub {
    function __construct($config) {
      parent::__construct($config);
    }
    function generateSid() {
      return 'qrst';
    }
  }
  $hub = new Hub7(array(
    'mysqli'=>array(
      'link'=>$link,
      'SQL_PREFIX'=>$sql_prefix
    ),
    'vars'=>array(
      'useInstances'=>true
    )
  ), false);
  $hub->useSocketIO = true;
  $hub->packetsBuffer = '';
  $hub->outputStream = new ValueStream1();
  $hub->start();
  assertStr('XibbitHub.start #7', false,
    $output,
    "70:0{\"sid\":\"qrst\",\"upgrades\":[],\"pingInterval\":20000,\"pingTimeout\":60000}2:40"
  );
} catch (Exception $e) {
  $log->println($e->getTraceAsString());
}
$hub = null;

	//
	// #8
	//

try {
  // create and configure the XibbitHub object
  unset($_REQUEST['sid']);
  $_REQUEST['EIO'] = '3';
  $_REQUEST['transport'] = 'polling';
  $_REQUEST['instance'] = 'def';
  $_REQUEST['t'] = 'ghi';
  $output = '';
  class ValueStream {
    function __construct() {
    }
    function write($data) {
      global $output;
      $output = $data;
    }
    function flush() {
    }
  }
  class Hub8 extends XibbitHub {
    function __construct($config) {
      parent::__construct($config);
    }
    function generateSid() {
      return 'qrst';
    }
  }
  $hub = new Hub8(array(
    'mysqli'=>array(
      'link'=>$link,
      'SQL_PREFIX'=>$sql_prefix
    ),
    'vars'=>array(
      'useInstances'=>true
    )
  ));
  $hub->useSocketIO = true;
  $hub->packetsBuffer = '80:42["server",{"type":"_instance","instance":"8tOjGxLR6UGQj9F2cthu8ZHog","_id":1}]';
  $hub->outputStream = new ValueStream();
  $socket = $hub->socketio->wrapSocket('', array('impl'=>$hub));
  $hub->readAndWriteSocket($socket);
  assertStr('XibbitHub.readAndWriteSocket #8', false,
    $output,
    "70:0{\"sid\":\"qrst\",\"upgrades\":[],\"pingInterval\":20000,\"pingTimeout\":60000}2:40"
  );
} catch (Exception $e) {
  $log->println($e->getTraceAsString());
}
$hub = null;

	//
	// #9
	//

try {
  // create and configure the XibbitHub object
  unset($_REQUEST['sid']);
  unset($_REQUEST['transport']);
  unset($_REQUEST['polling']);
  unset($_REQUEST['EIO']);
  unset($_REQUEST['t']);
  $_FILES = array('an_event_fakefile'=>"a bunch of file data");
  $hub = new XibbitHub(array(
    'mysqli'=>array(
      'link'=>$link,
      'SQL_PREFIX'=>$sql_prefix
    )
  ));
  $hub->sessions[0]['session_data'] = array('session_key1'=>'session_value1');
  $retVal = null;
  $hub->on('api', 'an_event', function($event) {
    global $retVal;
    $retVal = $event;
    return $event;
  });
  $fileEvents = array('an_event'=>array());
  $hub->readAndWriteUploadEvent($fileEvents);
  assertStr('XibbitHub.readAndWriteUploadEvent #9', false,
    json_encode($retVal),
    "{\"_session\":{\"session_key1\":\"session_value1\"},\"type\":\"an_event\",\"fakefile\":\"a bunch of file data\"}"
  );
} catch (Exception $e) {
  $log->println($e->getTraceAsString());
}
$hub = null;

	//
	// #10
	//

try {
  // create and configure the XibbitHub object
  unset($_REQUEST['sid']);
  $hub = new XibbitHub(array(
    'mysqli'=>array(
      'link'=>$link,
      'SQL_PREFIX'=>$sql_prefix
    ),
    'vars'=>array(
      'useInstances'=>true
    )
  ));
  $hub->on('on', 'jazz', function($event, $vars) {
    return array('name'=>'jazz_on');
  });
  $hub->on('api', 'jazz', function($event, $vars) {
    return array('name'=>'jazz_api');
  });
  $retVal = $hub->trigger(array('type'=>'jazz'));
  assertStr('XibbitHub.trigger #10', false,
    json_encode($retVal),
    "{\"name\":\"jazz_api\"}"
  );
} catch (Exception $e) {
  $log->println($e->getTraceAsString());
}
$hub = null;

	//
	// #11
	//

try {
  // create and configure the XibbitHub object
  $hub = new XibbitHub(array(
    'mysqli'=>array(
      'link'=>$link,
      'SQL_PREFIX'=>$sql_prefix
    ),
    'vars'=>array(
      'useInstances'=>true
    )
  ));
  $hub->on('api', 'jazz', function($event, $vars) {
    return array('name'=>'jazz_api');
  });
  $retVal = $hub->trigger(array('type'=>'jazz'));
  assertStr('XibbitHub.trigger #11', false,
    json_encode($retVal),
    "{\"name\":\"jazz_api\"}"
  );
} catch (Exception $e) {
  $log->println($e->getTraceAsString());
}
$hub = null;

	//
	// #12
	//

try {
  // create and configure the XibbitHub object
  $hub = new XibbitHub(array(
    'mysqli'=>array(
      'link'=>$link,
      'SQL_PREFIX'=>$sql_prefix
    ),
    'vars'=>array(
      'useInstances'=>true
    )
  ));
  $hub->on('api', 'jazz', function($event, $vars) {
    return array('name'=>'jazz_api');
  });
  $event = array('type'=>'jazz','to'=>'user1');
  $retVal = $hub->send($event, null, true);
  $q = 'SELECT * FROM `'.$sql_prefix.'sockets_events`';
  $result = $hub->mysql_query($q);
  $rows = array();
  while ($row = $hub->mysql_fetch_assoc($result)) {
    $rows[] = $row;
  }
  $hub->mysql_free_query($result);
  $dateTimeRegEx = "/^(((\d{4})(-)(0[13578]|10|12)(-)(0[1-9]|[12][0-9]|3[01]))|((\d{4})(-)(0[469]|1‌​1)(-)([0][1-9]|[12][0-9]|30))|((\d{4})(-)(02)(-)(0[1-9]|1[0-9]|2[0-8]))|(([02468]‌​[048]00)(-)(02)(-)(29))|(([13579][26]00)(-)(02)(-)(29))|(([0-9][0-9][0][48])(-)(0‌​2)(-)(29))|(([0-9][0-9][2468][048])(-)(02)(-)(29))|(([0-9][0-9][13579][26])(-)(02‌​)(-)(29)))(\s([0-1][0-9]|2[0-4]):([0-5][0-9]):([0-5][0-9]))$/";
  if ((count($rows) === 1) && isset($rows[0]['touched'])
      && ($rows[0]['touched'] !== '1970-01-01 00:00:00')
      && (preg_match($dateTimeRegEx, $rows[0]['touched']) === 1)) {
    $rows[0]['touched'] = "2020-01-01 00:00:00";
    assertStr('XibbitHub.send #12', false,
      json_encode($rows[0]),
      "{\"id\":\"1\",\"sid\":\"user1\",\"event\":\"[\\\"client\\\",{\\\"type\\\":\\\"jazz\\\",\\\"to\\\":\\\"user1\\\"}]\",\"touched\":\"2020-01-01 00:00:00\"}"
    );
  } else {
    assertBool('XibbitHub.send #12', false,
      false
    );
  }
} catch (Exception $e) {
  $log->println($e->getTraceAsString());
}
$hub = null;

	//
	// #13
	//

try {
  $_REQUEST['sid'] = 'abc';
  // create and configure the XibbitHub object
  $hub = new XibbitHub(array(
    'mysqli'=>array(
      'link'=>$link,
      'SQL_PREFIX'=>$sql_prefix
    ),
    'vars'=>array(
      'useInstances'=>true
    )
  ));
  $hub->useSocketIO = false;
  $sentEvent = array('client', array('type'=>'reggae', 'to'=>'user1'));
  $q = "DELETE FROM `".$sql_prefix."sockets_events`;";
  $result = $hub->mysql_query($q);
  $q = "INSERT `".$sql_prefix."sockets_events` VALUES(0, 'user1', '".json_encode($sentEvent)."', '2022-01-01 00:00:00');";
  $result = $hub->mysql_query($q);
  $event = array('client', array('type'=>'pop', '_session'=>array('username'=>'user1')));
  $session = array('username'=>'user1');
  $retVal = $hub->receive(array($event), $session, true);
  assertStr('XibbitHub.receive #13', false,
    json_encode($retVal),
    "[[\"client\",{\"type\":\"pop\",\"_session\":{\"username\":\"user1\"}}]]"
  );
} catch (Exception $e) {
  $log->println($e->getTraceAsString());
}
$hub = null;

	//
	// #14
	//

try {
  $_REQUEST['instance'] = 'abc';
  $_SESSION['instance_abc'] = array();
  // create and configure the XibbitHub object
  $hub = new XibbitHub(array(
    'mysqli'=>array(
      'link'=>$link,
      'SQL_PREFIX'=>$sql_prefix
    ),
    'vars'=>array(
      'useInstances'=>true
    )
  ));
  $passed = true;
  $login = array('type'=>'login', '_session'=>array());
  $passed = !isset($login['_session']['_username']);
  $loggedIn = $hub->connect($login, 'user1', true);
  $passed = $passed && isset($loggedIn['_session']['_username']);
  $logout = array('type'=>'logout', '_session'=>$loggedIn['_session']);
  $loggedOut = $hub->connect($logout, 'user1', false);
  assertBool('XibbitHub.connect #14', false,
    $passed && !isset($loggedOut['_session']['_username'])
  );
} catch (Exception $e) {
  $log->println($e->getTraceAsString());
}
$hub = null;

	//
	// #15
	//

try {
  // create and configure the XibbitHub object
  $hub = new XibbitHub(array(
    'mysqli'=>array(
      'link'=>$link,
      'SQL_PREFIX'=>$sql_prefix
    ),
    'vars'=>array(
      'useInstances'=>true
    )
  ));
  $q = "UPDATE `".$sql_prefix."users` SET  `connected`='2022-01-01 00:00:00',`touched`='2022-01-01 00:00:00' WHERE username='user1';";
  $result = $hub->mysql_query($q);
  $q = 'SELECT * FROM `'.$sql_prefix.'users`';
  $result = $hub->mysql_query($q);
  $rows = array();
  while ($row = $hub->mysql_fetch_assoc($result)) {
    $rows[] = $row;
  }
  $before = $rows[1];
  $hub->mysql_free_query($result);
  $retVal = $hub->touch(array('_username'=>'user1'));
  $q = 'SELECT * FROM `'.$sql_prefix.'users`';
  $result = $hub->mysql_query($q);
  $rows = array();
  while ($row = $hub->mysql_fetch_assoc($result)) {
    $rows[] = $row;
  }
  $after = $rows[1];
  assertBool('XibbitHub.touch #15', false,
    $before['touched'] !== $after['touched']
  );
} catch (Exception $e) {
  $log->println($e->getTraceAsString());
}
$hub = null;

	//
	// #16
	//

try {
  // create and configure the XibbitHub object
  $hub = new XibbitHub(array(
    'mysqli'=>array(
      'link'=>$link,
      'SQL_PREFIX'=>$sql_prefix
    )
  ));
  $q = 'UPDATE `'.$sql_prefix.'sockets_sessions` SET vars=\'{"_lastTick":"2010-01-01 00:01:00"}\' WHERE `id`=1;';
  $result = $hub->mysql_query($q);
  $q = 'SELECT * FROM `'.$sql_prefix.'sockets_sessions` ORDER BY `id`;';
  $result = $hub->mysql_query($q);
  $rows = array();
  while ($row = $hub->mysql_fetch_assoc($result)) {
    $rows[] = $row;
  }
  $before = json_decode($rows[0]['vars'], true);
  $hub->mysql_free_query($result);
  $retVal = $hub->checkClock();
  $result = $hub->mysql_query($q);
  $rows = array();
  while ($row = $hub->mysql_fetch_assoc($result)) {
    $rows[] = $row;
  }
  $after = json_decode($rows[0]['vars'], true);
  $hub->mysql_free_query($result);
  assertBool('XibbitHub.checkClock lastTick #16', false,
    $before['_lastTick'] !== $after['_lastTick']
  );
} catch (Exception $e) {
  $log->println($e->getTraceAsString());
}
$hub = null;

	//
	// #17
	//

try {
  // create and configure the XibbitHub object
  $hub = new XibbitHub(array(
    'mysqli'=>array(
      'link'=>$link,
      'SQL_PREFIX'=>$sql_prefix
    ),
    'vars'=>array(
      'useInstances'=>true
    )
  ));
  $retVal = $hub->readPayload('50:42["client",{"type":"notify_instance","to":"all"}]105:42["client",{"type":"_instance","_id":1,"instance":"5LC4nnjtdpoxcgiKvszrRO3ey","i":"instance retrieved"}]');
  assertStr('XibbitHub.Payload #17', false,
    json_encode($retVal),
    "[\"42[\\\"client\\\",{\\\"type\\\":\\\"notify_instance\\\",\\\"to\\\":\\\"all\\\"}]\",\"42[\\\"client\\\",{\\\"type\\\":\\\"_instance\\\",\\\"_id\\\":1,\\\"instance\\\":\\\"5LC4nnjtdpoxcgiKvszrRO3ey\\\",\\\"i\\\":\\\"instance retrieved\\\"}]\"]"
  );
} catch (Exception $e) {
  $log->println($e->getTraceAsString());
}
$hub = null;

	//
	// #18
	//

try {
  // create and configure the XibbitHub object
  $hub = new XibbitHub(array(
    'mysqli'=>array(
      'link'=>$link,
      'SQL_PREFIX'=>$sql_prefix
    )
  ));
  $q = "UPDATE `".$sql_prefix."sockets_sessions` SET `vars`='{\"lastTick\":\"2025-01-01 00:01:00\"}' WHERE id=1;";
  $result = $hub->mysql_query($q);
  $retVal = $hub->readGlobalVars();
  assertStr('XibbitHub.GlobalVars #18', false,
    json_encode($retVal),
      "{\"lastTick\":\"2025-01-01 00:01:00\"}"
  );
} catch (Exception $e) {
  $log->println($e->getTraceAsString());
}
$hub = null;

	//
	// #19
	//

try {
  // create and configure the XibbitHub object
  $hub = new XibbitHub(array(
    'mysqli'=>array(
      'link'=>$link,
      'SQL_PREFIX'=>$sql_prefix
    )
  ));
  $q = "UPDATE `".$sql_prefix."users` SET  `touched`='2021-01-01 00:00:00' WHERE username='user1';";
  $result = $hub->mysql_query($q);
  $q = 'SELECT * FROM `'.$sql_prefix.'users`';
  $result = $hub->mysql_query($q);
  $rows = array();
  while ($row = $hub->mysql_fetch_assoc($result)) {
    $rows[] = $row;
  }
  $hub->mysql_free_query($result);
  assertStr('XibbitHub.mysql_XXX #19', false,
    json_encode($rows),
      "[{\"id\":\"1\",\"uid\":\"1\",\"username\":\"admin\",\"email\":\"admin@xibbit.github.io\",\"pwd\":\"password1\",\"created\":\"2023-12-16 02:30:45\",\"connected\":\"1970-01-01 00:00:00\",\"touched\":\"1970-01-01 00:00:00\",\"json\":\"{\\\"roles\\\":[\\\"admin\\\"]}\"},{\"id\":\"2\",\"uid\":\"2\",\"username\":\"user1\",\"email\":\"user1@xibbit.github.io\",\"pwd\":\"password2\",\"created\":\"2023-12-16 02:30:45\",\"connected\":\"2022-01-01 00:00:00\",\"touched\":\"2021-01-01 00:00:00\",\"json\":\"{}\"}]"
  );
} catch (Exception $e) {
  $log->println($e->getTraceAsString());
}
$hub = null;

// disconnect from the MySQL database
if ($link) {
  $link->close();
}

print("Done.");
?>
</body>
</html>
