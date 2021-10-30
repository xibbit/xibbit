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
mysqli_report(MYSQLI_REPORT_OFF);
require_once('../config.php');
require_once('./crypt.php');
/**
 * backup.php -- A script that will generate an install.php to
 * reproduce the currrent database.
 */
// get the current time
date_default_timezone_set('America/Los_Angeles');
$now = date('Y-m-d H:i:s');
$emitEol = "\r\n";
// connect to the database
$link = @mysqli_connect($sql_host, $sql_user, $sql_pass);
if (!$link) {
  print '<div class="error">'.$sql_host.' had a MySQL error ('.mysqli_errno().'): '.mysqli_error().'</div>'."\n";
}
// select the database
$result = mysqli_select_db($link, $sql_db);
if (!$result) {
  print '<div class="error">'.$sql_host.' had a MySQL error ('.mysqli_errno($link).'): '.mysqli_error($link).'</div>'."\n";
}
@mysqli_query($link, 'SET NAMES \'utf8\'');

/**
 * Return the packet type ID.
 *
 * @param $packet string The packet.
 * @return int The packet ID inside the packet.
 *
 * @author DanielWHoward
 **/
function backup() {
  global $link;
  global $sql_prefix;
  global $emitEol;

  $script = '';
  $lines = array(
    '<?php',
    '// The MIT License (MIT)',
    '//',
    '// xibbit 1.5.3 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership',
    '//',
    '// Permission is hereby granted, free of charge, to any person obtaining a copy',
    '// of this software and associated documentation files (the "Software"), to deal',
    '// in the Software without restriction, including without limitation the rights',
    '// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell',
    '// copies of the Software, and to permit persons to whom the Software is',
    '// furnished to do so, subject to the following conditions:',
    '//',
    '// The above copyright notice and this permission notice shall be included in all',
    '// copies or substantial portions of the Software.',
    '//',
    '// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR',
    '// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,',
    '// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE',
    '// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER',
    '// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,',
    '// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE',
    '// SOFTWARE.',
    '//',
    '// @version 1.5.3',
    '// @copyright xibbit 1.5.3 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership',
    '// @license http://opensource.org/licenses/MIT',
    'require \'config.php\';',
    'require \'pwd.php\';',
    '?>',
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '<meta charset="UTF-8">',
    '<title>installation</title>',
    '<style>',
    '.warn {',
    '  background-color: yellow;',
    '}',
    '.error {',
    '  background-color: red;',
    '}',
    '</style>',
    '</head>',
    '<body>',
    '<?php',
    '// get the current time',
    'date_default_timezone_set(\'America/Los_Angeles\');',
    '$now = date(\'Y-m-d H:i:s\');',
    '$daysMap = array(\'SUN\', \'MON\', \'TUE\', \'WED\', \'THU\', \'FRI\', \'SAT\');',
    '// connect to the database',
    '$link = @mysqli_connect($sql_host, $sql_user, $sql_pass);',
    'if (!$link) {',
    '  print \'<div class="error">\'.$sql_host.\' had a MySQL error (\'.mysqli_errno().\'): \'.mysqli_error().\'</div>\'."\n";',
    '}',
    '// create the database',
    '$q = \'CREATE DATABASE `\'.$sql_db.\'`\';',
    '$result = @mysqli_query($link, $q);',
    'if (!$result) {',
    '  if (mysqli_errno($link) == 1007) {',
    '  } else {',
    '    print \'<div class="error">\'.$sql_host.\' had a MySQL error (\'.mysqli_errno($link).\'): \'.mysqli_error($link).\'</div>\'."\n";',
    '  }',
    '}',
    '// select the database',
    '$result = mysqli_select_db($link, $sql_db);',
    'if (!$result) {',
    '  print \'<div class="error">\'.$sql_host.\' had a MySQL error (\'.mysqli_errno($link).\'): \'.mysqli_error($link).\'</div>\'."\n";',
    '}',
    '@mysqli_query($link, \'SET NAMES \\\'utf8\\\'\');'
  );
  $script .= implode($emitEol, $lines).$emitEol;

  $tables = array();
  $tables[] = 'sockets';
  $tables[] = 'sockets_events';
  $tables[] = 'sockets_sessions';
  $tables[] = 'locks';
  $tables[] = 'at';
  $tables[] = 'instances';
  $tables[] = 'users';
  $tablesSkipData = array();
  $tablesSkipData[] = 'sockets';
  $tablesSkipData[] = 'sockets_events';
  $tablesSkipData[] = 'sockets_sessions';
  $tablesSkipData[] = 'locks';
  $tablesSkipData[] = 'instances';
  foreach ($tables as $table) {
    $fields = array();
    $auto_increment_field = '';
    $auto_increment_value = 0;
    $auto_increment_seq = 0;
    $definitions = '';
    $extra = '';
    $q = 'SELECT COUNT(*) FROM `'.$sql_prefix.$table.'`;';
    $qr_count = mysqli_query($link, $q);
    $numRows = mysqli_num_rows($qr_count);
    $q = 'DESCRIBE `'.$sql_prefix.$table.'`;';
    $qr_describe = mysqli_query($link, $q);
    $numFields = mysqli_num_rows($qr_describe);
    while ($desc = mysqli_fetch_assoc($qr_describe)) {
      $fields[$desc['Field']] = $desc;
      $columnField = $desc['Field'];
      $columnType = ' '.$desc['Type'];
      $columnNull = ($desc['Null'] === 'NO')? ' NOT NULL': '';
      $columnKey = $desc['Key'];
      $columnDefault = '';
      $columnExtra = ($desc['Extra'] === '')? '': ' '.$desc['Extra'];
      // comment out this section to always force auto_incrememt during creation
      if (!in_array($table, $tablesSkipData) && ($numRows > 0) && ($desc['Extra'] === 'auto_increment')) {
        $auto_increment_field = $columnField;
        $columnExtra = '';
      }
      $comment = ($desc['Type']=== 'datetime')? ' // 2014-12-23 06:00:00 (PST)': '';
      $definitions .= '  .\'`'.$columnField.'`'.$columnType.$columnNull.$columnDefault.$columnExtra.',\''.$comment.$emitEol;
      if (($desc['Key'] === 'PRI') || ($desc['Key'] === 'UNI')) {
        $extra .= 'UNIQUE KEY `'.$columnField.'` (`'.$columnField.'`)';
      }
    }
    $lines = array(
      '// create the '.$table.' table',
      '$q = \'CREATE TABLE `\'.$sql_prefix.\''.$table.'` ( \'',
      $definitions.'  .\''.$extra.');\';',
      'if (!mysqli_query($link, $q)) {',
      '  if (mysqli_errno($link) == 1050) {',
      '    print \'<div class="warn">Table \'.$sql_prefix.\''.$table.' already exists!</div>\'."\n";',
      '  } else {',
      '    print \'<div class="error">\'.$sql_host.\' had a MySQL error (\'.mysqli_errno($link).\'): \'.mysqli_error($link).\'</div>\'."\n";',
      '  }',
      '} else {',
      '  print \'<div>\'.$q.\'</div>\'."\n";',
      '}'
    );
    $script .= $emitEol.implode($emitEol, $lines).$emitEol;

    if (!in_array($table, $tablesSkipData)) {
      $q = 'SELECT * FROM `'.$sql_prefix.$table.'` ORDER BY id;';
      $qr = mysqli_query($link, $q);
      if (gettype($qr) === 'boolean') {
        $q = 'SELECT * FROM `'.$sql_prefix.$table.'`;';
        $qr = mysqli_query($link, $q);
      }
      if (mysqli_num_rows($qr) > 0) {
        $lines = array(
          '// add data to the '.$table.' table',
          '$q = \'SELECT id FROM \'.$sql_prefix.\''.$table.'\';',
          '$result = mysqli_query($link, $q);',
          'if (mysqli_num_rows($result) == 0) {',
          '  $values = array();'
        );
        $script .= implode($emitEol, $lines).$emitEol;

        while ($row = mysqli_fetch_assoc($qr)) {
          $script .= '  $values[] = "';
          $nFields = 0;
          foreach ($row as $key => $value) {
            $value = str_replace('"', '\\"', $value);
            $data = '';
            if (($fields[$key]['Type'] === 'bigint(20) unsigned') || ($fields[$key]['Type'] === 'bigint(20)') || ($fields[$key]['Type'] === 'tinyint(1)')) {
              $data = intval($value);
              if (($auto_increment_field === '') && ($fields[$key]['Extra'] === 'auto_increment')) {
                $data = 0;
              } else if ($auto_increment_field === $fields[$key]['Field']) {
                if (($auto_increment_seq === 0) && ($data !== ($auto_increment_value + 1))) {
                  $auto_increment_seq = $data;
                }
                if ($data > $auto_increment_value) {
                  $auto_increment_value = $data;
                }
              }
            } elseif (substr($value, 0, 1) === '$') {
              $data = '\'".\''.$value.'\'."\'';
            } else {
              $value = str_replace('\'', '\\\'', $value);
              $data = '\''.$value.'\'';
            }
            if ($nFields < ($numFields - 1)) {
              $data .= ', ';
            }
            $script .= $data;
            ++$nFields;
          }
          $script .= '";'.$emitEol;
        }
        $lines = array(
          '  $values = isset($values_'.$table.')? $values_'.$table.': $values;',
          '  foreach ($values as $value) {',
          '    $q = \'INSERT INTO \'.$sql_prefix.\''.$table.' VALUES (\'.$value.\')\';',
          '    $result = mysqli_query($link, $q);',
          '    if (!$result) {',
          '      print \'<div class="error">\'.$sql_host.\' had a MySQL error (\'.mysqli_errno($link).\'): \'.mysqli_error($link).\'</div>\'."\\n";',
          '      print \'<div class="error">\'.$q.\'</div>\'."\\n";',
          '    } else {',
          '      print \'<div>\'.$q.\'</div>\'."\\n";',
          '    }',
          '  }'
        );
        $script .= implode($emitEol, $lines).$emitEol;
        if ($auto_increment_field !== '') {
          if ($auto_increment_seq !== 0) {
            $lines = array(
              '  // AUTO_INCREMENT insertion would have failed at '.$auto_increment_seq
            );
            $script .= implode($emitEol, $lines).$emitEol;
          }
          $lines = array(
            '  $q = \'ALTER TABLE \'.$sql_prefix.\''.$table.'  MODIFY COLUMN `'.$fields[$auto_increment_field]['Field'].'` '.$fields[$auto_increment_field]['Type'].' AUTO_INCREMENT, AUTO_INCREMENT = '.($auto_increment_value+1).';\';',
            '  $result = mysqli_query($link, $q);',
            '  if (!$result) {',
            '    print \'<div class="error">\'.$sql_host.\' had a MySQL error (\'.mysqli_errno($link).\'): \'.mysqli_error($link).\'</div>\'."\\n";',
            '    print \'<div class="error">\'.$q.\'</div>\'."\\n";',
            '  } else {',
            '    print \'<div>\'.$q.\'</div>\'."\\n";',
            '  }'
          );
          $script .= implode($emitEol, $lines).$emitEol;
        }
        $lines = array(
          '} else {',
          '  print \'<div class="warn">Table \'.$sql_prefix.\''.$table.' already has data!</div>\'."\\n";',
          '}'
        );
        $script .= implode($emitEol, $lines).$emitEol;
      }
    }
  }

  $lines = array(
    '// close the database',
    'if ($link) {',
    '  mysqli_close($link);',
    '}',
    '?>',
    '</body>',
    '</html>'
  );
  $script .= implode($emitEol, $lines).$emitEol;
  return $script;
}

// create the backups table
$q = 'CREATE TABLE `'.$sql_prefix.'backups` ( '
  .'`id` bigint(20) unsigned NOT NULL auto_increment,'
  .'`pwd` text,'
  .'`dt` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
  .'UNIQUE KEY `id` (`id`));';
if (!mysqli_query($link, $q)) {
  if (mysqli_errno($link) != 1050) {
    print '<div class="error">'.$sql_host.' had a MySQL error ('.mysqli_errno($link).'): '.mysqli_error($link).'</div>'."\n";
  }
} else {
  print $q."\n";
}

// add data to the backups table
$q = 'SELECT id FROM '.$sql_prefix.'backups';
$result = mysqli_query($link, $q);
if (mysqli_num_rows($result) == 0) {
  $pwd = '7AC1609F0D3D81FC773FCBBA57EAD87CE7A5C8579EE1F8DE1A083EA13BB80265';
  $values = array();
  $values[] = "0, 'no message', '".$now."'";
  $values[] = "0, '".$pwd."', '".$now."'";
  $values[] = "0, '".$pwd."', '".$now."'";
  $values = isset($values_backup)? $values_backup: $values;
  foreach ($values as $value) {
    $q = 'INSERT INTO '.$sql_prefix.'backups VALUES ('.$value.')';
    $result = mysqli_query($link, $q);
    if (!$result) {
      print $sql_host.' had a MySQL error ('.mysqli_errno($link).'): '.mysqli_error($link)."\n";
      print $q."\n";
    } else {
      print '<div>'.$q.'</div>'."\n";
    }
  }
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
    $packets[] = substr($buffer, $colon+1, $len);
    $buffer = substr($buffer, $colon+$len+1);
    $colon = strpos($buffer, ':');
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
  return strlen($packet) > 0? intval(substr($packet, 0, 1)): -1;
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
 * An example client.
 *
 * @return string The example "c" value.
 *
 * @author DanielWHoward
 **/
function auto_backup() {
  global $sql_prefix;
  global $link;

/*
#!/bin/bash
# Ubuntu Linux and Mac auto_backup
DIR="/home/sysadmin/PublicFigureBackups"
SCRIPT="http://xibbit.github.io/misc/backup.php"
OUTDATE=$(date '+%Y%m%d_%H%M%S')
OUTFILE="$DIR/backup_mt_$OUTDATE.php"
TMPFILE=$(mktemp /tmp/auto_backup.XXXXXX)
TMPFILE0="$TMPFILE.0"
PH1="66:1"
KEY=$(cat $DIR/auto_backup_key)
#KEY="3DE54A55E41D0519D5E822F7052C30404EA6920C8AD021C018CA1F59C277AF82"
NEWKEY1=$(/usr/bin/hexdump -n 16 -e '4/4 "%08X" 1 "\n"' /dev/urandom)
NEWKEY2=$(/usr/bin/hexdump -n 16 -e '4/4 "%08X" 1 "\n"' /dev/urandom)
NEWKEY="$NEWKEY1$NEWKEY2"
#NEWKEY="3DCC490863EC757F9EA597FEF4BEF4A96293BACA21AABFFBF1A50B307E6F26AE"
PH2="37:2"
SALT=$(/usr/bin/uuidgen)
IV=$(/usr/bin/hexdump -n 16 -e '4/4 "%08X" 1 "\n"' /dev/urandom)
#IV="FBDE3B2C2DC7C10DBE56B61F91B18316"
C="$PH1$NEWKEY"
E=$(echo -n $C | /usr/bin/openssl enc -aes-256-cbc -e -nosalt -K $KEY -iv $IV -a)
#E="knNdyQP4Nq9hUyuPiZn4eHnaSaik4FaaBFihfzucEEgOGwxIhWyc3s2NTAKsJopk IbJnGjamY00OXt4WUik/RGCenaO+/AQi33bwPdSLwVQ="
S=$(echo -n "\$aes-256-cbc\$$IV\$$E" | /usr/bin/base64)
URL=http://xibbit.github.io/misc/backup.php?c=JGFlcy0yNTYtY2JjJEZCREUzQjJDMkRDN0MxMERCRTU2QjYxRjkxQjE4MzE2JGtuTmR5UVA0TnE5aFV5dVBpWm40ZUhuYVNhaWs0RmFhQkZpaGZ6dWNFRWdPR3d4SWhXeWMzczJOVEFLc0pvcGsgSWJKbkdqYW1ZMDBPWHQ0V1Vpay9SR0NlbmFPKy9BUWkzM2J3UGRTTHdWUT0=&dryRun=true"
/usr/bin/curl -s --data-urlencode "c=$S" --data-urlencode "dryRun=false" $SCRIPT > $TMPFILE
SZ=$(/usr/bin/wc -c < $TMPFILE)
HEAD=$(/usr/bin/cut -b -13 < $TMPFILE)
if [[ $SZ -gt 10000 && $HEAD == "\$aes-256-cbc\$" ]]; then
IV=$(/usr/bin/cut -b 14-45 < $TMPFILE)
/usr/bin/cut -b 47- < $TMPFILE | /usr/bin/base64 -d > $TMPFILE0
/usr/bin/openssl enc -aes-256-cbc -d -nosalt -K $NEWKEY -iv $IV -in $TMPFILE0 -out $OUTFILE
echo $NEWKEY > $DIR/auto_backup_key
else
/usr/bin/curl -s --data-urlencode "m=decrypt failed" $SCRIPT > /dev/null
fi
/bin/rm $TMPFILE
/bin/rm $TMPFILE0
*/
  $shadow = '';
  $q = 'SELECT pwd FROM '.$sql_prefix.'backups WHERE id>=2 AND id<=3 ORDER BY id;';
  $result = mysqli_query($link, $q);
  while ($row = mysqli_fetch_row($result)) {
    // create "c=" query argument
    $data = '26:1cjiz64xid0001ykrif99szg1c66:2AAC1609F0D3D81FC773FCBBA57EAD87CE7A5C8579EE1F8DE1A083EA13BB80265';
    $encryption_key = hex2bin($row[0]);
    $shadow = crypt_shadow_encrypt($data, $encryption_key);
    $shadow = base64_encode($shadow);
    $shadow = urlencode($shadow);
  }
  return $shadow;
}

// securely return encrypted backup data
$shadow = '';
//$shadow = auto_backup();
if (isset($_REQUEST['c']) && ($shadow === '')) {
  $dryRun = isset($_REQUEST['dryRun']) && ($_REQUEST['dryRun'] === 'true');
  $c = $_REQUEST['c'];
  if ($dryRun) {
    $shadow .= 'c='.$c."\n";
  }
  $c = base64_decode($c);
  if ($dryRun) {
    $shadow .= 'c='.$c."\n";
  }
  // detect replay attacks
  $hc = hash('crc32b', $c);
  $q = 'SELECT id FROM '.$sql_prefix.'backups WHERE pwd=\''.$hc.'\';';
  $result = mysqli_query($link, $q);
  if ((mysqli_num_rows($result) === 0) || $dryRun) {
    // get current and new encryption keys
    $q = 'SELECT pwd FROM '.$sql_prefix.'backups WHERE id>=2 AND id<=3 ORDER BY id;';
    $result = mysqli_query($link, $q);
    if (mysqli_num_rows($result) === 2) {
      $ks = array();
      while ($row = mysqli_fetch_row($result)) {
        $ks[] = $row[0];
      }
      mysqli_free_result($result);
      // try to decrypt using both keys
      if ($dryRun) {
        $ks[0] = '3DE54A55E41D0519D5E822F7052C30404EA6920C8AD021C018CA1F59C277AF82';
      }
      $d1 = crypt_shadow_decrypt($c, hex2bin($ks[0]));
      $d2 = crypt_shadow_decrypt($c, hex2bin($ks[1]));
      $d = ($d1 !== false)? $d1: $d2;
      $k = $ks[($d1 !== false)? 0: 1];
      if ($d !== false) {
        // read the commands
        $newk = '';
        $packets = readPayload($d);
        for ($p=0; $p < count($packets); ++$p) {
          $id = readPacketTypeId($packets[$p]);
          if ($id === 1) {
            $newk = readPacketData($packets[$p]);
            if (hex2bin($newk) === false) {
              $newk = '';
            }
          }
        }
        // key rotation: update the current key with the new key if new key was used
        $q = 'UPDATE '.$sql_prefix.'backups SET pwd=\''.$k.'\', dt=\''.$now.'\' WHERE id=2;';
        if ($dryRun) {
          $shadow .= $q."\n";
        } else {
          $result = mysqli_query($link, $q);
        }
        // update new key if we got a "new key" command
        if ($newk !== '') {
          $q = 'UPDATE '.$sql_prefix.'backups SET pwd=\''.$newk.'\', dt=\''.$now.'\' WHERE id=3;';
          if ($dryRun) {
            $shadow .= $q."\n";
          } else {
            $result = mysqli_query($link, $q);
          }
          $k = $newk;
        }
        if ($dryRun) {
          $shadow .= "success\n";
        } else {
          // save crc32b for replay attack detection
          $q = 'INSERT INTO '.$sql_prefix.'backups VALUES(0, \''.$hc.'\', \''.$now.'\');';
          $result = mysqli_query($link, $q);
          // create encrypted MySQL installation PHP file
          $data = backup();
          $encryption_key = hex2bin($k);
          $shadow = crypt_shadow_encrypt($data, $encryption_key);
        }
      } elseif ($dryRun) {
        $shadow .= "invalid\n";
      }
    }
  }
}

// save the first message
if (isset($_REQUEST['m'])) {
  // aggressively sanitize it
  $m = $_REQUEST['m'];
  $m = preg_replace('/[^a-z\\040]+/', '', $m);
  $m = preg_replace('/\s+/', ' ', $m);
  $m = trim($m);
  $m = substr($m, 0, 30);
  $m = $now.' '.$m;
  // save it in id=1
  $q = 'UPDATE '.$sql_prefix.'backups SET pwd=\''.$m.'\', dt=\''.$now.'\' WHERE id=1 AND pwd=\'no message\';';
  $result = mysqli_query($link, $q);
}

// output
header('Content-Type: text/plain');
if ($shadow !== '') {
  print $shadow;
}

// close the database
if ($link) {
  mysqli_close($link);
}
?>
