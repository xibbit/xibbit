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
/**
 * Return true if the boolean value is similar to true.
 *
 * @param $b boolean The value to test.
 * @param $data boolean The truthiness of the value.
 *
 * @package xibbit
 * @author DanielWHoward
 **/
function isTruthy($b) {
  return ($b !== '') && ($b !== null) && ($b !== 0);
}

/**
 * A LAMP-based Socket.IO long-polling socket
 * compatible with any, even super lame, PHP hosting
 * service.  Socket.IO sockets are recreated with a
 * new SID every time that the browser page is
 * refreshed.
 *
 * This socket uses a database to persist the socket.
 * It uses the sockets and sockets_events database
 * tables to maintain all the sockets.
 *
 * @package xibbit
 * @author DanielWHoward
 **/
class SocketIOWrapper {
  /**
   * Constructor.
   *
   * @author DanielWHoward
   **/
  function __construct() {
    $this->socket = null;
  }

  /**
   * Add a handler for a message type.
   *
   * @param $msg string The message type.
   * @param $fn function The handler invoke when this socket receives a message.
   *
   * @author DanielWHoward
   **/
  function &wrapSocket($sid, $config=array()) {
    if ($this->socket === null) {
      if ($config['impl']->useSocketIO) {
        $localSid = isset($_REQUEST['sid'])? $_REQUEST['sid']: '';
        $this->socket = new SocketWrapper($localSid, $config);
      } else {
        $this->socket = new ShortPollSocket('', $config);
      }
    }
    $socket = null;
    if ($config['impl']->useSocketIO) {
      if (($sid === '') || ($this->socket->sid === $sid)) {
        return $this->socket;
      } else {
        $socket = new SocketWrapper($sid, $config);
      }
    } else {
      $username = isset($config['impl']->sessions[0]['session_data']['_username'])? $config['impl']->sessions[0]['session_data']['_username']: '';
      if (($sid === '') || ($sid === $username)) {
        return $this->socket;
      } else {
        $sid = ($username === '')? $sid: $username;
        $socket = new ShortPollSocket($sid, $config);
      }
    }
    return $socket;
  }
}

/**
 * A private class for emulating the broadcast object
 * inside a Socket.IO socket.
 *
 * @package xibbit
 * @author DanielWHoward
 **/
class SocketBroadcast {
  var $owner;

  /**
   * Constructor.
   *
   * @author DanielWHoward
   **/
  function __construct(&$owner) {
    $this->owner = &$owner;
  }

  /**
   * Send a message to every socket.
   *
   * @param $typ string The message type.
   * @param $data string The message contents.
   *
   * @author DanielWHoward
   **/
  function emit($typ, $data) {
    $emitted = false;
    $impl = &$this->owner->config['impl'];
    $ownerClassName = get_class($this->owner);
    if ($ownerClassName === 'SocketWrapper') {
      $q = 'SELECT `sid`, `props` FROM `'.$impl->prefix.'sockets`;';
      $qr = &$impl->mysql_query($q);
      while ($row = &$impl->mysql_fetch_assoc($qr)) {
        $sid = $row['sid'];
        $socket = &$impl->socketio->wrapSocket($sid, array('impl'=>$impl));
        $socket->emit($typ, $data);
        $emitted = true;
      }
      $impl->mysql_free_query($qr);
    } else if ($ownerClassName === 'ShortPollSocket') {
      $username = isset($impl->sessions[0]['session_data']['_username'])? $impl->sessions[0]['session_data']['_username']: null;
      // read users from database
      $q = 'SELECT username FROM `'.$impl->prefix.'users` WHERE '
        .'`connected` <> \'1970-01-01 00:00:00\';';
      $qr = &$impl->mysql_query($q);
      while ($row = &$impl->mysql_fetch_assoc($qr)) {
        $sid = $row['username'];
        $socket = &$impl->socketio->wrapSocket($sid, array('impl'=>$impl));
        $socket->emit($typ, $data);
        $emitted = true;
      }
      $impl->mysql_free_query($qr);
      if ($username === null) {
        $socket = &$impl->socketio->wrapSocket('', array('impl'=>$impl));
        $socket->emit($typ, $data);
        $emitted = true;
      }
    }
    return $emitted;
  }
}

/**
 * A LAMP-based Socket.IO long-polling socket
 * compatible with any, even super lame, PHP hosting
 * service.  Socket.IO sockets are recreated with a
 * new SID every time that the browser page is
 * refreshed.
 *
 * This socket uses a database to persist the socket.
 * It uses the sockets and sockets_events database
 * tables to maintain all the sockets.
 *
 * @package xibbit
 * @author DanielWHoward
 **/
class SocketWrapper {
  var $sid;
  var $localSid;
  var $loaded;
  var $props;
  var $broadcast;
  var $handlers;
  var $config;
  var $eventBuffer;

  /**
   * Constructor.
   *
   * @author DanielWHoward
   **/
  function __construct($sid, $config) {
    $this->sid = $sid;
    $this->localSid = isset($_REQUEST['sid'])? $_REQUEST['sid']: '';
    $this->loaded = false;
    $this->props = array();
    $this->handlers = array();
    $this->config = $config;
    $this->eventBuffer = array();
    $this->broadcast = new SocketBroadcast($this);
    if (isTruthy($sid) && ($sid === $this->localSid)) {
      $this->load();
      $this->touch();
    }
  }

  /**
   * Add a handler for a message type.
   *
   * @param $msg string The message type.
   * @param $fn function The handler invoke when this socket receives a message.
   *
   * @author DanielWHoward
   **/
  function on($msg, $fn) {
    $this->handlers[$msg] = $fn;
  }

  /**
   * Invoke the handler for a message.
   *
   * @param $msg string The message type.
   * @param $data mixed The message contents.
   *
   * @author DanielWHoward
   **/
  function handle($msg, $data) {
    $this->handlers[$msg]($data);
  }

  /**
   * Send a message to this socket.
   *
   * @param $msg string The message type.
   * @param $data mixed The message contents.
   *
   * @author DanielWHoward
   **/
  function emit($typ, $data) {
    $emitted = false;
    $event = json_encode(array($typ, $data));
    if (($this->sid === '') || ($this->sid === $this->localSid)) {
      // the socket belongs to this client: return the data
      $this->eventBuffer[] = $event;
      $emitted = true;
    } elseif (isTruthy($this->sid)) {
      // the socket does not belong to this client: queue for the other socket
      $now = date('Y-m-d H:i:s', time());
      $q = 'INSERT INTO `'.$this->config['impl']->prefix.'sockets_events` '
        .'(`id`, `sid`, `event`, `touched`) VALUES ('
        ."0, "
        ."'".$this->config['impl']->mysql_real_escape_string($this->sid)."', "
        ."'".$this->config['impl']->mysql_real_escape_string($event)."', "
        ."'".$this->config['impl']->mysql_real_escape_string($now)."');";
      $qr = &$this->config['impl']->mysql_query($q);
      $emitted = true;
    }
    return $emitted;
  }

  /**
   * Return true if this socket is in the database.
   *
   * @author DanielWHoward
   **/
  function exists() {
    $exists = false;
    if ($this->sid === '') {
      $exists = true;
    } elseif (isTruthy($this->sid)) {
      if (!$this->loaded) {
        $this->load();
      }
      $exists = $this->loaded;
    }
    return $exists;
  }

  /**
   * Load the properties saved on this socket.
   *
   * A socket can persistent (JSON) key value properties.
   *
   * @author DanielWHoward
   **/
  function load() {
    if (isTruthy($this->sid)) {
      // load the properties stored on this socket
      $q = 'SELECT props FROM `'.$this->config['impl']->prefix.'sockets` WHERE '
        .'`sid`=\''.$this->config['impl']->mysql_real_escape_string($this->sid).'\';';
      $qr = &$this->config['impl']->mysql_query($q);
      if ($row = &$this->config['impl']->mysql_fetch_assoc($qr)) {
        $this->props = json_decode($row['props'], true);
        $this->loaded = true;
      }
      $this->config['impl']->mysql_free_query($qr);
    }
  }

  /**
   * Save the properties on this socket.
   *
   * A socket can persistent (JSON) key value properties.
   *
   * @author DanielWHoward
   **/
  function save() {
    if (isTruthy($this->sid)) {
      $props = json_encode($this->props);
      // save the properties stored on this socket
      $q = 'UPDATE `'.$this->config['impl']->prefix.'sockets` SET '
        .'`props`=\''.$this->config['impl']->mysql_real_escape_string($props).'\', '
        .'`touched`=\''.$this->config['impl']->mysql_real_escape_string(date('Y-m-d H:i:s', time())).'\' WHERE '
        .'sid=\''.$this->config['impl']->mysql_real_escape_string($this->sid).'\'';
      $qr = &$this->config['impl']->mysql_query($q);
    }
  }

  /**
   * Touch this socket to keep it alive.
   *
   * @author DanielWHoward
   **/
  function touch() {
    if (isTruthy($this->sid)) {
      // save the properties stored on this socket
      $q = 'UPDATE `'.$this->config['impl']->prefix.'sockets` SET '
        .'`touched`=\''.$this->config['impl']->mysql_real_escape_string(date('Y-m-d H:i:s', time())).'\' WHERE '
        .'sid=\''.$this->config['impl']->mysql_real_escape_string($this->sid).'\'';
      $qr = &$this->config['impl']->mysql_query($q);
    }
  }
}

/**
 * A LAMP-based non-Socket.IO socket compatible with
 * any, even super lame, PHP hosting service that uses
 * short-polling.
 *
 * @package xibbit
 * @author DanielWHoward
 **/
class ShortPollSocket {
  var $sid;
  var $config;
  var $props;
  var $handlers;
  var $eventBuffer;
  var $broadcast;

  /**
   * Constructor.
   *
   * @author DanielWHoward
   **/
  function __construct($sid, $config) {
    $this->sid = $sid;
    $this->config = $config;
    $this->props = array();
    $this->handlers = array();
    $this->eventBuffer = array();
    $this->broadcast = new SocketBroadcast($this);
  }

  /**
   * Add a handler for a message type.
   *
   * @param $msg string The message type.
   * @param $fn function The handler invoke when this socket receives a message.
   *
   * @author DanielWHoward
   **/
  function on($msg, $fn) {
    $this->handlers[$msg] = $fn;
  }

  /**
   * Invoke the handler for a message.
   *
   * @param $msg string The message type.
   * @param $data mixed The message contents.
   *
   * @author DanielWHoward
   **/
  function handle($msg, $data) {
    $this->handlers[$msg]($data);
  }

  /**
   * Send a message to this socket.
   *
   * @param $msg string The message type.
   * @param $data mixed The message contents.
   *
   * @author DanielWHoward
   **/
  function emit($typ, $data) {
    $event = array($typ, $data);
    if ($this->sid === '') {
      $this->eventBuffer[] = $data;
    } else {
      // get event values
      $to = $this->sid;
      $json = json_encode($event);
      $json = $json === '[]'? '{}': $json;
      // send the event to this socket
      $now = date('Y-m-d H:i:s', time());
      $q = 'INSERT INTO `'.$this->config['impl']->prefix.'sockets_events` '
        .'(`id`, `sid`, `event`, `touched`) VALUES ('
        ."0,"
        ."'".$this->config['impl']->mysql_real_escape_string($to)."', "
        ."'".$this->config['impl']->mysql_real_escape_string($json)."', "
        ."'".$this->config['impl']->mysql_real_escape_string($now)."');";
      $qr = &$this->config['impl']->mysql_query($q);
    }
  }

  /**
   * Emit an array as JSON or JSONP.
   *
   * @param $json mixed An array to be converted to JSON.
   *
   * @author DanielWHoward
   **/
  function outputJson($jsonp) {
    // stringify JSON
    $json = json_encode($this->eventBuffer);
    // use JSONP if a callback is provided
    if ($jsonp && isset($_GET['callback'])) {
      header('Content-Type: application/javascript');
      print $_GET['callback'].'('.$json.')';
    } else {
      header('Content-Type: application/json');
      print $json;
    }
  }
}

/**
 * A session management class that supports two
 * options: PHP (file-based) session handling and 
 * separate database-based session handling.
 *
 * The database session handling is needed to
 * support reentrant long-polling Socket.IO-
 * based session handling.  It uses the
 * sockets_sessions database table.
 *
 * @package xibbit
 * @author DanielWHoward
 **/
class SocketSession {
  var $config;
  var $prefix;
  var $builtIn;

  /**
   * Constructor.
   *
   * @author DanielWHoward
   **/
  function __construct($config, $builtIn=false) {
    $this->config = $config;
    $this->prefix = $config['prefix'];
    $this->builtIn = $builtIn;
  }

  /**
   * Start the session.
   *
   * @author DanielWHoward
   **/
  function load() {
    if ($this->builtIn) {
      @session_start();
    } else {
      // pseudo $_SESSION session_start() call
      if (!isset($_COOKIE['SOCKSESSID'])) {
        $length = 25;
        $a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        $socksessid = '';
        for ($i=0; $i < $length; $i++) {
          $socksessid.= $a[$this->config['impl']->rand_secure(0, strlen($a))];
        }
        setcookie('SOCKSESSID', $socksessid);
        $_COOKIE['SOCKSESSID'] = $socksessid;
      }
      $this->touch();
      $q = 'SELECT vars FROM `'.$this->prefix.'sockets_sessions` WHERE socksessid=\''.$_COOKIE['SOCKSESSID'].'\';';
      $qr = $this->config['impl']->mysql_query($q);
      $_SESSION = array();
      while ($s = &$this->config['impl']->mysql_fetch_assoc($qr)) {
        $_SESSION = json_decode($s['vars'], true);
      }
      $this->config['impl']->mysql_free_query($qr);
    }
  }

  /**
   * Save the session.
   *
   * @author DanielWHoward
   **/
  function save() {
    if (!$this->builtIn) {
      $now = date('Y-m-d H:i:s', time());
      $session = json_encode($_SESSION);
      $cookie = $_COOKIE['SOCKSESSID'];
      $q = 'UPDATE `'.$this->prefix.'sockets_sessions` SET '
        .'vars="'.$this->config['impl']->mysql_real_escape_string($session).'", '
        .'touched="'.$this->config['impl']->mysql_real_escape_string($now).'" WHERE '
        .'socksessid=\''.$this->config['impl']->mysql_real_escape_string($cookie).'\';';
      $qr = &$this->config['impl']->mysql_query($q);
    }
  }

  /**
   * Touch the session to keep it alive.
   *
   * @author DanielWHoward
   **/
  function touch() {
    if (!$this->builtIn) {
      $now = date('Y-m-d H:i:s', time());
      $q = 'UPDATE `'.$this->prefix.'sockets_sessions` SET '
        .'touched="'.$this->config['impl']->mysql_real_escape_string($now).'" '
        .'WHERE socksessid=\''.$this->config['impl']->mysql_real_escape_string($_COOKIE['SOCKSESSID']).'\';';
      $qr = &$this->config['impl']->mysql_query($q);
      if (!$qr) {
        $q = 'INSERT INTO `'.$this->prefix.'sockets_sessions` '
          .'(`id`, `socksessid`, `connected`, `touched`, `vars`) VALUES ('
          ."0, "
          ."'".$this->config['impl']->mysql_real_escape_string($_COOKIE['SOCKSESSID'])."', "
          ."'".$this->config['impl']->mysql_real_escape_string($now)."', "
          ."'".$this->config['impl']->mysql_real_escape_string($now)."', "
          ."'".$this->config['impl']->mysql_real_escape_string('{}')."');";
        $qr = &$this->config['impl']->mysql_query($q);
      }
    }
  }
}

/**
 * A socket handling hub object that makes it
 * easy to set up sockets, dispatch client socket
 * packets to a server-side event handler and send
 * packets back to the client.
 *
 * @package xibbit
 * @author DanielWHoward
 **/
class XibbitHub {
  var $config;
  var $suppressCloneSession;
  var $handler_groups;
  var $prefix;
  var $sessions;
  var $socketio;
  var $useSocketIO;
  var $socketSession;
  var $packetsBuffer;
  var $pollingThread;

  /**
   * Constructor.
   *
   * @author DanielWHoward
   **/
  function __construct($config) {
    $config['vars']['hub'] = $this;
    $this->config = $config;
    $this->suppressCloneSession = false;
    $this->socketio = isset($this->config['socketio'])? $this->config['socketio']: new SocketIOWrapper();
    $this->handler_groups = array(
      'api'=>array(),
      'on'=>array(),
      'int'=>array()
    );
    $this->sessions = array(
      array(
        'session_data'=>array(
          'instance_id'=>''
        ),
        '_conn'=>array(
          'sockets'=>array()
        )
      )
    );
    $this->prefix = '';
    if (isset($this->config['mysql']) && isset($this->config['mysql']['SQL_PREFIX'])) {
      $this->prefix = $this->config['mysql']['SQL_PREFIX'];
    } elseif (isset($this->config['mysqli']) && isset($this->config['mysqli']['SQL_PREFIX'])) {
      $this->prefix = $this->config['mysqli']['SQL_PREFIX'];
    }
    $this->useSocketIO = isset($_REQUEST['EIO'])
        && isset($_REQUEST['transport'])
        && ($_REQUEST['transport'] === 'polling');
    if ($this->useSocketIO) {
      $this->packetsBuffer = file_get_contents('php://input');
      $this->pollingThread = ($this->packetsBuffer === '');
    }
    // pseudo $_SESSION
    $this->socketSession = new SocketSession(array(
      'prefix'=>$this->prefix,
      'impl'=>$this
    ), !$this->useSocketIO && !isset($_COOKIE['SOCKSESSID']));
    $this->socketSession->load();
    // create separate instance for every tab even though they share session cookie
    if (isset($_REQUEST['instance'])) {
      $instance = $_REQUEST['instance'];
      if (!isset($_SESSION['instance_'.$instance])) {
        $_SESSION['instance_'.$instance] = array(
          'instance'=>$instance
        );
        // save pseudo $_SESSION
        $this->socketSession->save();
      }
      if (is_string($instance) && ($instance !== '') && isset($_SESSION['instance_'.$instance])) {
        $this->sessions[0]['session_data'] = $_SESSION['instance_'.$instance];
        $this->sessions[0]['session_data']['instance_id'] = $this->sessions[0]['session_data']['instance'];
        unset($this->sessions[0]['session_data']['instance']);
      }
    }
    if (!isset($this->config['poll'])) {
      $this->config['poll'] = array();
    }
    $this->touch($this->sessions[0]['session_data']);
  }

  /**
   * Return the Socket.IO instance.
   *
   * This might be the Socket.IO server instance
   * or the Socket.IO library instance.
   *
   * @return The Socket.IO instance.
   *
   * @author DanielWHoward
   **/
  function getSocketIO() {
    return $this->socketio;
  }

  /**
   * Get the session associated with a socket which always
   * has a session_data key and a _conn key.  The _conn key
   * has a map that contains a sockets key with an array of
   * sockets.  A socket is globally unique in the sessions
   * object.
   *
   * There is an instance_id key in the session_data map
   * which is globally unique or the empty string.
   *
   * Multiple sockets can be associated with the same
   * session (browser reloads).
   *
   * A socket will not have an instance_id until it receives
   * an _instance event.
   *
   * @param sock Object A socket.
   * @return map The session object with session_data and _conn keys.
   *
   * @author DanielWHoward
   **/
  function &getSession(&$sock) {
    $session = null;
    $i = $this->getSessionIndex($sock);
    if ($i !== -1) {
      $session = $this->cloneSession($this->sessions[$i]);
    }
    return $session;
  }

  /**
   * This is an implementation helper.  It assumes that
   * the session store is an array.
   *
   * @param $sock Object A socket.
   * @returns int The index into a session array.
   *
   * @author DanielWHoward
   **/
  function getSessionIndex(&$sock) {
    for ($s=0; $s < count($this->sessions); ++$s) {
      for ($ss=0; $ss < count($this->sessions[$s]["_conn"]["sockets"]); ++$ss) {
        if ($this->sessions[$s]["_conn"]["sockets"][$ss] === $sock) {
          return $s;
        }
      }
    }
    return -1;
  }

  /**
   * Get the session associated with an instance.
   *
   * @param $instance_id string An instance string.
   * @returns map The session.
   *
   * @author DanielWHoward
   **/
  function &getSessionByInstance($instance_id) {
    if (is_string($instance_id) && ($instance_id !== '')) {
      for ($s=0; $s < count($this->sessions); ++$s) {
        $session = $this->sessions[$s];
        if ($session['session_data']['instance_id'] === $instance_id) {
          return $this->cloneSession($session);
        }
      }
    }
    return null;
  }

  /**
   * Get the session associated with a user (an
   * addressable recepient of a send message).
   *
   * The special &quot;all&quot; username refers
   * to all sessions.
   *
   * @param username string The username.
   *
   * @author DanielWHoward
   **/
  function getSessionsByUsername($instance_id) {
    $sessions = array();
    if ($username === 'all') {
      $sessions = $this->sessions;
    } else {
      for ($s=0; $s < count($this->sessions); ++$s) {
        if ($this->sessions[$s]['session_data']['_username'] === username) {
          $sessions[] = $this->sessions[$s];
        }
      }
    }
    return $sessions;
  }

  /**
   * Change the session associated with a socket.
   *
   * @param $sock Object A socket.
   * @param $session Object The session values.
   *
   * @author DanielWHoward
   **/
  function setSessionData($sock, $sessionData) {
    $i1 = $this->getSessionIndex($sock);
    if ($i1 === -1) {
    } else {
      $clone = $this->cloneSession($sessionData);
      $this->sessions[$i1]["session_data"] = $clone;
      $this->sessions[$i1]["_conn"]["sockets"][] = $sock;
      $instance = $sessionData['instance_id'];
      if ($instance !== '') {
        $_SESSION['instance_'.$instance] = $sessionData;
        unset($_SESSION['instance_'.$instance]['instance_id']);
        $_SESSION['instance_'.$instance]['instance'] = $instance;
        // save pseudo $_SESSION
        /*$this->socketSession->save();*/
      }
    }
  }

  /**
   * Add a new, empty session only for this socket.
   *
   * @param $sock Object A socket.
   *
   * @author DanielWHoward
   **/
  function addSession($sock) {
    $session = array(
      'session_data'=>array(
        'instance_id'=>''
      ),
      '_conn'=>array(
        'sockets'=>array(
          $sock
        )
      )
    );
    $this->sessions[] = $session;
  }

  /**
   * Remove the socket from the session or the whole session
   * if it is the only socket.
   *
   * @param $sock Object A socket.
   *
   * @author DanielWHoward
   **/
  function removeSocketFromSession($sock) {
    //TODO unimplemented removeSocketFromSession()
  }

  /**
   * Delete the session that contains a socket and
   * add the socket to the session which represents
   * an instance.
   *
   * When a socket connects, it is assigned to a new
   * empty session but, when the _instance event
   * arrives, that socket might need to be assigned
   * to an existing session and the new session
   * destroyed.
   *
   * @param $instance_id string The instance to add the socket to.
   * @param $sock Object The socket to be moved.
   *
   * @author DanielWHoward
   **/
  function combineSessions($instance_id, $sock) {
/*    $i = $this->getSessionIndex($sock);
    array_splice($this->sessions, $i, 1);
    for ($s=0; $s < count($this->sessions); ++$s) {
      if ($this->sessions[$s]['session_data']['instance_id'] === $instance_id) {
        $this->sessions[$s]['_conn']['sockets'][] = $sock;
        break;
      }
    }*/
  }

  /**
   * Return a duplicate of the session with no shared
   * pointers except for the special _conn key, if it
   * exists.  This method works for the entire session
   * or just the session_data in a session.
   *
   * A clone prevents a common coding error where the
   * code relies on shared pointers rather than using
   * the setSessionData() method.
   *
   * The usual implementation is to convert to JSON and
   * then back again.  For some types, a workaround must
   * be implemented.
   *
   * @param $session map The session or session_data.
   * @return map The clone.
   *
   * @author DanielWHoward
   **/
  function cloneSession($session) {
    if ($this->suppressCloneSession) {
      return $session;
    }
    $_conn = null;
    if (isset($session['_conn'])) {
      $_conn = $session['_conn'];
      unset($session['_conn']);
    }
    $clone = json_decode(json_encode($session), true);
    if ($_conn !== null) {
      $clone['_conn'] = $_conn;
      $session['_conn'] = $_conn;
    }
    return $clone;
  }

  /**
   * Return a JSON string with keys in a specific order.
   *
   * @param $s string A JSON string with keys in random order.
   * @param $first array An array of key names to put in order at the start.
   * @param $last array An array of key names to put in order at the end.
   *
   * @author DanielWHoward
   **/
  function reorderJson($s, $first, $last) {
    // create JSON maps
    $source = json_decode($s, true);
    $target = &reorderMap($source, $first, $last);
    return json_encode($target);
  }

  /**
   * Some associative arrays have their keys stored in a
   * specific order.
   *
   * Return a hashtable with keys in a specific order.
   *
   * @param $source map A JSON string with keys in random order.
   * @param $first array An array of key names to put in order at the start.
   * @param $last array An array of key names to put in order at the end.
   *
   * @author DanielWHoward
   **/
  function &reorderMap(&$source, $first, $last) {
    // create JSON maps
    $target = array();
    // save the first key-value pairs
    foreach ($first as $key) {
      if (isset($source[$key])) {
        $target[$key] = $source[$key];
      }
    }
    // save the non-first and non-last key-value pairs
    foreach ($source as $key=>$value) {
      if (!in_array($key, $first) && !in_array($key, $last)) {
        $target[$key] = $value;
      }
    }
    // save the last key-value pairs
    foreach ($last as $key) {
      if (isset($source[$key])) {
        $target[$key] = $source[$key];
      }
    }
    return $target;
  }

  /**
   * Start the xibbit server system.
   *
   * @param $method string An event handling strategy.
   *
   * @author DanielWHoward
   **/
  function start($method='best') {
    $self = $this;
    if ((isset($_REQUEST['EIO'])
        && isset($_REQUEST['transport'])
        && ($_REQUEST['transport'] === 'polling'))
        || isset($_REQUEST['XIO'])) {
      // the connection values
      $socket = &$this->socketio->wrapSocket('', array('impl'=>$this));
      $self->sessions[0]['_conn']['sockets'][] = $socket;

      // socket connected
      $socket->on('connect', function($event) use ($self, $socket) {
        $session = &$self->getSession($socket);
        if ($session === null) {
          $self->addSession($socket);
        }
      });
      // decode the event
      $socket->on('server', function($event) use ($self, &$socket) {
        $allowedKeys = array('_id');
        $allowedTypes = array('_instance');
        $session = &$self->getSession($socket);
        // process the event
        $events = array();
        $handled = false;
        if (!is_array($event)) { // is_map
          // the event is not JSON
          $event = array();
          $event['e'] = 'malformed--json';
          $events[] = array('client', $event);
          $handled = true;
        }
        if (!$handled && (count($event) > 0)) {
          // see if the event has illegal keys
          foreach ($event as $key=>$value) {
            // _id is a special property so sender can invoke callbacks
            $malformed = (substr($key, 0, 1) === '_') && !in_array($key, $allowedKeys);
            if ($malformed) {
              $event['e'] = 'malformed--property';
              $events[] = array('client', $event);
              $handled = true;
              break;
            }
          }
          if (!$handled) {
              // see if there is no event type
            if (!isset($event['type'])) {
              $event['e'] = 'malformed--type';
              $events[] = array('client', $event);
              $handled = true;
            }
            if (!$handled) {
              // see if event type has illegal value
              $typeStr = is_string($event['type'])? $event['type']: '';
              $typeValidated = preg_match('/[a-z][a-z_]*/', $typeStr) === 1;
              if (!$typeValidated) {
                $typeValidated = in_array($typeStr, $allowedTypes);
              }
              if (!$typeValidated) {
                $event['e'] = 'malformed--type:'.$event['type'];
                $events[] = array('client', $event);
                $handled = true;
              }
            }
            // handle _instance event
            if (!$handled && ($event['type'] === '_instance')) {
              $created = 'retrieved';
              // instance value in event takes priority over $_REQUEST instance
              $instance = isset($_REQUEST['instance'])? $_REQUEST['instance']: '';
              $instance = isset($event['instance'])? $event['instance']: $instance;
              // recreate session
              if ($this->getSessionByInstance($instance) === null) {
                $instanceMatched = preg_match('/^[a-zA-Z0-9]{25}$/', $instance) === 1;
                if ($instanceMatched) {
                  $created = 'recreated';
                } else {
                  $length = 25;
                  $a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                  $instance = '';
                  for ($i=0; $i < $length; $i++) {
                    $instance .= $a[$self->rand_secure(0, strlen($a))];
                  }
                  $created = 'created';
                }
                // create a new instance for every tab even though they share session cookie
                $event['instance'] = $instance;
                // save new instance_id in session
                $session['session_data']['instance_id'] = $instance;
                $self->setSessionData($socket, $session['session_data']);
                $self->socketSession->save();
              } else {
                $this->combineSessions($instance, $socket);
              }
              // update request with instance for convenience
              $session = $this->getSessionByInstance($instance);
              $event['i'] = 'instance '.$created;
              $_REQUEST['instance'] = $instance;
              if ($this->useSocketIO) {
                $syncEvent = array('instance'=>$instance);
                $self->send($syncEvent, $socket->sid.'_sync', true);
              }
            }
            // handle the event
            if (!$handled) {
              $event['_session'] = $session['session_data'];
              $event['_conn'] = array(
                'socket'=>$socket
              );
              $eventReply = $self->trigger($event);
              // save session changes
              $self->setSessionData($socket, $eventReply['_session']);
              // remove the session property
              if (isset($eventReply['_session'])) {
                unset($eventReply['_session']);
              }
              // remove the connection property
              if (isset($eventReply['_conn'])) {
                unset($eventReply['_conn']);
              }
              // _instance event does not require an implementation; it's optional
              if (($eventReply['type'] === '_instance') && isset($eventReply['e'])
                  && ($eventReply['e'] === 'unimplemented')) {
                unset($eventReply['e']);
              }
              // reorder the properties so they look pretty
              $reorderedEventReply = &$self->reorderMap($eventReply,
                array('type', 'from', 'to', '_id'),
                array('i', 'e')
              );
              $events[] = array('client', $reorderedEventReply);
              $handled = true;
            }
          }
        }
        // emit all events
        for ($e=0; $e < count($events); ++$e) {
          $socket->emit($events[$e][0], $events[$e][1]);
        }
      });
      // socket disconnected
      $socket->on('disconnect', function($event) use ($self, $socket) {
        $self->removeSocketFromSession($socket);
        $this->checkClock();
      });

      $socket->handle('connect', array());
      $this->readAndWriteSocket($socket);
      $socket->handle('disconnect', array());
    }
  }

  /**
   * Execute the socket.  Decode the request and either handle the
   * packets (manipulate the socket) or wait on the database for 20+
   * seconds (long polling to see if any packets are read from the
   * socket).
   *
   * @param $socket object A socket.
   *
   * @author DanielWHoward
   **/
  function readAndWriteSocket(&$socket) {
    $events = array();
    if ($this->useSocketIO) {
      $packetsIn = $this->readPayload($this->packetsBuffer);
      $packetsOut = array();

      if (isset($_REQUEST['sid'])) {
        $localSid = $_REQUEST['sid'];
        if ($this->pollingThread) {
          // check for events for a while
          for ($w=0; ($w < 80) && (count($packetsOut) === 0); ++$w) {
            if (!isset($_REQUEST['instance'])) {
              $instance = null;
              $events = $this->receive($events, $this->sessions[0]['session_data'], true, $localSid.'_sync');
              if (count($events) > 0) {
                if (isset($events[0][1]['instance'])) {
                  $instance = $events[0][1]['instance'];
                }
                $events = array();
              }
              if ($instance !== null) {
                $_REQUEST['instance'] = $instance;
                $this->sessions[0]['session_data']['instance_id'] = $instance;
              }
            }
            if (isset($_REQUEST['instance'])) {
              $this->checkClock();
              // read events sent to this socket from itself
              foreach ($socket->eventBuffer as $emittedEvent) {
                $packetsOut[] = $this->createPacket(4, '2'.$emittedEvent);
              }
              // read events sent to this socket from other sockets
              $events = $this->receive($events, $this->sessions[0]['session_data']);
              foreach ($events as $event) {
                $packetsOut[] = $this->createPacket(4, '2'.json_encode($event));
              }
            }
            // wait for 1/4 second
            usleep(250000);
          }
          // return the packets to the client
          $payload = $this->createPayload($packetsOut);
          if ($payload === '') {
            $payload = '1:3';
          }
          print $payload;
        } else {
          // handle the packets
          $packet = $packetsIn[0];
          $packetTypeId = $this->readPacketTypeId($packet);
          $packetTypeId2 = $this->readPacketTypeId2($packet);
          $packetData = $this->readPacketData($packet);
          if ($packetTypeId === 2) {
            // ping
            print 'ok';
          } elseif ($packetTypeId === 4) {
            if ($packetTypeId2 === 2) {
              $event = json_decode($packetData, true);
              $socket->handle($event[0], $event[1]);
              foreach ($socket->eventBuffer as $emittedEvent) {
                $packetsOut[] = $this->createPacket(4, '2'.$emittedEvent);
              }
              $payload = $this->createPayload($packetsOut);
              print 'ok'.$payload;
            } else {
              print '2:40';
            }
          } else {
            print $this->packetsBuffer;
          }
        }
      } else {
        // create a socket ID for the socket that is being established
        $localSid = '';
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890';
        for ($c=0; $c < 20; ++$c) {
          $localSid .= substr($chars, $this->rand_secure(0, strlen($chars) - 1), 1);
        }
        // do not store any additional values on the new socket
        $props = '{}';
        // save the new socket
        $now = date('Y-m-d H:i:s', time());
        $q = 'INSERT INTO `'.$this->prefix.'sockets` '
          .'(`id`, `sid`, `connected`, `touched`, `props`) VALUES ('
          ."0, "
          ."'".$this->mysql_real_escape_string($localSid)."', "
          ."'".$this->mysql_real_escape_string($now)."', "
          ."'".$this->mysql_real_escape_string($now)."', "
          ."'".$this->mysql_real_escape_string($props)."');";
        $qr = &$this->mysql_query($q);
        // send an open packet
        // pingInterval (default: 25000) how many ms before sending a new ping packet
        // pingTimeout  (default: 5000)  how many ms without a pong packet to consider the connection closed
        $contents = '{"sid":"'.$localSid.'","upgrades":[],"pingInterval":20000,"pingTimeout":60000}';
        $packetsOut[] = $this->createPacket(0, $contents);
        // send a message packet with open packet type id
        $packetsOut[] = $this->createPacket(4, '0');
        $payload = $this->createPayload($packetsOut);
        print $payload;
      }
    } else {
      // set up the connection
      header('Content-Type: application/json');
      $event = $_REQUEST['XIO'];
      if (get_magic_quotes_gpc()) {
        $event = stripslashes($event);
      }
      $this->checkClock();
      // parse the event
      $event = json_decode($event, true);
      $socket->handle('server', $event);
      $events = $this->receive($events, $this->sessions[0]['session_data']);
      for ($e=0; $e < count($events); ++$e) {
        $socket->emit($events[$e][0], $events[$e][1]);
      }
      $socket->outputJson(false);
    }
  }

  /**
   * Package events, execute them and return response events.
   *
   * @param array $fileEvents
   * @return NULL[]
   *
   * @author DanielWHoward
   **/
  function readAndWriteUploadEvent($fileEvents) {
    $fileKeys = array_keys($_FILES);
    $fileEventKeys = array_keys($fileEvents);
    $filesToIgnore = array();
    // map files/properties to one or more events
    for ($k=0; $k < count($fileKeys); ++$k) {
      $matched = false;
      for ($e=0; $e < count($fileEventKeys); ++$e) {
        $event = $fileEventKeys[$e];
        if (substr($fileKeys[$k], 0, strlen($event)) === $event) {
          $prop = substr($fileKeys[$k], strlen($event));
          if (substr($prop, 0, 1) === '_') {
            $prop = substr($prop, 1);
          }
          $fileEvents[$event][$prop] = $_FILES[$fileKeys[$k]];
          $matched = true;
        }
      }
      // ignore files that don't match expected event types
      if (!$matched) {
        $filesToIgnore[] = $_FILES[$fileKeys[$k]]['tmp_name'];
      }
    }
    // trigger all the events
    $events = array();
    foreach ($fileEvents as $event=>$files) {
      if (count($files) > 0) {
        $event = array(
          '_session'=>$this->sessions[0]['session_data'],
          'type'=>$event
        );
        $event = array_merge($event, $files);
        $event = array_merge($event, $_REQUEST);
        unset($event['instance']);
        $eventReply = $this->trigger($event);
        if (isset($eventReply['_session'])) {
          unset($eventReply['_session']);
        }
        $events = $this->array_concat($events, $eventReply);
      }
    }
    return $events;
  }

  /**
   * Provide an authenticated callback for an event.
   *
   * @param $typ string The event to handle.
   * @param $fn mixed A function that will handle the event.
   *
   * @author DanielWHoward
   **/
  function on($group, $typ, $fn) {
    $this->handler_groups[$group][$typ] = $fn;
  }

  /**
   * Search, usually the file system, and dynamically
   * load an event handler for this event, if supported
   * by this language/platform.
   *
   * Some languages/platforms do not support loading code
   * on the fly so this method might do nothing.
   *
   * An error is returned if the handler cannot be loaded,
   * the file is improperly named or other error that the
   * loader may notice.
   *
   * @param $event map The event to handle.
   * @return Exception If the loader had an error.
   *
   * @author DanielWHoward
   **/
  function loadHandler($event) {
    $e = '';
    $eventType = $event['type'];
    $handlerFile = null;
    // get the plugins folder
    $pluginsFolder = null;
    if (isset($this->config['plugins'])
        && isset($this->config['plugins']['folder'])) {
      $pluginsFolder = $this->config['plugins']['folder'];
    }
    // search for the event handler in the plugins folder
    if ($pluginsFolder !== null) {
      $dh = opendir($pluginsFolder);
      if ($dh !== false) {
        $file = readdir($dh);
        while (($file !== false) && ($handlerFile === null)) {
          if (($file !== '.') && ($file !== '..')) {
            $file = $pluginsFolder.'/'.$file.'/server/php/events/'
              .$eventType.'.php';
            if (file_exists($file)) {
              $handlerFile = $file;
            }
          }
          $file = readdir($dh);
        }
      } else {
        $e = 'plugins--missing:'.$pluginsFolder;
        $invoked = true;
      }
    }
    // search for the event handler in the events folder
    if ($handlerFile === null) {
      $file = 'events/'.$eventType.'.php';
      if (file_exists($file)) {
        $handlerFile = $file;
      }
    }
    // try to load the event handler
    if ($handlerFile !== null) {
      $apifn = $this->handler_groups['api'];
      $onfn = $this->handler_groups['on'];
//       $handlerCode = file_get_contents($handlerFile);
//       $handlerCode = str_replace('..', '.', $handlerCode);
      include $handlerFile;
      if (($apifn === $this->handler_groups['api']) && ($onfn === $this->handler_groups['on'])) {
        // found the file but didn't get an event handler
        $e = 'unhandled:'.$handlerFile;
      } elseif (!isset($this->handler_groups['on'][$eventType])
          && !isset($this->handler_groups['api'][$eventType])) {
        // found the file but got an event handler with a different name
        $e = 'mismatch:'.$handlerFile;
      }
    } elseif (!$invoked) {
      // find all the folders that contain handlers
      $handlerFolders = array();
      if ($pluginsFolder !== null) {
        $dh = opendir($pluginsFolder);
        if ($dh !== false) {
          $file = readdir($dh);
          while ($file !== false) {
            if (($file !== '.') && ($file !== '..')
                && is_dir($pluginsFolder.'/'.$file.'/server/php/events')) {
              $handlerFolders[] = $pluginsFolder.$file.'/server/php/events';
            }
            $file = readdir($dh);
          }
          closedir($dh);
        }
      }
      if (is_dir('events')) {
        $handlerFolders[] = 'events';
      }
      // find all the event handler files
      $handlerFiles = array();
      for ($p=0; $p < count($handlerFolders); ++$p) {
        $handlerFolder = $handlerFolders[$p];
        $dh = opendir($handlerFolder);
        if ($dh !== false) {
          $file = readdir($dh);
          while ($file !== false) {
            if (($file !== '.') && ($file !== '..')
                && is_file($handlerFolder.'/'.$file)) {
              $handlerFiles[] = $handlerFolder.'/'.$file;
            }
            $file = readdir($dh);
          }
          closedir($dh);
        }
      }
      // see if some event handler files have similar names
      $misnamed = null;
      if (!in_array($eventType, array('__receive', '__send'))) {
        for ($f=0; $f < count($handlerFiles); ++$f) {
          $file = $handlerFiles[$f];
          $pos = strrpos($file, '/');
          if (is_int($pos) && ($pos >= 0)
              && (substr($file, $pos+1, strlen($eventType.'.')) === $eventType.'.')) {
            $misnamed = $file;
            break;
          }
        }
      }
      if ($misnamed === null) {
        // did not find a file with an event handler
        $e = 'unimplemented';
      } else {
        // found a file with a similar but incorrect name
        $e = 'misnamed:'.$misnamed;
      }
    }
    return $e;
  }

  /**
   * Invoke callbacks for an event.
   *
   * @param $event array The event to handle.
   * @param $useInternalHandlers boolean Look for and invoke internal handlers, too.
   *
   * @author DanielWHoward
   **/
  function trigger($event, $useInternalHandlers=true) {
    // clone the event
    $keysToSkip = array('_conn', '_session', 'image');
    $eventType = $event['type'];
    $eventReply = $this->cloneEvent($event, $keysToSkip);
    foreach ($keysToSkip as $key) {
      if (isset($event[$key])) {
        $eventReply[$key] = $event[$key];
      }
    }
    // determine authentication
    $authenticated = false;
    if (isset($event['_session']) && isset($event['_session']['_username'])
        && ($event['_session']['_username'] !== '')) {
      $authenticated = true;
    }
    // try to find event handler to invoke
    $handler = null;
    $onHandler = isset($this->handler_groups['on'][$eventType])?
        $this->handler_groups['on'][$eventType]: null;
    $apiHandler = isset($this->handler_groups['api'][$eventType])?
        $this->handler_groups['api'][$eventType]: null;
    // try to load event handler dynamically
    if (($onHandler === null) && ($apiHandler === null)) {
      $e = $this->loadHandler($event);
      if ($e !== '') {
        $eventReply['e'] = $e;
      }
    }
    // try to find event handler to invoke again
    $onHandler = isset($this->handler_groups['on'][$eventType])?
        $this->handler_groups['on'][$eventType]: null;
    $apiHandler = isset($this->handler_groups['api'][$eventType])?
        $this->handler_groups['api'][$eventType]: null;
    // determine event handler to invoke
    if (isset($eventReply['e'])) {
      $handler = null;
    } else if (($onHandler !== null) && $authenticated) {
      $handler = $onHandler;
    } else if ($apiHandler !== null) {
      $handler = $apiHandler;
    } else if (($onHandler !== null) && !$authenticated) {
      $handler = null;
      $eventReply['e'] = 'unauthenticated';
    } else {
      $handler = null;
      $eventReply['e'] = 'unimplemented';
    }
    // invoke the handler
    if ($handler !== null) {
      try {
        if (is_string($handler)) {
          $eventReply = call_user_func($handler, $event, $this->config['vars']);
        } else {
          $eventReply = $handler($event, $this->config['vars']);
        }
      } catch (Exception $e) {
        if ($e->getMessage() === '') {
          throw $e;
        }
        $eventReply['e'] = $e->getMessage();
        $eventReply['e_stacktrace'] = $e->getTraceAsString();
      }
    }
    // preserve the special "username" property
    $username = isset($this->sessions[0]['session_data']['_username'])? $this->sessions[0]['session_data']['_username']: null;
    // update the session since the user can change it
    if (isset($eventReply['_session'])) {
      $this->sessions[0]['session_data'] = $eventReply['_session'];
      // restore the special "username" property, overwrite user changes
      if ($username !== null) {
        $this->sessions[0]['session_data']['_username'] = $username;
      }
      if (($username === null) && isset($this->sessions[0]['session_data']['_username'])) {
        unset($this->sessions[0]['session_data']['_username']);
      }
      // update $_SESSION array if it was modified
      if (isset($_REQUEST['instance'])) {
        $instance = $_REQUEST['instance'];
        $_SESSION['instance_'.$instance] = $this->sessions[0]['session_data'];
        $_SESSION['instance_'.$instance]['instance'] = $this->sessions[0]['session_data']['instance_id'];
        unset($_SESSION['instance_'.$instance]['instance_id']);
      }
      //TODO replace __receive _session ignore hack
      // For Socket.IO long polling, __receive() is called
      // during the long poll and main execution but the
      // session data is not synchronized so, if the
      if ($event['type'] !== '__receive') {
        // save pseudo $_SESSION
        $this->socketSession->save();
      }
    }
    return $eventReply;
  }

  /**
   * Send an event to another user.
   *
   * The special &quot;all&quot; recipient
   * sends it to all logged in users.
   *
   * @param $event array The event to send.
   * @param $recipient string The username to send to.
   * @param $emitOnly boolean Just call emit() or invoke __send event, too.
   * @return boolean True if the event was sent.
   *
   * @author DanielWHoward
   **/
  function send($event, $recipient=null, $emitOnly=false) {
    $sent = false;
    $keysToSkip = array('_session', '_conn');
    if ($emitOnly) {
      $address = '';
      if ($recipient !== null) {
        $address = $recipient;
      } elseif (isset($event['to'])) {
        $address = $event['to'];
      }
      if ($address !== '') {
        $socket = null;
        $clone = $this->cloneEvent($event, $keysToSkip);
        if ($address === 'all') {
          $socket = &$this->socketio->wrapSocket('', array('impl'=>$this));
          $sent = $socket->broadcast->emit('client', $clone);
        } else {
          $socket = &$this->socketio->wrapSocket($address, array('impl'=>$this));
          $sent = $socket->emit('client', $clone);
        }
      }
    } else {
      // temporarily remove _session property
      $keysToSkip = array('_session', '_conn', '_id', '__id');
      $clone = $this->cloneEvent($event, $keysToSkip);
      // convert _id to __id
      if (isset($event['_id'])) {
        $clone['__id'] = $event['_id'];
      }
      // provide special __send event for caller to implement aliases, groups, all addresses
      $eventReply = $this->trigger(array(
        'type'=>'__send',
        'event'=>$clone
      ));
      if (isset($eventReply['e']) && ($eventReply['e'] === 'unimplemented')) {
        $this->send($clone, $recipient, true);
      }
      $sent = true;
      // restore properties
      $event = &$this->updateEvent($event, $clone, $keysToSkip);
    }
    return $sent;
  }

  /**
   * Return an array of events for this user.
   *
   * @return array An array of events.
   *
   * @author DanielWHoward
   **/
  function receive($events, $session, $collectOnly=false, $asRecipient='') {
    if ($collectOnly) {
      $newEvents = array();
      $localSid = isset($_REQUEST['sid'])? $_REQUEST['sid']: '';
      $username = isset($session['_username'])? $session['_username']: '';
      $sid = $this->useSocketIO? $localSid: $username;
      if ($asRecipient !== '') {
        $sid = $asRecipient;
      }
      // read events sent to this socket from other sockets
      $ids = array();
      $q = 'SELECT `id`, `event` FROM `'.$this->prefix.'sockets_events` WHERE '
        .'`sid`=\''.$this->mysql_real_escape_string($sid).'\';';
      $qr = &$this->mysql_query($q);
      while ($row = &$this->mysql_fetch_assoc($qr)) {
        $event = json_decode($row['event'], true);
        // _id is only for sender; __id shows sender's id; ___id is the database event id
        if (isset($event['id'])) {
          $event['___id'] = $event['id'];
          unset($event['id']);
        }
        $newEvents[] = $event;
        $ids[] = $row['id'];
      }
      $this->mysql_free_query($qr);
      // remove the events that were read
      $idStr = '';
      foreach ($ids as $id) {
        if ($idStr !== '') {
          $idStr .= ', ';
        }
        $idStr .= $id;
      }
      $q = 'DELETE FROM `'.$this->prefix.'sockets_events` WHERE `id` IN ('.$idStr.');';
      $qr = &$this->mysql_query($q);
      usort($newEvents, array($this, 'cmp'));
      return $this->array_concat($events, $newEvents);
    } else {
      // provide special __receive event for alternative event system
      $eventReply = $this->trigger(array(
        'type'=>'__receive',
        '_session'=>$session
      ));
      if (($eventReply['type'] === '__receive') && isset($eventReply['eventQueue']) && (!isset($eventReply['e']) || ($eventReply['e'] !== 'unimplemented'))) {
        for ($q=0; $q < count($eventReply['eventQueue']); ++$q) {
          $events[] = array('client', $eventReply['eventQueue'][$q]);
        }
      }
      return $this->receive($events, $session, true);
    }
  }

  /**
   * Connect or disconnect a user from the event system.
   *
   * @param $event array The event to connect or disconnect.
   * @param $connect boolean Connect or disconnect.
   * @return array The modified event.
   *
   * @author DanielWHoward
   **/
  function connect($event, $username, $connect) {
    // update last connection time for user in the database
    $connected = $connect? date('Y-m-d H:i:s', time()): '1970-01-01 00:00:00';
    $q = 'UPDATE `'.$this->prefix.'users` SET '
      .'`connected`=\''.$connected.'\','
      .'`touched`=\''.$connected.'\' '
      .'WHERE `username` = \''.$username.'\';';
    $qr = &$this->mysql_query($q);
    // update username variables
    $instance = isset($_REQUEST['instance'])? $_REQUEST['instance']: null;
    if ($this->getSessionByInstance($instance) !== null) {
      if ($connect) {
        $event['_session']['_username'] = $username;
        $this->sessions[0]['session_data']['_username'] = $username;
      } else {
        if (isset($event['_session']['_username'])) {
          unset($event['_session']['_username']);
        }
        if (isset($this->sessions[0]['session_data']['_username'])) {
          unset($this->sessions[0]['session_data']['_username']);
        }
      }
    }
    return $event;
  }

  /**
   * Update the connected value for this user.
   *
   * @author DanielWHoward
   **/
  function touch($sessionData) {
    if (isset($sessionData['_username'])) {
      $username = $sessionData['_username'];
      // update last ping for this user in the database
      $touched = date('Y-m-d H:i:s', time());
      $nullDateTime = '1970-01-01 00:00:00';
      $q = 'UPDATE `' . $this->prefix . 'users` SET `touched` = \'' . $touched . '\' WHERE '
        .'`username` = \'' . $username . '\' && '
        .'`connected` <> \'' . $nullDateTime . '\';';
      $qr = &$this->mysql_query($q);
    }
  }

  /**
   * Garbage collector.
   *
   * @author DanielWHoward
   **/
  function checkClock() {
    $disconnect_seconds = 2 * 60;
    // try to lock the global variables
    if ($this->lockGlobalVars()) {
      $globalVars = $this->readGlobalVars();
      // create tick and lastTick native time objects
      $tick = time();
      $lastTick = $tick;
      if (isset($globalVars['_lastTick']) && is_string($globalVars['lastTick'])) {
        $lastTickObject = strtotime($globalVars['_lastTick']);
        if ($lastTickObject !== false) {
          $lastTick = $lastTickObject;
        }
      }
      if (isset($globalVars['_lastTick'])) {
        unset($globalVars['_lastTick']);
      }
      // provide special __clock event for housekeeping
      $eventReply = $this->trigger(array(
        'type'=>'__clock',
        'tick'=>$tick,
        'lastTick'=>$lastTick,
        'globalVars'=>$globalVars
      ));
      // remove stale sessions
      $this->updateExpired('users', $disconnect_seconds);
      $this->deleteExpired('sockets', $disconnect_seconds);
      $this->deleteExpired('sockets_events', $disconnect_seconds);
      $this->deleteExpired('sockets_sessions', $disconnect_seconds, ' AND `socksessid` NOT IN (\'global\', \'lock\')');
      // write and unlock global variables
      $globalVars = $eventReply['globalVars'];
      $globalVars['_lastTick'] = date('Y-m-d H:i:s', $tick);
      $this->writeGlobalVars($globalVars);
      $this->unlockGlobalVars();
    }
  }

  /**
   * Return user status, permissions, etc.
   *
   * @param $username string The user name of the user to retrieve.
   * @return array The user.
   *
   * @author DanielWHoward
   **/
  function getUser($username) {
    $user = null;
    // read user from database
    $q = 'SELECT * FROM `'.$this->prefix.'users` '
      .'WHERE `username`=\''.$username.'\';';
    $qr = &$this->mysql_query($q);
    if ($row = &$this->mysql_fetch_assoc($qr)) {
      // integrate the 'json' column with the row
      if (isset($row['json'])) {
        $row = array_merge($row, json_decode($row['json'], true));
      }
      unset($row['json']);
      $user = $row;
    }
    return $user;
  }

  /**
   * Return all users' status, permissions, etc.
   *
   * @return array An array of users.
   *
   * @author DanielWHoward
   **/
  function getUsers() {
    $users = array();
    // read user from database
    $q = 'SELECT * FROM `'.$this->prefix.'users`;';
    $qr = &$this->mysql_query($q);
    while ($row = &$this->mysql_fetch_assoc($qr)) {
      // integrate the 'json' column with the row
      if (isset($row['json'])) {
        $row = array_merge($row, json_decode($row['json'], true));
        unset($row['json']);
      }
      $users[] = $row;
    }
    return $users;
  }

  /**
   * Update rows that have not been touched recently.
   *
   * @param $secs int A number of seconds.
   *
   * @author DanielWHoward
   **/
  function updateExpired($table, $secs, $clause='') {
    $expiration = date('Y-m-d H:i:s', time() - $secs);
    $nullDateTime = '1970-01-01 00:00:00';
    $q = 'UPDATE `'.$this->prefix.$table.'` SET '
      .'connected=\''.$nullDateTime.'\', '
      .'touched=\''.$nullDateTime.'\' '
      .'WHERE (`touched` < \''.$expiration.'\''.$clause.');';
    $qr = &$this->mysql_query($q);
  }

  /**
   * Delete rows that have not been touched recently.
   *
   * @param $secs int A number of seconds.
   *
   * @author DanielWHoward
   **/
  function deleteExpired($table, $secs, $clause='') {
    $expiration = date('Y-m-d H:i:s', time() - $secs);
    $q = 'DELETE FROM `'.$this->prefix.$table.'` '
      .'WHERE (`touched` < \''.$expiration.'\''.$clause.');';
    $qr = &$this->mysql_query($q);
  }

  /**
   * Delete rows in the first table that don't have a row in the second table.
   *
   * This is a way to manually enforce a foreign key constraint.
   *
   * @param $table string A table to delete rows from.
   * @param $column string A column to try to match to a column in the other table.
   * @param $table2 string The other table that should have a corresponding row.
   * @param $column2 string A column of the other table to match against.
   *
   * @author DanielWHoward
   **/
  function deleteOrphans($table, $column, $table2, $column2) {
    $q = 'DELETE FROM `'.$this->prefix.$table.'` '
      .'WHERE NOT EXISTS (SELECT * FROM `'.$this->prefix.$table2.'` '
      .'WHERE `'.$column2.'`=`'.$this->prefix.$table.'`.`'.$column.'`);';
    $qr = &$this->mysql_query($q);
  }

  /**
   * Concatenate arrays with numerical indices.
   *
   * @param $a array An array to concentate.
   * @return array The concatenated array.
   *
   * @author DanielWHoward
   **/
  function array_concat($a, $b, $c=array(), $d=array()) {
    return array_merge($a, $b, $c, $d);
  }

  /**
   * Sort events by the __id database property.
   *
   * @param $a array An event.
   * @param $b array A different event.
   * @return int 1, -1 or 0.
   *
   * @author DanielWHoward
   **/
  function cmp($a, $b) {
    if (!isset($a['___id']) || !isset($b['___id'])) {
      return 0;
    }
    return $a['___id'] > $b['___id']? 1: ($a['___id'] < $b['___id']? -1: 0);
  }

  /**
   * Create a clone with a subset of key-value pairs.
   *
   * Often, there are unneeded or problematic keys
   * that are better to remove or copy manually to
   * the clone.
   *
   * @param $event array An event to clone.
   * @param $keysToSkip An array of keys to not copy to the clone.
   *
   * @author DanielWHoward
   **/
  function &cloneEvent(&$event, &$keysToSkip) {
    // clone the event
    $clone = array();
    foreach ($event as $key=>$value) {
      if (!in_array($key, $keysToSkip)) {
        $clone[$key] = $value;
      }
    }
    return $clone;
  }

  /**
   * Update the key-value pairs of an event using
   * the key-value pairs from a clone.
   *
   * This will only overwrite changed key-value
   * pairs; it will not copy unchanged key-value
   * pairs or remove keys.
   *
   * @param $event array A target event.
   * @param $clone array A source event.
   * @param $keysToSkip An array of keys to not copy from the clone.
   *
   * @author DanielWHoward
   **/
  function &updateEvent(&$event, &$clone, &$keysToSkip) {
    foreach ($clone as $key=>$value) {
      if (!in_array($key, $keysToSkip)) {
        if (!isset($event[$key]) || ($event[$key] !== $clone[$key])) {
          $event[$key] = $clone[$key];
        }
      }
    }
    return $event;
  }

  /**
   * Return a random number in a range.
   *
   * @param $min int The minimum value.
   * @param $max int The maximum value.
   * @return A random value.
   *
   * @author DanielWHoward
   **/
  function rand_secure($min, $max) {
    $log = log(($max - $min), 2);
    $bytes = (int) ($log / 8) + 1;
    $bits = (int) $log + 1;
    $filter = (int) (1 << $bits) - 1;
    do {
      $rnd = hexdec(bin2hex(openssl_random_pseudo_bytes($bytes)));
      $rnd = $rnd & $filter; // discard irrelevant bits
    } while ($rnd >= ($max - $min));
    return $min + $rnd;
  }

  /**
   * Return a newly constructed payload from an array
   * of packets.
   *
   * @param $packets array A packet string or an array of packets.
   * @return string The payload.
   *
   * @author DanielWHoward
   **/
  function createPayload($packets) {
    $payload = '';
    if (is_string($packets)) {
      $payload = ''.strlen($packets).':'.$packets;
    } else {
      foreach ($packets as $packet) {
        $payload .= ''.strlen($packet).':'.$packet;
      }
    }
    return $payload;
  }

  /**
   * Return an array of packets decoded from the buffer.
   *
   * @param $buffer string The payload.
   * @return array An array of packets.
   *
   * @author DanielWHoward
   **/
  function readPayload($buffer) {
    $packets = array();
    $colon = strpos($buffer, ':');
    while ($colon !== false) {
      $len = intval(substr($buffer, 0, $colon));
      $packet = substr($buffer, $colon+1, $len);
      $buffer = substr($buffer, $colon+$len+1);
      $colon = strpos($buffer, ':');
      // this is a hack to deal with Pokemon accent characters
      if ($colon === false) {
        $packet .= $buffer;
      }
      $packets[] = $packet;
    }
    return $packets;
  }

  /**
   * Return the packet type ID.
   *
   * @param $packet string The packet.
   * @return int The packet ID inside the packet.
   *
   * @author DanielWHoward
   **/
  function readPacketTypeId($packet) {
    return (strlen($packet) > 0)? intval(substr($packet, 0, 1)): -1;
  }

  /**
   * Return the second packet ID, if any.
   *
   * @param $packet string The packet.
   * @return int The second packet ID, if any, inside the packet.
   *
   * @author DanielWHoward
   **/
  function readPacketTypeId2($packet) {
    return (substr($packet, 0, 2) === '42')? 2: -1;
  }

  /**
   * Return the packet contents.
   *
   * @param $packet string The packet.
   * @return string The contents.
   *
   * @author DanielWHoward
   **/
  function readPacketData($packet) {
    $start = (substr($packet, 0, 2) === '42')? 2: 1;
    return substr($packet, $start);
  }

  /**
   * Return a newly constructed packet.
   *
   * @param $typ int The packet type.
   * @param $data int The packet contents.
   * @return string The packet.
   *
   * @author DanielWHoward
   **/
  function createPacket($typ, $data) {
    return ''.$typ.$data;
  }

  /**
   * Write a string to the client in a long-polling scenario.
   *
   * @param $s string The string to write to the client.
   *
   * @author DanielWHoward
   **/
  function writePacket($data) {
    if (strlen($data) > 0) {
      echo dechex(strlen($data)), "\r\n", $data, "\r\n";
      ob_flush();
      flush();
    }
  }

  /**
   * End the connection in a long-polling scenario.
   *
   * @author DanielWHoward
   **/
  function endPacket() {
    echo "0\r\n\r\n";
    ob_flush();
    flush();
  }

  /**
   * Lock global variable in database for access.
   *
   * @author DanielWHoward
   **/
  function lockGlobalVars() {
    $now = date('Y-m-d H:i:s', time());
    // generate a unique lock identifier
    $length = 25;
    $a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    $lockId = '';
    for ($i=0; $i < $length; $i++) {
      $lockId .= $a[$this->rand_secure(0, strlen($a))];
    }
    $vars = json_encode(array('id'=>$lockId));
    // try to get the lock
    $q = 'INSERT INTO '.$this->prefix.'sockets_sessions '
      .'(`id`, `socksessid`, `connected`, `touched`, `vars`) VALUES ('
      ."0, "
      ."'lock', "
      ."'".$this->mysql_real_escape_string($now)."', "
      ."'".$this->mysql_real_escape_string($now)."', "
      ."'".$this->mysql_real_escape_string($vars)."');";
    $qr = &$this->mysql_query($q);
    $oneAndOnly = $qr? true: false;
    $unlock = $oneAndOnly;
    if ($oneAndOnly) {
      // retrieve lock ID and confirm that it's the same
      $q = 'SELECT vars FROM '.$this->prefix.'sockets_sessions WHERE `socksessid` = \'lock\'';
      $qr = &$this->mysql_query($q);
      if ($qr && ($row = &$this->mysql_fetch_assoc($qr))) {
        $oneAndOnly = ($row['vars'] === $vars)? true: false;
      } else {
        $oneAndOnly = false;
      }
      $this->mysql_free_query($qr);
    }
    if (!$oneAndOnly) {
      // release the lock if it has been too long
      $this->deleteExpired('sockets_sessions', 60, ' AND `socksessid` = \'lock\'');
    }
    return $oneAndOnly;
  }

  /**
   * Unlock global variable in database.
   *
   * @author DanielWHoward
   **/
  function unlockGlobalVars() {
    // release the lock
    $q = 'DELETE FROM '.$this->prefix.'sockets_sessions WHERE socksessid = \'lock\';';
    $qr = &$this->mysql_query($q);
  }

  /**
   * Read global variables from database.
   *
   * @author DanielWHoward
   **/
  function readGlobalVars() {
    $q = 'SELECT vars FROM `'.$this->prefix.'sockets_sessions` WHERE socksessid = \'global\';';
    $qr = &$this->mysql_query($q);
    $vars = array();
    if ($s = &$this->mysql_fetch_assoc($qr)) {
      $vars = json_decode($s['vars'], true);
    }
    $this->mysql_free_query($qr);
    return $vars;
  }

  /**
   * Write global variables to database.
   *
   * @param $vars array The JSON-friendly vars to save.
   *
   * @author DanielWHoward
   **/
  function writeGlobalVars($vars) {
    $now = date('Y-m-d H:i:s', time());
    $s = json_encode($vars);
    $q = 'UPDATE `'.$this->prefix.'sockets_sessions` SET '
      .'`touched` = \''.$now.'\','
      .'`vars` = \''.$s.'\' '
      .'WHERE socksessid=\'global\';';
    $qr = &$this->mysql_query($q);
  }

  /**
   * Flexible mysql_query() function.
   *
   * @param $query String The query to execute.
   * @return The mysql_query() return value.
   *
   * @author DanielWHoward
   **/
  function &mysql_query(&$query) {
    $result = null;
    if (isset($this->config['mysqli'])) {
      $result = $this->config['mysqli']['link']->query($query);
    } elseif (isset($this->config['mysql']) && isset($this->config['mysql']['link'])) {
      $result = mysql_query($query, $this->config['mysql']['link']);
    } else {
      $result = mysql_query($query);
    }
    if ((substr($query, 0, strlen('UPDATE ')) === 'UPDATE ') && $result) {
      if (isset($this->config['mysqli'])) {
        if ($this->config['mysqli']['link']->affected_rows === 0) {
          $result = false;
        }
      } elseif (isset($this->config['mysql']) && isset($this->config['mysql']['link'])) {
        if (mysqli_affected_rows($this->config['mysql']['link']) === 0) {
          $result = false;
        }
      } else {
        if (mysqli_affected_rows() === 0) {
          $result = false;
        }
      }
    }
    return $result;
  }

  /**
   * Flexible mysql_fetch_assoc() function.
   *
   * @param $result String The result to fetch.
   * @return The mysql_fetch_assoc() return value.
   *
   * @author DanielWHoward
   **/
  function &mysql_fetch_assoc(&$result) {
    $assoc = null;
    if ($result === false) {
      $assoc = false;
    } else if (isset($this->config['mysqli'])) {
      $assoc = $result->fetch_assoc();
    } else {
      $assoc = mysql_fetch_assoc($result);
    }
    return $assoc;
  }

  /**
   * Flexible mysql_free_result() function.
   *
   * @param $result String The result to free.
   * @return The mysql_free_result() return value.
   *
   * @author DanielWHoward
   **/
  function mysql_free_query(&$result) {
    if (isset($this->config['mysqli'])) {
      $result->free_result();
    } elseif (isset($this->config['mysql']) && isset($this->config['mysql']['link'])) {
      mysql_free_result($result, $this->config['mysql']['link']);
    } else {
      mysql_free_result($result);
    }
  }

  /**
   * Flexible mysql_real_escape_string() function.
   *
   * @param $unescaped_string String The string.
   * @return The mysql_real_escape_string() return value.
   *
   * @author DanielWHoward
   **/
  function mysql_real_escape_string($unescaped_string) {
    if (isset($this->config['mysqli'])) {
      return $this->config['mysqli']['link']->real_escape_string($unescaped_string);
    } elseif (isset($this->config['mysql']) && isset($this->config['mysql']['link'])) {
      return mysql_real_escape_string($unescaped_string, $this->config['mysql']['link']);
    }
    return mysql_real_escape_string($unescaped_string);
  }

  /**
   * Flexible mysql_errno() function.
   *
   * @return The mysql_errno() return value.
   *
   * @author DanielWHoward
   **/
  function mysql_errno() {
    if (isset($this->config['mysqli'])) {
      return $this->config['mysqli']['link']->errno;
    } elseif (isset($this->config['mysql']) && isset($this->config['mysql']['link'])) {
      return mysql_errno($this->config['mysql']['link']);
    }
    return mysql_errno();
  }

  /**
   * Flexible mysql_error() function.
   *
   * @return The mysql_error() return value.
   *
   * @author DanielWHoward
   **/
  function mysql_errstr() {
    if (isset($this->config['mysqli'])) {
      return $this->config['mysqli']['link']->error;
    } elseif (isset($this->config['mysql']) && isset($this->config['mysql']['link'])) {
      return mysql_error($this->config['mysql']['link']);
    }
    return mysql_error();
  }
}
?>
