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
var XibDb = require('../../../server/node/xibdb');

var mysql = require('mysql');
const util = require('util');

function sortJsonNative(o, key) {
  var s = '';
  if ((typeof o === 'object') && (o.constructor.name === 'Array')) {
    s += '[';
    for (var i=0; i < o.length; ++i) {
      if (s !== '[') {
        s += ',';
      }
      s += sortJsonNative(o[i]);
    }
    s += ']';
  } else if ((typeof o === 'object') && (o.constructor.name === 'Object')) {
    var keys = Object.keys(o);
    keys.sort();
    s += '{';
    for (var k=0; k < keys.length; ++k) {
      key = keys[k];
      var value = o[key];
      if (s !== '{') {
        s += ',';
      }
      s += sortJsonNative(key) + ':' + sortJsonNative(value, key);
    }
    s += '}';
  } else if (typeof o === 'boolean') {
    s = o? 'true': 'false';
  } else if ((typeof o == 'number') && ((o % 1) === 0)) {
    s = '' + o;
    // hardcode "price" variables to be floats
    // this is a hack because JavaScript does
    //  not have ints or floats, only numbers
    if ((key === 'price') && (s.indexOf('.') === -1)) {
      s += '.0';
    }
  } else if ((typeof o == 'number') && (Math.round(o) !== o)) {
    s = '' + o;
    // this will never be called
    // float detection (round()) guarantees a decimal point
    if (s.indexOf('.') === -1) {
      s += '.0';
    }
  } else if (Object.prototype.toString.call(o) === '[object Date]') {
    //var utcOffset = new Date('1970-01-01 00:00:00').getTime();
    o = (new Date(o.getTime())).toISOString().slice(0, 19).replace('T', ' ');
    s = '"' + o + '"';
  } else if (typeof o === 'string') {
    s = '"' + (''+o).split('"').join("\\\"") + '"';
  }
  return s;
}

async function assertDb(name, xdb, tables, output, expectedJson) {
  var i = 0;
  var color = 'green';
  var result = 'passed';
  var out = '';
  for (var t=0; t < tables.length; ++t) {
    var table = tables[t];
    var rows = await xdb.readRowsNative({
      "table": table
    });
    var actual = sortJsonNative(rows);
    var expected = expectedJson[i];
    if (output) {
      quoted = actual;
      quoted = quoted.split("\\").join("\\\\");
      quoted = quoted.split("\"").join("\\\"");
      quoted = "\"" + quoted + "\",";
      out += quoted + '\n';
    }
    if (actual !== expected) {
      color = 'red';
      result = 'failed to match actual to expected';
      break;
    }
    ++i;
  }
  var pre = '\x1b[32m';
  if (color !== 'green') {
    pre = '\x1b[31m';
  }
  console.log(pre + name + ': ' + result + '\x1b[0m');
  if (out) {
    console.log(out);
  }
}
function assertRows(name, rows, output, expectedJson) {
  var actual = sortJsonNative(rows);
  var expected = expectedJson;
  var color = 'green';
  var result = 'passed';
  var out = '';
  if (output) {
    quoted = actual;
    quoted = quoted.split("\\").join("\\\\");
    quoted = quoted.split("\"").join("\\\"");
    quoted = "\"" + quoted + "\",";
    out += quoted;
  }
  if (actual !== expected) {
    color = 'red';
    result = 'failed';
  }
  var pre = '\x1b[32m';
  if (color !== 'green') {
    pre = '\x1b[31m';
  }
  console.log(pre + name + ': ' + result + '\x1b[0m');
  if (out) {
    console.log(out);
  }
}

// connect to the MySQL database
var link = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'mysql',
  database: 'publicfigure'
});

link.connect(function(e) {
if (e) {
  console.error(e);
  link = null;
}

function LogMe() {
  this.println = function println(s) {
    console.log(s);
  };
}
var log = new LogMe();

// map the MySQL database to arrays and JSON
var xdb = new XibDb({
  'json_column': 'json', // freeform JSON column name
  'sort_column': 'n', // array index column name
  'link_identifier': link,
});

var now = '2023-01-13 19:21:00';
now[10] = 'T';
now += 'Z';
now = new Date(now);

var q = '';

async function runTests() {

try {
  q = 'DROP TABLE `testplants`;';
  await xdb.mysql_query(q);
} catch (e) {
  log.println(e);
}

try {
  q = 'DROP TABLE `testratings`;';
  await xdb.mysql_query(q);
} catch (e) {
  log.println(e);
}

try {
  q = 'CREATE TABLE `testplants` ( '
    +'`id` bigint(20) unsigned NOT NULL auto_increment,'
    +'`category` text,'
    +'`val` text,'
    +'`colors` text,'
    +'`seeds` tinyint(1),'
    +'`total` int,'
    +'`price` float,'
    +'`created` datetime NOT NULL,' // 2014-12-23 06:00:00 (PST)
    +'`n` bigint(20) unsigned NOT NULL,'
    +'`json` text,'
    +'UNIQUE KEY `id` (`id`));';
  await xdb.mysql_query(q);
} catch (e) {
  log.println(e);
}

try {
  q = 'CREATE TABLE `testratings` ( '
    +'`id` bigint(20) unsigned NOT NULL auto_increment,'
    +'`pid` bigint(20) unsigned NOT NULL,'
    +'`name` text,'
    +'`rating` int,'
    +'`json` text,'
    +'UNIQUE KEY `id` (`id`));';
  await xdb.mysql_query(q);
} catch (e) {
  log.println(e);
}

	//
	// #1
	//

try {
  await xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "fruit",
      "val": "apple",
      "colors": " red green ",
      "seeds": true,
      "pit": false,
      "total": 28,
      "price": 0.5,
      "created": now
    },
    "where": {
      "category": "fruit",
    }
  });
} catch (e) {
  log.println(e);
}

await assertDb('insert #1', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"}]",
		"[]",
]);

	//
	// #2
	//

try {
  await xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "fruit",
      "val": "lemon's \"the great\"",
      "colors": " yellow ",
      "seeds": true,
      "total": 8,
      "price": 0.25,
      "created": now
    },
    "where": {
      "category": "fruit",
    }
  });
} catch (e) {
  log.println(e);;
}

await assertDb('insert #2', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"}]",
		"[]",
]);

	//
	// #3
	//

try {
  await xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "fruit",
      "val": "apricot",
      "colors": " yellow orange ",
      "seeds": false,
      "pit": true,
      "total": 16,
      "price": 2.0,
      "created": now
    },
    "where": {
      "category": "fruit",
    }
  });
} catch (e) {
  log.println(e);;
}

await assertDb('insert #3', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"}]",
		"[]",
]);

	//
	// #4
	//

try {
  await xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "fruit",
      "val": "pomegrante",
      "colors": " purple red white ",
      "seeds": true,
      "total": 5,
      "price": 4.08,
      "created": now
    },
    "where": {
      "category": "fruit",
    }
  });
} catch (e) {
  log.println(e);
}

await assertDb('insert #4', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"}]",
		"[]",
]);

	//
	// #5
	//

try {
  await xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "flower",
      "val": "rose",
      "colors": " white yellow red ",
      "seeds": false,
      "total": 12,
      "price": 5.0,
      "thorns": true,
      "created": now
    },
    "where": {
      "category": "flower",
    }
  });
} catch (e) {
  log.println(e);
}

await assertDb('insert #5', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"}]",
		"[]",
]);

	//
	// #6
	//

try {
  await xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "fruit",
      "val": "orange",
      "colors": " orange ",
      "total": 1,
      "price": 0.10,
      "seeds": true,
      "skin": {
        "thickness": "thin",
        "fragrant": true
      },
      "created": now
    },
    "where": {
      "category": "fruit",
    }
  });
} catch (e) {
  log.println(e);
}

await assertDb('insert #6', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"}]",
		"[]",
]);

	//
	// #7
	//

try {
  await xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "flower",
      "val": "tulip",
      "colors": " white ",
      "seeds": false,
      "total": 1,
      "price": 1.75,
      "created": now
    },
    "where": {
      "category": "flower",
    }
  });
} catch (e) {
  log.println(e);
}

await assertDb('insert #7', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"}]",
		"[]",
]);

	//
	// #8
	//

try {
  await xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "fruit",
      "val": "strawberry",
      "colors": " red ",
      "seeds": false,
      "total": 164,
      "price": 0.08,
      "created": now
    },
    "where": {
      "category": "fruit",
    }
  });
} catch (e) {
  log.println(e);
}

await assertDb('insert #8', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"}]",
		"[]",
]);

	//
	// #9
	//

try {
  await xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "fruit",
      "val": "cherry",
      "colors": " red purple ",
      "seeds": false,
      "pit": true,
      "total": 22,
      "price": 0.16,
      "created": now
    },
    "where": {
      "category": "fruit",
    }
  });
} catch (e) {
  log.println(e);
}

await assertDb('insert #9', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[]",
]);

	//
	// #10
	//

try {
  await xdb.insertRowNative({
    "table": "testratings",
    "values": {
      "id": 0,
      "pid": 8,
      "name": "fruitycorp",
      "rating": 9
    }
  });
} catch (e) {
  log.println(e);
}

await assertDb('insert #10', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9}]",
]);

	//
	// #11
	//

try {
  await xdb.insertRowNative({
    "table": "testratings",
    "values": {
      "id": 0,
      "pid": 8,
      "name": "greengrocer",
      "rating": 8
    }
  });
} catch (e) {
  log.println(e);
}

await assertDb('insert #11', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8}]",
]);

	//
	// #12
	//

try {
  await xdb.insertRowNative({
    "table": "testratings",
    "values": {
      "id": 0,
      "pid": 3,
      "name": "fruitycorp",
      "rating": 4
    }
  });
} catch (e) {
  log.println(e);
}

await assertDb('insert #12', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4}]",
]);

	//
	// #13
	//

try {
  await xdb.insertRowNative({
    "table": "testratings",
    "values": {
      "id": 0,
      "pid": 99,
      "name": "appledude",
      "reviewed": false,
      "rating": 5
    }
  });
} catch (e) {
  log.println(e);
}

await assertDb('insert #13', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false}]",
]);

	//
	// #14
	//

try {
  await xdb.insertRowNative({
    "table": "testratings",
    "values": {
      "id": 0,
      "pid": 3,
      "name": "apricoteater",
      "draft": true,
      "rating": 3
    }
  });
} catch (e) {
  log.println(e);
}

await assertDb('insert #14', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3}]",
]);

	//
	// #15
	//

try {
  await xdb.insertRowNative({
    "table": "testratings",
    "values": {
      "id": 0,
      "pid": 8,
      "name": "produceguy",
      "rating": 7
    }
  });
} catch (e) {
  log.println(e);
}

await assertDb('insert #15', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
]);

	//
	// #16
	//

try {
  await xdb.updateRowNative({
    "table": "testplants",
    "values": {
      "good4pie":  true,
      "val": "apricot (changed)",
    },
    "n": 2,
    "where": {
      "category": "fruit",
    },
    "limit": 1,
  });
} catch (e) {
  log.println(e);
}

await assertDb('update #16', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
]);

	//
	// #17
	//

try {
  rows = await xdb.readRowsNative({
    "table": "testplants",
    "on": {
      "testratings": {
        "testratings.pid": "testplants.id"
      }
    },
    "where": {
      "category": "fruit"
    },
    "order by": "`testratings`.`rating`"
  });
  rows.sort((a, b) => a.rating - b.rating);
  assertRows('select on #17', rows, false,
		"[{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9}]",
  );
} catch (e) {
  log.println(e);
}

	//
	// #18
	//

try {
  rows = await xdb.readRowsNative({
    "table": "testplants",
    "columns": [
      "val",
      "price"
    ],
    "on": {
      "testratings": {
        "testratings.pid": "testplants.id"
      },
    },
    "where": {
      "category": "fruit"
    },
    "order by": "`testratings`.`rating`"
  });
} catch (e) {
  log.println(e);
}

rows.sort((a, b) => a.rating - b.rating);
assertRows('select on #18', rows, false,
		"[{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"price\":2.0,\"rating\":3,\"val\":\"apricot (changed)\"},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"price\":2.0,\"rating\":4,\"val\":\"apricot (changed)\"},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"price\":0.08,\"rating\":7,\"val\":\"strawberry\"},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"price\":0.08,\"rating\":8,\"val\":\"strawberry\"},{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"price\":0.08,\"rating\":9,\"val\":\"strawberry\"}]",
);

	//
	// #19
	//

try {
  row = await xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "fruit",
      "val": "kiwi",
      "colors": " green ",
      "seeds": false,
      "total": 4,
      "sweet": "very, very",
      "price": 2.28,
      "created": now
    },
    "where": {
      "category": "fruit",
    },
    "n": 0,
  });
} catch (e) {
  log.println(e);
}

await assertDb('insert #19', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
]);

	//
	// #20
	//

try {
  await xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "fruit",
      "val": "raspberry",
      "colors": " red ",
      "seeds": false,
      "total": 17,
      "sweet": 3,
      "price": 0.12,
      "created": now
    },
    "where": {
      "category": "fruit",
    },
    "n": 4,
  });
} catch (e) {
  log.println(e);
}

await assertDb('insert #20', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
]);

	//
	// #21
	//

try {
  await xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "fruit",
      "val": "grapefruit",
      "colors": " orange yellow pink ",
      "seeds": true,
      "total": 3,
      "sour": 4,
      "price": 3.14,
      "created": now
    },
    "where": {
      "category": "fruit",
    },
    "n": 4,
  });
} catch (e) {
  log.println(e);
}

await assertDb('insert #21', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
]);

	//
	// #22
	//

try {
  await xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "fruit",
      "val": "banana",
      "colors": " yellow green ",
      "seeds": false,
      "total": 3,
      "pulpcolor": "white",
      "price": 1.02,
      "created": now
    },
    "where": " WHERE `category`='fruit'",
    "n": 4,
  });
} catch (e) {
  log.println(e);
}

await assertDb('insert #22', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
]);

	//
	// #23
	//

try {
  await xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "fruit",
      "val": "watermelon",
      "colors": " red ",
      "seeds": false,
      "total": 1.5,
      "price": 2.50,
      "created": now
    },
    "where": " WHERE `category`='fruit'",
    "n": 4,
  });
} catch (e) {
  log.println(e);
}

await assertDb('insert #23', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
]);

	//
	// #24
	//

try {
  await xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "fruit",
      "val": "mango",
      "colors": " orange ",
      "seeds": true,
      "total": 7,
      "price": 1.13,
      "created": now
    },
    "where": "`category`='fruit'",
    "n": 4,
  });
} catch (e) {
  log.println(e);
}

await assertDb('insert #24', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"price\":1.13,\"seeds\":true,\"total\":7,\"val\":\"mango\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
]);

	//
	// #25
	//

try {
  await xdb.insertRowNative({
    "table": "testplants",
    "values": "(`id`,`category`,`val`,`colors`,`seeds`,`total`,`price`,`created`,`n`,`json`) VALUES (0,'fruit','blueberry',' blue ',0,18,0.22,'2023-01-13 11:21:00',13,'{\"stains\":true}')",
    "where": {
      "category": "fruit",
    },
    "n": 13,
  });
} catch (e) {
  log.println(e);
}

await assertDb('insert #25', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"price\":1.13,\"seeds\":true,\"total\":7,\"val\":\"mango\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
]);

	//
	// #26
	//

try {
  await xdb.updateRowNative({
    "table": "testplants",
    "values": {
      "open": true,
      "val": "mango (changed)"
    },
    "n": 4,
    "where": {
      "category": "fruit",
    }
  });
} catch (e) {
  log.println(e);
}

await assertDb('update #26', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"open\":true,\"price\":1.13,\"seeds\":true,\"total\":7,\"val\":\"mango (changed)\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
]);

	//
	// #27
	//

try {
  await xdb.updateRowNative({
    "table": "testplants",
    "values": {
      "val": "mango2 (changed)",
      "zebra": 2.0
    },
    "n": 4,
    "where": {
      "category": "fruit",
    }
  });
} catch (e) {
  log.println(e);
}

await assertDb('update #27', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"open\":true,\"price\":1.13,\"seeds\":true,\"total\":7,\"val\":\"mango2 (changed)\",\"zebra\":2},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
]);

	//
	// #28
	//

try {
  await xdb.updateRowNative({
    "table": "testplants",
    "values": {
      "zebra": 3.1
    },
    "n": 4,
    "where": {
      "category": "fruit",
    }
  });
} catch (e) {
  log.println(e);
}

await assertDb('update #28', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"open\":true,\"price\":1.13,\"seeds\":true,\"total\":7,\"val\":\"mango2 (changed)\",\"zebra\":3.1},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
]);

	//
	// #29
	//

try {
  await xdb.updateRowNative({
    "table": "testplants",
    "values": {
      "unfinished":  true,
      "val": "mango33 (changed)",
      "n": "str"
    },
    "n": 4,
    "where": {
      "category": "fruit",
    }
  });
} catch (e) {
  log.println(e);
}

await assertDb('update #29', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"n\":\"str\",\"open\":true,\"price\":1.13,\"seeds\":true,\"total\":7,\"unfinished\":true,\"val\":\"mango33 (changed)\",\"zebra\":3.1},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
]);

	//
	// #30
	//

try {
  rows = await xdb.readRowsNative({
    'table': 'testplants',
    'where': {
      'category': 'fruit'
    }
  });
  rows.sort((a, b) => a.rating - b.rating);
  assertRows('select on #30', rows, false,
		"[{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"n\":\"str\",\"open\":true,\"price\":1.13,\"seeds\":true,\"total\":7,\"unfinished\":true,\"val\":\"mango33 (changed)\",\"zebra\":3.1},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
  );
} catch (e) {
  log.println(e);
}

	//
	// #31
	//

try {
  await xdb.deleteRowNative({
    "table": "testplants",
    "where": {
      "category": "fruit",
    },
    "n": 4,
  });
} catch (e) {
  log.println(e);
}

await assertDb('delete #31', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
]);

	//
	// #32
	//

try {
  await xdb.deleteRowNative({
    "table": "testplants",
    "where": {
      "category": "fruit",
    },
    "n": 0,
  });
} catch (e) {
  log.println(e);
}

await assertDb('delete #32', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
]);

	//
	// #33
	//

try {
  await xdb.deleteRowNative({
    "table": "testplants",
    "where": {
      "category": "fruit",
    },
    "n": -1,
  });
} catch (e) {
  log.println(e);
}

await assertDb('delete #33', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
]);

	//
	// #34
	//

try {
  await xdb.deleteRowNative({
    "table": "testplants",
    "where": " WHERE `category`='fruit'",
    "n": 0,
  });
} catch (e) {
  log.println(e);
}

await assertDb('delete #34', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
]);

	//
	// #35
	//

try {
  await xdb.deleteRowNative({
    "table": "testplants",
    "where": " WHERE `category`='fruit'",
    "n": 0,
  });
} catch (e) {
  log.println(e);
}

await assertDb('delete #35', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
]);

	//
	// #36
	//

try {
  await xdb.deleteRowNative({
    "table": "testplants",
    "where": "`category`='fruit'",
    "n": 0,
  });
} catch (e) {
  log.println(e);
}

await assertDb('delete #36', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
]);

	//
	// #37
	//

try {
  await xdb.deleteRowNative({
    "table": "testratings",
    "where": {
      "pid": 99
    }
  });
} catch (e) {
  log.println(e);
}

await assertDb('delete #37', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
]);

	//
	// #38
	//

try {
  // DeleteRowNative: "n" is not an int; n is a JSON string
  await xdb.deleteRowNative({
    "table": "testplants",
    "where": {
      "category": "fruit",
    },
    "n": '{"address": "608"}'
  });
} catch (e) {
//  if ($e->getMessage() !== "Unknown column 'address' in 'where clause'") {
    log.println(e);
//  }
}

await assertDb('delete #38', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
]);

	//
	// #39
	//

try {
  // DeleteRowNative: "n" is not an int; something else
  await xdb.deleteRowNative({
    "table": "testplants",
    "where": {
      "category": "fruit",
    },
    "n": ' ADN something'
  });
} catch (e) {
//  if ($e->getMessage() !== "You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'ADN something ORDER BY `n` DESC' at line 1") {
    log.println(e);
//  }
}

await assertDb('delete #39', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
]);

	//
	// #40
	//

try {
  await xdb.moveRowNative({
    "table": "testplants",
    "where": {
      "category": "fruit",
    },
    "m": 2,
    "n": 6,
  });
} catch (e) {
  log.println(e);
}

await assertDb('move #40', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
]);

	//
	// #41
	//

try {
  await xdb.moveRowNative({
    "table": "testplants",
    "where": {
      "category": "fruit",
    },
    "m": 5,
    "n": 1,
  });
} catch (e) {
  log.println(e);
}

await assertDb('move #41', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
]);

	//
	// #42
	//

try {
  await xdb.moveRowNative({
    "table": "testplants",
    "where": {
      "category": "fruit",
    },
    "m": 5,
    "n": 0,
  });
} catch (e) {
  log.println(e);
}

await assertDb('move #42', xdb, ['testplants', 'testratings'], false, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]"
]);

	//
	// #43
	//

await link.end();
};

runTests();

//link.end();

/*
xdb.dumpSql = true;
xdb.dryRun = true;

xdb.insertRowNative({
  "table": "mylist",
  "values": {
    "id": 0,
    "category": "fruit",
    "val": "\"rhubarb\"",
    "sour": "no",
  },
  "where": {
    "category": "fruit",
  },
  "n": 1,
}, function(e) {
if (e) {
  console.log('e:', e);
}

xdb.deleteRowNative({
    "table": "mylist",
    "where": {
      "category": "fruit",
    },
    "n": 4,
}, function(e) {
if (e) {
  console.log('e:', e);
}

xdb.updateRowNative({
    "table": "mylist",
    "values": {
      "good4pie": true,
      "val": "a fruit",
    },
    "n": 3,
    "where": {
      "category": "fruit",
    },
    "limit": -1,
}, function(e) {
if (e) {
  console.log('e:', e);
}

xdb.moveRowNative({
    "table": "mylist",
    "where": {
      "category": "fruit",
    },
    "m": 2,
    "n": 4,
}, function(e) {
if (e) {
  console.log('e:', e);
}

xdb.readRowsNative({
  "table": "mylist",
  //    "columns": []string{
  //      "val",
  //    },
  "where": {
    "category": "fruit"
  },
}, function(e, rows) {
if (e) {
  console.log('e:', e);
}
if (rows.length === 0) {
  console.log('no rows');
}
for (var r=0; r < rows.length; ++r) {
  console.log(JSON.stringify(rows[r]));
}

xdb.dumpSql = false;
xdb.dryRun = false;

link.end();

});
});
});
});
});
*/
});
