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
 * at.php -- A script meant to be invoked on a regular basis
 * by a cron job to execute various tasks at specific times.
 * Usually, every 15 minutes is good enough.  The cron job can
 * be on any server.
 */
mysqli_report(MYSQLI_REPORT_OFF);
date_default_timezone_set('America/Los_Angeles');
require_once('../config.php');
require_once('../xibdb.php');
require_once('../pfapp.php');

// like Linux crontab except for PHP
$crontab = array(
  '#min hour day mon dow command',
  '0    6    *   *   *   doNothing'
);

// get the current time
$nowtime = time();
$now = date('Y-m-d H:i:s', $nowtime);

// time values
$minutes15 = 15 * 60;

// connect to the MySQL database
$link = @mysqli_connect(
  $sql_host,
  $sql_user,
  $sql_pass
);
@mysqli_select_db($link, $sql_db);

// use the JSON hiberation to easily access the MySQL database
$xibdb = new XibDb(array(
  'json_column'=>'json', // freeform JSON column name
  'sort_column'=>'n', // array index column name
  'mysqli'=>array(
    'link'=>$link,
)));

$pf = new pfapp($xibdb, $sql_prefix);

/**
 * Does nothing for demo purposes only.
 *
 * @author DanielWHoward
 */
function doNothing() {
  // does nothing but could do something at 6 AM every day
}

/**
 * Return a string created from a template
 * and properties.
 *
 * A limited version of ES6 template strings.
 *
 * @author DanielWHoward
 */
function applyTemplate($template, $props) {
  foreach ($props as $key=>$value) {
    $template = str_replace('${'.$key.'}', $value, $template);
  }
  return $template;
}

/**
 * Return a string that is safe for an
 * email subject.
 *
 * @author DanielWHoward
 */
function encodeHtmlToEmailSubject($s) {
  $s = str_replace('&ndash;', '-', $s);
  $s = str_replace('&mdash;', '-', $s);
  $s = str_replace('&rsquo;', '\'', $s);
  return $s;
}

/**
 * Send a daily email.
 *
 * @author DanielWHoward
 */
function emailBackupReport($testEmail='') {
  global $link;
  global $sql_prefix;

  // get the template
  $template = file_get_contents('../templates/backup_report_email.php');
  // read the backup logs from the database
  $q = 'SELECT * FROM '.$sql_prefix."backups WHERE freq='daily'";
  $result = mysqli_query($link, $q);
  $affected = 0;
  while ($result && ($row = mysqli_fetch_assoc($result))) {
    if (($testEmail === '') || ($email === $testEmail)) {
    $to = ($testEmail === '') ? $row['email']: $row['email'];

    // mail headers
    $to = $to;
    $from = $to;
    $subject = '[Public Figure] '.encodeHtmlToEmailSubject('backup report');
    $headers  = 'MIME-Version: 1.0'."\r\n";
    $headers .= 'Content-type: text/html; charset=UTF-8'."\r\n";
    $headers .= 'From: '.$from."\r\n";

    // create email from template
    $props = array(
      'to'=>$to,
      'from'=>$from,
      'subject'=>$subject,
      'headers'=>$headers,
      'num'=>'0',
      'but'=>''
    );
    $content = applyTemplate($template, $props);

    // remove first and last lines which hide template on PHP
    $content = substr($content, strpos($content, "\n") + 1);
    $content = substr($content, 0, strrpos($content, "\n"));
    // remove unneeded whitespace from content
    $content = preg_replace('/ {2,}/', ' ', $content);
    // send the email
    $mailed = email($to, $subject, $content, $headers, ' -f '.$from);
    if ($mailed) {
      $affected++;
    }
    }
  }
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
function rand_secure_at($min, $max) {
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
 * Run any cron jobs that are overdue.
 *
 * @param $crontab array The array of cron job definitions.
 *
 * @author DanielWHoward
 **/
function executeCrontab($crontab) {
  global $link;
  global $sql_prefix;
  global $nowtime;

  $cmds = array();
  for ($c=0; $c < count($crontab); ++$c) {
    if (strpos($crontab[$c], '#') !== 0) {
      // is this the correct day of the week?
      $daysMap = array(
        'SUN'=>0,
        'MON'=>1,
        'TUE'=>2,
        'WED'=>3,
        'THU'=>4,
        'FRI'=>5,
        'SAT'=>6
      );
      $dow = substr($crontab[$c], 18, 3);
      $dow = ($dow === '*  ')? true: (intval(date('w')) === $daysMap[$dow]);
      if ($dow) {
        // get the arguments from the crontab
        $min = substr($crontab[$c], 0, 3);
        $hour = substr($crontab[$c], 5, 3);
        $day = substr($crontab[$c], 10, 3);
        $mon = substr($crontab[$c], 14, 3);
        $cmd = substr($crontab[$c], 22);
        // get the next time to execute
        $year = date('Y');
        $min = ($min === '*  ')? date('i'): str_pad(intval($min), 2, '0', STR_PAD_LEFT);
        $hour = ($hour === '*  ')? date('H'): str_pad(intval($hour), 2, '0', STR_PAD_LEFT);
        $day = ($day === '*  ')? date('d'):  str_pad(intval($day), 2, '0', STR_PAD_LEFT);
        $mon = ($mon === '*  ')? date('m'):  str_pad(intval($mon), 2, '0', STR_PAD_LEFT);
        $next = $year.'-'.$mon.'-'.$day.' '.$hour.':'.$min.':00';
        // is it past time for the command to be executed for this time period?
        if ($nowtime >= strtotime($next)) {
          // has the command already been executed for this time period?
          $q = 'SELECT MAX(executed) FROM '.$sql_prefix.'at WHERE executed >= \''.$next.'\' AND cmd=\''.$crontab[$c].'\';';
          $result = mysqli_query($link, $q);
          $executed = false;
          if ($result && ($row = mysqli_fetch_array($result))) {
            $executed = ($row[0] !== null);
          }
          if (!$executed) {
            // mark the command as executed
            $daysMap = array('SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT');
            $q = 'INSERT INTO '.$sql_prefix.'at VALUES (0, \''.$crontab[$c].'\', \''.date('Y-m-d H:i:s').'\', \''.$daysMap[intval(date('w'))].'\', \'SELECTED\');';
            $result = mysqli_query($link, $q);
            // verify that the command was marked properly
            $q = 'SELECT MAX(executed) FROM '.$sql_prefix.'at WHERE executed >= \''.$next.'\' AND cmd=\''.$crontab[$c].'\';';
            $result = mysqli_query($link, $q);
            $marked = false;
            if ($result && ($row = mysqli_fetch_array($result))) {
              $marked = ($row[0] !== null);
            }
            // execute the command
            if ($marked) {
              $cmds[] = array($next, $crontab[$c], $cmd);
            }
          }
        }
      }
    }
  }
  // execute all the commands
  for ($c=0; $c < count($cmds); ++$c) {
    $next = $cmds[$c][0];
    $cron = $cmds[$c][1];
    $cmd = $cmds[$c][2];
    // write FAILED to elapsed
    $q = 'UPDATE '.$sql_prefix.'at SET elapsed=\'FAILED\' WHERE executed >= \''.$next.'\' AND cmd=\''.$cron.'\';';
    $result = mysqli_query($link, $q);
    $start = microtime(true);
    $failed = false;
    if ($cmd === 'doNothing') {
      doNothing();
    } else {
      $failed = true;
    }
    if ($failed) {
      // write FAILED to elapsed
      $q = 'UPDATE '.$sql_prefix.'at SET elapsed=\'NOTFOUND\' WHERE executed >= \''.$next.'\' AND cmd=\''.$cron.'\';';
      $result = mysqli_query($link, $q);
    } else {
      // write elapsed time
      $diff = intval(microtime(true) - $start);
      $elapsed = ''.intval(floor($diff / 1000.0)).'.'.str_pad($diff % 1000, 3, '0', STR_PAD_LEFT);
      $q = 'UPDATE '.$sql_prefix.'at SET elapsed=\''.$elapsed.'\' WHERE executed >= \''.$next.'\' AND cmd=\''.$cron.'\';';
      $result = mysqli_query($link, $q);
    }
  }
}

$data = array();

// generate a unique lock identifier
$length = 25;
$a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
$lockId = '';
for ($i=0; $i < $length; $i++) {
  $lockId.= $a[rand_secure_at(0, strlen($a))];
}
$extra = json_encode(array('id'=>$lockId));
// try to de-sync invocations
$sleepms = rand_secure_at(0, 1500);
usleep($sleepms* 1000);
// try to get the lock
$value = "'at', '".$now."', '".$extra."'";
$q = 'INSERT INTO '.$sql_prefix.'locks VALUES ('.$value.')';
$result = mysqli_query($link, $q);
$oneAndOnly = $result? true: false;
$unlock = $oneAndOnly;
if ($oneAndOnly) {
  // try to de-sync invocations
  $sleepms = rand_secure_at(0, 1500);
  usleep($sleepms* 1000);
  // retrieve lock ID and confirm that it's the same
  $q = 'SELECT json FROM '.$sql_prefix.'locks ORDER BY json';
  $result = mysqli_query($link, $q);
  if ($result && ($row = mysqli_fetch_assoc($result))) {
    $oneAndOnly = ($row['json'] === $extra)? true: false;
  } else {
    $oneAndOnly = false;
  }
}

if ($oneAndOnly) {
/////////////////
// START MUTEX //
/////////////////
executeCrontab($crontab);
///////////////
// END MUTEX //
///////////////
} else {
// release the lock if it has been too long
$q = 'SELECT created FROM '.$sql_prefix.'locks WHERE name=\'at\'';
$result = mysqli_query($link, $q);
$row = mysqli_fetch_array($result);
if ($row) {
  $locktime = strtotime($row['created']);
  if ($nowtime > ($locktime + $minutes15)) {
    $unlock = true;
  }
}
}

// release the lock
if ($unlock) {
  $q = 'DELETE FROM '.$sql_prefix.'locks WHERE name=\'at\'';
  $result = mysqli_query($link, $q);
}

$testFunction = isset($_REQUEST['superSecretTrigger'])? $_REQUEST['superSecretTrigger']: '';
if ($testFunction !== '') {
  if ($testFunction === 'emailBackupReport') {
    emailBackupReport();
  }
}

// disconnect from the MySQL database
if ($link) {
  mysqli_close($link);
}

// send response
header('Content-Type: application/json');
print json_encode($data);
?>
