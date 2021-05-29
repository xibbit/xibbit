<?php
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
//ini_set('display_errors', 'On');
//error_reporting(E_ALL);
$timeZone = 'America/Los_Angeles';
date_default_timezone_set($timeZone);
require_once('./config.php');
require_once('./xibdb.php');
require_once('./pfapp.php');

/**
 * Call this directly to create a stack trace.
 * The stack trace will show up in console.log
 * of the client browser.
 **/
function debugger() {
  throw new Exception();
}

// connect to the MySQL database
$link = new mysqli($sql_host, $sql_user, $sql_pass, $sql_db);

// log to client instead of suppressing logs
class LogToClientOutput {
  function __construct() {
  }
  function println($s) {
    print $s . '<br/>';
  }
}
$log = new LogToClientOutput();

// map the MySQL database to arrays and JSON
$xibdb = new XibDb(array(
  'log'=>$log,
  'json_column'=>'json', // freeform JSON column name
  'sort_column'=>'n', // array index column name
  'mysqli'=>array(
    'link'=>$link,
   )
));

// Public Profile specific object
$pf = new pfapp($xibdb, $sql_prefix);

// XibbitHub eventing system
require_once('xibbit.php');

/**
 * A class with XibbitHub broadcast method overrides.
 *
 * This is for demonstration only; SocketBroadcast
 * does nothing.
 *
 * @author DanielWHoward
 **/
class HubBroadcast extends SocketBroadcast {
  /**
   * Constructor.
   *
   * @author DanielWHoward
   **/
  function __construct($owner) {
    parent::__construct($owner);
  }

  /**
   * Send a message to every socket.
   *
   * This is for demonstration only; SocketBroadcast
   * does nothing.
   *
   * @param $typ string The message type.
   * @param $data string The message contents.
   *
   * @author DanielWHoward
   **/
  function emit($typ, $data) {
    return parent::emit($typ, $data);
  }
}

/**
 * A class with XibbitHub method overrides.
 *
 * Implement instances.  Events can be addressed to any
 * instance, not just a socket or a logged in user.
 *
 * @author DanielWHoward
 **/
class Hub extends XibbitHub {
  /**
   * Constructor.
   *
   * @author DanielWHoward
   **/
  function __construct($config) {
    parent::__construct($config);
  }

  /**
   * Return the socket associated with a socket ID.
   *
   * Override broadcast object.
   *
   * This is for demonstration only; SocketBroadcast
   * does nothing.
   *
   * @param $sid string The socket ID.
   * @return A socket.
   *
   * @author DanielWHoward
   **/
  function &getSocket($sid, $config=array()) {
    $socket = &parent::getSocket($sid, $config);
    if (get_class($socket->broadcast) === 'SocketBroadcast') {
      $socket->broadcast = new HubBroadcast($socket);
    }
    return $socket;
  }

  /**
   * Touch this socket to keep it alive.
   *
   * @author DanielWHoward
   **/
  function touch() {
    global $pf;

    $vars = &$this->config['vars'];
    $useInstances = isset($vars['useInstances']) && $vars['useInstances'];

    parent::touch();

    if ($useInstances) {
      $row = $pf->readOneRow(array(
        'table'=>'instances',
        'where'=>array(
          'instance'=>$this->session['instance']
      )));
      if ($row !== null) {
        // update the instance with current time (last ping)
        $values = array(
          'touched'=>date('Y-m-d H:i:s', time())
        );
        $pf->updateRow(array(
          'table'=>'instances',
          'values'=>$values,
          'where'=>array(
            'instance'=>$this->session['instance']
        )));
      }
    }
  }
}

// create and configure the XibbitHub object
$hub = new Hub(array(
  'mysqli'=>array(
    'link'=>$link,
    'SQL_PREFIX'=>$sql_prefix
  ),
  'vars'=>array(
    'pf'=>$pf,
    'useInstances'=>true
  )
));

// start the xibbit system
try {
  $hub->start();
} catch (Exception $e) {
  // show a stack trace for uncaught PHP exceptions
  print $e->getTraceAsString();
}

// disconnect from the MySQL database
if ($link) {
  $link->close();
}
?>
