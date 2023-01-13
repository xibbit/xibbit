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
require_once('../../../server/php/xibdb.php');

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
  } elseif (is_string($o)) {
    $s = '"' . str_replace('"', "\\\"", strval($o)) . '"';
  }
  return $s;
}

function assertDb($name, $xdb, $tables, $output, $expectedJson) {
  $i = 0;
  $color = 'green';
  $result = 'passed';
  $out = '';
  foreach ($tables as $table) {
    $rows = $xdb->readRowsNative(array(
      "table"=>$table
    ));
    $actual = sortJsonNative($rows);
    $expected = $expectedJson[$i];
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
      break;
    }
    ++$i;
  }
  print('<div style="color:' . $color . ';">' . $name . ': ' . $result . '</div>');
  print($out);
}

function assertRows($name, $rows, $output, $expectedJson) {
  $actual = sortJsonNative($rows);
  $expected = $expectedJson;
  $color = 'green';
  $result = 'passed';
  $out = '';
  if ($output) {
    $quoted = $actual;
    $quoted = str_replace("\\", "\\\\", $quoted);
    $quoted = str_replace("\"", "\\\"", $quoted);
    $quoted = "\"" . $quoted . "\"";
    $out .= '<div>' . htmlentities($quoted) . '</div>';
  }
  if ($actual !== $expected) {
    $color = 'red';
    $result = 'failed';
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
  function println($s) {
    print $s . '<br/>';
  }
}
$log = new LogMe();

// map the MySQL database to arrays and JSON
$xdb = new XibDb(array(
  'json_column'=>'json', // freeform JSON column name
  'sort_column'=>'n', // array index column name
  'log'=>$log,
  'mysqli'=>array(
    'link'=>$link,
  )
));

$now = '2023-01-13 19:21:00';

$xdb->dumpSql = false;
$xdb->dryRun = false;

try {
  $q = 'DROP TABLE `testplants`;';
  $xdb->mysql_query($q);
} catch (Exception $e) {
  $log->println($e->getMessage());
}

try {
  $q = 'DROP TABLE `testratings`;';
  $xdb->mysql_query($q);
} catch (Exception $e) {
  $log->println($e->getMessage());
}

try {
  $q = 'CREATE TABLE `testplants` ( '
    .'`id` bigint(20) unsigned NOT NULL auto_increment,'
    .'`category` text,'
    .'`val` text,'
    .'`colors` text,'
    .'`seeds` tinyint(1),'
    .'`total` int,'
    .'`price` float,'
    .'`created` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
    .'`n` bigint(20) unsigned NOT NULL,'
    .'`json` text,'
    .'UNIQUE KEY `id` (`id`));';
  $xdb->mysql_query($q);
} catch (Exception $e) {
  $log->println($e->getMessage());
}

try {
  $q = 'CREATE TABLE `testratings` ( '
    .'`id` bigint(20) unsigned NOT NULL auto_increment,'
    .'`pid` bigint(20) unsigned NOT NULL,'
    .'`name` text,'
    .'`rating` int,'
    .'`json` text,'
    .'UNIQUE KEY `id` (`id`));';
  $xdb->mysql_query($q);
} catch (Exception $e) {
  $log->println($e->getMessage());
}

	//
	// #1
	//

try {
  $xdb->insertRowNative(array(
    "table"=>"testplants",
    "values"=>array(
      "id"=>0,
      "category"=>"fruit",
      "val"=>"apple",
      "colors"=>" red green ",
      "seeds"=>true,
      "pit"=>false,
      "total"=>28,
      "price"=>0.5,
      "created"=>$now
    ),
    "where"=>array(
      "category"=>"fruit",
    )
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('insert #1', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"}]",
		"[]",
));

	//
	// #2
	//

try {
  $xdb->insertRowNative(array(
    "table"=>"testplants",
    "values"=>array(
      "id"=>0,
      "category"=>"fruit",
      "val"=>"lemon's \"the great\"",
      "colors"=>" yellow ",
      "seeds"=>true,
      "total"=>8,
      "price"=>0.25,
      "created"=>$now
    ),
    "where"=>array(
      "category"=>"fruit",
    )
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('insert #2', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"}]",
		"[]",
));

	//
	// #3
	//

try {
  $xdb->insertRowNative(array(
    "table"=>"testplants",
    "values"=>array(
      "id"=>0,
      "category"=>"fruit",
      "val"=>"apricot",
      "colors"=>" yellow orange ",
      "seeds"=>false,
      "pit"=>true,
      "total"=>16,
      "price"=>2.0,
      "created"=>$now
    ),
    "where"=>array(
      "category"=>"fruit",
    )
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('insert #3', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"}]",
		"[]",
));

	//
	// #4
	//

try {
  $xdb->insertRowNative(array(
    "table"=>"testplants",
    "values"=>array(
      "id"=>0,
      "category"=>"fruit",
      "val"=>"pomegrante",
      "colors"=>" purple red white ",
      "seeds"=>true,
      "total"=>5,
      "price"=>4.08,
      "created"=>$now
    ),
    "where"=>array(
      "category"=>"fruit",
    )
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('insert #4', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"}]",
		"[]",
));

	//
	// #5
	//

try {
  $xdb->insertRowNative(array(
    "table"=>"testplants",
    "values"=>array(
      "id"=>0,
      "category"=>"flower",
      "val"=>"rose",
      "colors"=>" white yellow red ",
      "seeds"=>false,
      "total"=>12,
      "price"=>5.0,
      "thorns"=>true,
      "created"=>$now
    ),
    "where"=>array(
      "category"=>"flower",
    )
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('insert #5', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"}]",
		"[]",
));

	//
	// #6
	//

try {
  $xdb->insertRowNative(array(
    "table"=>"testplants",
    "values"=>array(
      "id"=>0,
      "category"=>"fruit",
      "val"=>"orange",
      "colors"=>" orange ",
      "total"=>1,
      "price"=>0.10,
      "seeds"=>true,
      "skin"=>array(
        "thickness"=>"thin",
        "fragrant"=>true
      ),
      "created"=>$now
    ),
    "where"=>array(
      "category"=>"fruit",
    )
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('insert #6', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"}]",
		"[]",
));

	//
	// #7
	//

try {
  $xdb->insertRowNative(array(
    "table"=>"testplants",
    "values"=>array(
      "id"=>0,
      "category"=>"flower",
      "val"=>"tulip",
      "colors"=>" white ",
      "seeds"=>false,
      "total"=>1,
      "price"=>1.75,
      "created"=>$now
    ),
    "where"=>array(
      "category"=>"flower",
    )
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('insert #7', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"}]",
		"[]",
));

	//
	// #8
	//

try {
  $xdb->insertRowNative(array(
    "table"=>"testplants",
    "values"=>array(
      "id"=>0,
      "category"=>"fruit",
      "val"=>"strawberry",
      "colors"=>" red ",
      "seeds"=>false,
      "total"=>164,
      "price"=>0.08,
      "created"=>$now
    ),
    "where"=>array(
      "category"=>"fruit",
    )
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('insert #8', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"}]",
		"[]",
));

	//
	// #9
	//

try {
  $xdb->insertRowNative(array(
    "table"=>"testplants",
    "values"=>array(
      "id"=>0,
      "category"=>"fruit",
      "val"=>"cherry",
      "colors"=>" red purple ",
      "seeds"=>false,
      "pit"=>true,
      "total"=>22,
      "price"=>0.16,
      "created"=>$now
    ),
    "where"=>array(
      "category"=>"fruit",
    )
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('insert #9', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[]",
));

	//
	// #10
	//

try {
  $xdb->insertRowNative(array(
    "table"=>"testratings",
    "values"=>array(
      "id"=>0,
      "pid"=>8,
      "name"=>"fruitycorp",
      "rating"=>9
    )
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('insert #10', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9}]",
));

	//
	// #11
	//

try {
  $xdb->insertRowNative(array(
    "table"=>"testratings",
    "values"=>array(
      "id"=>0,
      "pid"=>8,
      "name"=>"greengrocer",
      "rating"=>8
    )
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('insert #11', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8}]",
));

	//
	// #12
	//

try {
  $xdb->insertRowNative(array(
    "table"=>"testratings",
    "values"=>array(
      "id"=>0,
      "pid"=>3,
      "name"=>"fruitycorp",
      "rating"=>4
    )
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('insert #12', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4}]",
));

	//
	// #13
	//

try {
  $xdb->insertRowNative(array(
    "table"=>"testratings",
    "values"=>array(
      "id"=>0,
      "pid"=>99,
      "name"=>"appledude",
      "reviewed"=>false,
      "rating"=>5
    )
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('insert #13', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false}]",
));

	//
	// #14
	//

try {
  $xdb->insertRowNative(array(
    "table"=>"testratings",
    "values"=>array(
      "id"=>0,
      "pid"=>3,
      "name"=>"apricoteater",
      "draft"=>true,
      "rating"=>3
    )
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('insert #14', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3}]",
));

	//
	// #15
	//

try {
  $xdb->insertRowNative(array(
    "table"=>"testratings",
    "values"=>array(
      "id"=>0,
      "pid"=>8,
      "name"=>"produceguy",
      "rating"=>7
    )
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('insert #15', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
));

	//
	// #16
	//

try {
  $xdb->updateRowNative(array(
    "table"=>"testplants",
    "values"=>array(
      "good4pie"=> true,
      "val"=>"apricot (changed)",
    ),
    "n"=>2,
    "where"=>array(
      "category"=>"fruit",
    ),
    "limit"=>1,
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('update #16', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
));

	//
	// #17
	//

try {
  $rows = &$xdb->readRowsNative(array(
    'table'=>'testplants',
    'on'=>array(
      'testratings'=>array(
        'testratings.pid'=>'testplants.id'
      ),
    ),
    'where'=>array(
      'category'=>'fruit'
    ),
    'order by'=>'`testratings`.`rating`'
  ));
  $rating = array_column($rows, 'rating');
  array_multisort($rating, SORT_ASC, $rows);
  assertRows('select on #17', $rows, false,
		"[{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9}]"
  );
} catch (Exception $e) {
  $log->println($e->getMessage());
}

	//
	// #18
	//

try {
  $rows = &$xdb->readRowsNative(array(
    "table"=>"testplants",
    "columns"=>array(
      "val",
      "price"
    ),
    "on"=>array(
      "testratings"=>array(
        "testratings.pid"=>"testplants.id"
      ),
    ),
    "where"=>array(
      "category"=>"fruit"
    ),
    "order by"=>"`testratings`.`rating`"
  ));
  $rating = array_column($rows, 'rating');
  array_multisort($rating, SORT_ASC, $rows);
  assertRows('select on #18', $rows, false,
		"[{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"price\":2.0,\"rating\":3,\"val\":\"apricot (changed)\"},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"price\":2.0,\"rating\":4,\"val\":\"apricot (changed)\"},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"price\":0.08,\"rating\":7,\"val\":\"strawberry\"},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"price\":0.08,\"rating\":8,\"val\":\"strawberry\"},{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"price\":0.08,\"rating\":9,\"val\":\"strawberry\"}]"
  );
} catch (Exception $e) {
  $log->println($e->getMessage());
}

	//
	// #19
	//

try {
  $row = $xdb->insertRowNative(array(
    "table"=>"testplants",
    "values"=>array(
      "id"=>0,
      "category"=>"fruit",
      "val"=>"kiwi",
      "colors"=>" green ",
      "seeds"=>false,
      "total"=>4,
      "sweet"=>"very, very",
      "price"=>2.28,
      "created"=>$now
    ),
    "where"=>array(
      "category"=>"fruit",
    ),
    "n"=>0,
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('insert #19', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
));

	//
	// #20
	//

try {
  $xdb->insertRowNative(array(
    "table"=>"testplants",
    "values"=>array(
      "id"=>0,
      "category"=>"fruit",
      "val"=>"raspberry",
      "colors"=>" red ",
      "seeds"=>false,
      "total"=>17,
      "sweet"=>3,
      "price"=>0.12,
      "created"=>$now
    ),
    "where"=>array(
      "category"=>"fruit",
    ),
    "n"=>4,
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('insert #20', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
));

	//
	// #21
	//

try {
  $xdb->insertRowNative(array(
    "table"=>"testplants",
    "values"=>array(
      "id"=>0,
      "category"=>"fruit",
      "val"=>"grapefruit",
      "colors"=>" orange yellow pink ",
      "seeds"=>true,
      "total"=>3,
      "sour"=>4,
      "price"=>3.14,
      "created"=>$now
    ),
    "where"=>array(
      "category"=>"fruit",
    ),
    "n"=>4,
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('insert #21', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
));

	//
	// #22
	//

try {
  $xdb->insertRowNative(array(
    "table"=>"testplants",
    "values"=>array(
      "id"=>0,
      "category"=>"fruit",
      "val"=>"banana",
      "colors"=>" yellow green ",
      "seeds"=>false,
      "total"=>3,
      "pulpcolor"=>"white",
      "price"=>1.02,
      "created"=>$now
    ),
    "where"=>" WHERE `category`='fruit'",
    "n"=>4,
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('insert #22', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
));

	//
	// #23
	//

try {
  $xdb->insertRowNative(array(
    "table"=>"testplants",
    "values"=>array(
      "id"=>0,
      "category"=>"fruit",
      "val"=>"watermelon",
      "colors"=>" red ",
      "seeds"=>false,
      "total"=>1.5,
      "price"=>2.50,
      "created"=>$now
    ),
    "where"=>" WHERE `category`='fruit'",
    "n"=>4,
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('insert #23', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
));

	//
	// #24
	//

try {
  $xdb->insertRowNative(array(
    "table"=>"testplants",
    "values"=>array(
      "id"=>0,
      "category"=>"fruit",
      "val"=>"mango",
      "colors"=>" orange ",
      "seeds"=>true,
      "total"=>7,
      "price"=>1.13,
      "created"=>$now
    ),
    "where"=>"`category`='fruit'",
    "n"=>4,
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('insert #24', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"price\":1.13,\"seeds\":true,\"total\":7,\"val\":\"mango\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
));

	//
	// #25
	//

try {
  $xdb->insertRowNative(array(
    "table"=>"testplants",
    "values"=>"(`id`,`category`,`val`,`colors`,`seeds`,`total`,`price`,`created`,`n`,`json`) VALUES (0,'fruit','blueberry',' blue ',0,18,0.22,'2023-01-13 19:21:00',13,'{\"stains\":true}')",
    "where"=>array(
      "category"=>"fruit",
    ),
    "n"=>13,
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('insert #25', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"price\":1.13,\"seeds\":true,\"total\":7,\"val\":\"mango\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
));

	//
	// #26
	//

try {
  $xdb->updateRowNative(array(
    "table"=>"testplants",
    "values"=>array(
      "open"=>true,
      "val"=>"mango (changed)"
    ),
    "n"=>4,
    "where"=>array(
      "category"=>"fruit",
    )
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('update #26', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"open\":true,\"price\":1.13,\"seeds\":true,\"total\":7,\"val\":\"mango (changed)\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
));

	//
	// #27
	//

try {
  $xdb->updateRowNative(array(
    "table"=>"testplants",
    "values"=>array(
      "val"=>"mango2 (changed)",
      "zebra"=>2.0
    ),
    "n"=>4,
    "where"=>array(
      "category"=>"fruit",
    )
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('update #27', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"open\":true,\"price\":1.13,\"seeds\":true,\"total\":7,\"val\":\"mango2 (changed)\",\"zebra\":2},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
));

	//
	// #28
	//

try {
  $xdb->updateRowNative(array(
    "table"=>"testplants",
    "values"=>array(
      "zebra"=>3.1
    ),
    "n"=>4,
    "where"=>array(
      "category"=>"fruit",
    )
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('update #28', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"open\":true,\"price\":1.13,\"seeds\":true,\"total\":7,\"val\":\"mango2 (changed)\",\"zebra\":3.1},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
));

	//
	// #29
	//

try {
  $xdb->updateRowNative(array(
    "table"=>"testplants",
    "values"=>array(
      "unfinished"=> true,
      "val"=>"mango33 (changed)",
      "n"=>"str"
    ),
    "n"=>4,
    "where"=>array(
      "category"=>"fruit",
    )
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('update #29', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"n\":\"str\",\"open\":true,\"price\":1.13,\"seeds\":true,\"total\":7,\"unfinished\":true,\"val\":\"mango33 (changed)\",\"zebra\":3.1},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
));

	//
	// #30
	//

try {
  $rows = &$xdb->readRowsNative(array(
    'table'=>'testplants',
    'where'=>array(
      'category'=>'fruit'
    )
  ));
  assertRows('select on #30', $rows, false,
		"[{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"n\":\"str\",\"open\":true,\"price\":1.13,\"seeds\":true,\"total\":7,\"unfinished\":true,\"val\":\"mango33 (changed)\",\"zebra\":3.1},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]"
  );
} catch (Exception $e) {
  $log->println($e->getMessage());
}

	//
	// #31
	//

try {
  $xdb->deleteRowNative(array(
    "table"=>"testplants",
    "where"=>array(
      "category"=>"fruit",
    ),
    "n"=>4,
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('delete #31', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
));

	//
	// #32
	//

try {
  $xdb->deleteRowNative(array(
    "table"=>"testplants",
    "where"=>array(
      "category"=>"fruit",
    ),
    "n"=>0,
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('delete #32', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
));

	//
	// #33
	//

try {
  $xdb->deleteRowNative(array(
    "table"=>"testplants",
    "where"=>array(
      "category"=>"fruit",
    ),
    "n"=>-1,
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('delete #33', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
));

	//
	// #34
	//

try {
  $xdb->deleteRowNative(array(
    "table"=>"testplants",
    "where"=>" WHERE `category`='fruit'",
    "n"=>0,
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('delete #34', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
));

	//
	// #35
	//

try {
  $xdb->deleteRowNative(array(
    "table"=>"testplants",
    "where"=>" WHERE `category`='fruit'",
    "n"=>0,
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('delete #35', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
));

	//
	// #36
	//

try {
  $xdb->deleteRowNative(array(
    "table"=>"testplants",
    "where"=>"`category`='fruit'",
    "n"=>0,
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('delete #36', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
));

	//
	// #37
	//

try {
  $xdb->deleteRowNative(array(
    "table"=>"testratings",
    "where"=>array(
      "pid"=>99
    )
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('delete #37', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
));

	//
	// #38
	//

try {
  // DeleteRowNative: "n" is not an int; n is a JSON string
  $xdb->deleteRowNative(array(
    "table"=>"testplants",
    "where"=>array(
      "category"=>"fruit",
    ),
    "n"=>'{"address": "608"}'
  ));
} catch (Exception $e) {
  if ($e->getMessage() !== "Unknown column 'address' in 'where clause'") {
    $log->println($e->getMessage());
  }
}

assertDb('delete #38', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
));

	//
	// #39
	//

try {
  // DeleteRowNative: "n" is not an int; something else
  $xdb->deleteRowNative(array(
    "table"=>"testplants",
    "where"=>array(
      "category"=>"fruit",
    ),
    "n"=>' ADN something'
  ));
} catch (Exception $e) {
  if ($e->getMessage() !== "You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'ADN something ORDER BY `n` DESC' at line 1") {
    $log->println($e->getMessage());
  }
}

assertDb('delete #39', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
));

	//
	// #40
	//

try {
  $xdb->moveRowNative(array(
    "table"=>"testplants",
    "where"=>array(
      "category"=>"fruit",
    ),
    "m"=>2,
    "n"=>6,
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('move #40', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
));

	//
	// #41
	//

try {
  $xdb->moveRowNative(array(
    "table"=>"testplants",
    "where"=>array(
      "category"=>"fruit",
    ),
    "m"=>5,
    "n"=>1,
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('move #41', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
));

	//
	// #42
	//

try {
  $xdb->moveRowNative(array(
    "table"=>"testplants",
    "where"=>array(
      "category"=>"fruit",
    ),
    "m"=>5,
    "n"=>0,
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('move #42', $xdb, array('testplants', 'testratings'), false, array(
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
));

	//
	// #43
	//
/*
try {
  $xdb->moveRowNative(array(
    "table"=>"testplants",
    "where"=>array(
      "category"=>"fruit",
    ),
    "m"=>3,
    "n"=>-1,
  ));
} catch (Exception $e) {
  $log->println($e->getMessage());
}

assertDb('move #43', $xdb, array('testplants', 'testratings'), false, array(
  "[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
  "[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]"
));
*/
/*
$rows = $xdb->readRowsNative(array(
  "table"=>"testplants",
  "where"=>array(
    "category"=>"fruit"
  ),
));
if (count($rows) === 0) {
  $log->println('no rows');
}
foreach ($rows as $key=>$value) {
  $log->println(htmlentities(json_encode($value)));
}
*/
/*
$rows = $xdb->readRowsNative(array(
  "table"=>"testplants",
  "columns"=>array(
    "val",
    "colors",
    "seeds"
  ),
  "where"=>array(
    "category"=>"fruit"
  ),
));
if (count($rows) === 0) {
  $log->println('no rows');
}
foreach ($rows as $key=>$value) {
  $log->println(htmlentities(json_encode($value)));
}
*/
	//
	// #44
	//

try {
  $rows = &$xdb->readRowsNative(array(
    'table'=>'testplants',
    'where'=>array(
      'category'=>'fruit',
      'unused'=>array(
        'LIKE',
        'colors',
        '% orange %'
      )
    )
  ));
  assertRows('select like #44', $rows, false,
		"[{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"}]"
  );
} catch (Exception $e) {
  $log->println($e->getMessage());
}

	//
	// #45
	//

try {
  $rows = &$xdb->readRowsNative(array(
    'table'=>'testplants',
    'where'=>array(
      'category'=>'fruit',
      'unused'=>array(
        'LIKE',
        'colors',
        '% ',
        array('orange', 'yellow'),
        ' %'
      )
    )
  ));
  assertRows('select like #45', $rows, false,
		"[{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"}]"
  );
} catch (Exception $e) {
  $log->println($e->getMessage());
}

	//
	// #46
	//

try {
  $rows = &$xdb->readRowsNative(array(
    'table'=>'testplants',
    'where'=>array(
      'category'=>'fruit',
      'unused'=>array(
        'LIKE',
        'colors',
        '% ',
        'orange',
        ' %'
      )
    )
  ));
  assertRows('select like #46', $rows, false,
		"[{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"}]"
  );
} catch (Exception $e) {
  $log->println($e->getMessage());
}
/*
try {
  $q = 'DROP TABLE `testplants`;';
  $xdb->mysql_query($q);
} catch (Exception $e) {
  $log->println($e->getMessage());
}

try {
  $q = 'DROP TABLE `testratings`;';
  $xdb->mysql_query($q);
} catch (Exception $e) {
  $log->println($e->getMessage());
}
*/
$xdb->dumpSql = false;
$xdb->dryRun = false;

// disconnect from the MySQL database
if ($link) {
  $link->close();
}
?>
</body>
</html>
