# -*- coding: utf-8 -*-
# The MIT License (MIT)
#
# xibbit 2.0.0 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.
#
# @version 2.0.0
# @copyright xibbit 2.0.0 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
# @license http://opensource.org/licenses/MIT

import sys
sys.path.insert(0, '../../../server/python2.7/django1.11/xibdb')

import datetime
import json
import mysql.connector

from xibdb import XibDb

def sortJsonNative(o):
  s = ''
  if isinstance(o, list):
    s += '['
    for i in range(len(o)):
      if s != '[':
        s += ','
      s += sortJsonNative(o[i])
    s += ']'
  elif isinstance(o, dict):
    keys = list(o.keys())
    keys.sort()
    s += '{'
    for k in range(len(keys)):
      key = keys[k]
      value = o[key]
      if isinstance(key, unicode):
        key = str(key)
      if isinstance(value, unicode):
        value = str(value)
      if s != '{':
        s += ','
      s += sortJsonNative(key) + ':' + sortJsonNative(value)
    s += '}';
  elif isinstance(o, bool):
    s = 'false'
    if o:
      s = 'true'
  elif isinstance(o, int):
    s = str(o)
  elif isinstance(o, float):
    s = str(o)
  elif  isinstance(o, datetime.datetime):
    s = '"' + o.strftime('%Y-%m-%d %H:%M:%S') + '"'
  elif isinstance(o, str):
    s = '"' + o.replace('"', "\\\"") + '"'
  return s

def assertDb(name, xdb, tables, output, expectedJson):
  i = 0
  color = 'green'
  result = 'passed'
  out = ''
  for table in tables:
    rows = xdb.readRowsNative({
      'table': table
    })
    actual = sortJsonNative(rows)
    expected = expectedJson[i]
    if output:
      quoted = actual
      quoted = quoted.replace("\\", "\\\\")
      quoted = quoted.replace("\"", "\\\"")
      quoted = "\"" + quoted + "\",\n"
      out += quoted
    if actual != expected:
      color = 'red'
      result = 'failed to match actual to expected'
      break
    i += 1
  pre = '\x1b[32m'
  if color != 'green':
    pre = '\x1b[31m'
  print(pre + name + ': ' + result + '\x1b[0m')
  if out:
    print(out)

def assertRows(name, rows, output, expectedJson):
  actual = sortJsonNative(rows)
  expected = expectedJson
  color = 'green'
  result = 'passed'
  out = ''
  if output:
    quoted = actual
    out += quoted
  if actual != expected:
    color = 'red'
    result = 'failed'
  pre = '\x1b[32m'
  if color != 'green':
    pre = '\x1b[31m'
  print(pre + name + ': ' + result + '\x1b[0m')
  if out:
    print(out)

mysql_link = mysql.connector.connect(
  user='root',
  password='mysql',
  host='127.0.0.1',
  database='publicfigure'
)

class LogMe(object):
  def println(self, s):
    print(s)

log = LogMe()

xdb = XibDb({
    'json_column': 'json', # freeform JSON column name
    'sort_column': 'n',    # array index column name
    'mysql': {
    'link': mysql_link
  }
})

now = datetime.datetime(2023, 1, 13, 19, 21, 0)

xdb.dumpSql = False
xdb.dryRun = False

try:
  q = 'DROP TABLE `testplants`;'
  xdb.mysql_query(q)
except Exception as e:
  log.println(e)

try:
  q = 'DROP TABLE `testratings`;'
  xdb.mysql_query(q)
except Exception as e:
  log.println(e)

try:
  q = 'CREATE TABLE `testplants` ( '
  q += '`id` bigint(20) unsigned NOT NULL auto_increment,'
  q += '`category` text,'
  q += '`val` text,'
  q += '`colors` text,'
  q += '`seeds` tinyint(1),'
  q += '`total` int,'
  q += '`price` float,'
  q += '`created` datetime NOT NULL,' # 2014-12-23 06:00:00 (PST)
  q += '`n` bigint(20) unsigned NOT NULL,'
  q += '`json` text,'
  q += 'UNIQUE KEY `id` (`id`));';
  xdb.mysql_query(q)
except Exception as e:
  log.println(e)

try:
  q = 'CREATE TABLE `testratings` ( '
  q += '`id` bigint(20) unsigned NOT NULL auto_increment,'
  q += '`pid` bigint(20) unsigned NOT NULL,'
  q += '`name` text,'
  q += '`rating` int,'
  q += '`json` text,'
  q += 'UNIQUE KEY `id` (`id`));';
  xdb.mysql_query(q)
except Exception as e:
  log.println(e)

	#
	# #1
	#

try:
  xdb.insertRowNative({
    'table': 'testplants',
    'values': {
       'id': 0,
       'category': 'fruit',
       'val': 'apple',
       'colors': ' red green ',
       'seeds': True,
       'pit': False,
       'total': 28,
       'price': 0.5,
       'created': now
    },
    'where': {
      'category': 'fruit'
  }})
except Exception as e:
  log.println(e)

assertDb('insert #1', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"}]",
		"[]",
])

	#
	# #2
	#

try:
  xdb.insertRowNative({
    'table': 'testplants',
    'values': {
      'id': 0,
      'category': 'fruit',
      'val': "lemon's \"the great\"",
      'colors': ' yellow ',
      'seeds': True,
      'total': 8,
      'price': 0.25,
      'created': now
    },
    'where': {
      'category': 'fruit'
    }
  })
except Exception as e:
  log.println(e)

assertDb('insert #2', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"}]",
		"[]",
])

	#
	# #3
	#

try:
  xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "fruit",
      "val": "apricot",
      "colors": " yellow orange ",
      "seeds": False,
      "pit": True,
      "total": 16,
      "price": 2.0,
      "created": now
    },
    "where": {
      "category": "fruit",
    }
  })
except Exception as e:
  log.println(e)

assertDb('insert #3', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"}]",
		"[]",
])

	#
	# #4
	#

try:
  xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "fruit",
      "val": "pomegrante",
      "colors": " purple red white ",
      "seeds": True,
      "total": 5,
      "price": 4.08,
      "created": now
    },
    "where": {
      "category": "fruit",
    }
  })
except Exception as e:
  log.println(e)

assertDb('insert #4', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"}]",
		"[]",
])

	#
	# #5
	#

try:
  xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "flower",
      "val": "rose",
      "colors": " white yellow red ",
      "seeds": False,
      "total": 12,
      "price": 5.0,
      "thorns": True,
      "created": now
    },
    "where": {
      "category": "flower",
    }
  })
except Exception as e:
  log.println(e)

assertDb('insert #5', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"}]",
		"[]",
])

	#
	# #6
	#

try:
  xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "fruit",
      "val": "orange",
      "colors": " orange ",
      "total": 1,
      "price": 0.10,
      "seeds": True,
      "skin": {
        "thickness": "thin",
        "fragrant": True
      },
      "created": now
    },
    "where": {
      "category": "fruit",
    }
  })
except Exception as e:
  log.println(e)

assertDb('insert #6', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"}]",
		"[]",
])

	#
	# #7
	#

try:
  xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "flower",
      "val": "tulip",
      "colors": " white ",
      "seeds": False,
      "total": 1,
      "price": 1.75,
      "created": now
    },
    "where": {
      "category": "flower",
    }
  })
except Exception as e:
  log.println(e)

assertDb('insert #7', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"}]",
		"[]",
])

	#
	# #8
	#

try:
  xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "fruit",
      "val": "strawberry",
      "colors": " red ",
      "seeds": False,
      "total": 164,
      "price": 0.08,
      "created": now
    },
    "where": {
      "category": "fruit",
    }
  })
except Exception as e:
  log.println(e)

assertDb('insert #8', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"}]",
		"[]",
])

	#
	# #9
	#

try:
  xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "fruit",
      "val": "cherry",
      "colors": " red purple ",
      "seeds": False,
      "pit": True,
      "total": 22,
      "price": 0.16,
      "created": now
    },
    "where": {
      "category": "fruit",
    }
  })
except Exception as e:
  log.println(e)

assertDb('insert #9', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[]",
])

	#
	# #10
	#

try:
  xdb.insertRowNative({
    "table": "testratings",
    "values": {
      "id": 0,
      "pid": 8,
      "name": "fruitycorp",
      "rating": 9
    }
  })
except Exception as e:
  log.println(e)

assertDb('insert #10', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9}]",
])

	#
	# #11
	#

try:
  xdb.insertRowNative({
    "table": "testratings",
    "values": {
      "id": 0,
      "pid": 8,
      "name": "greengrocer",
      "rating": 8
    }
  })
except Exception as e:
  log.println(e)

assertDb('insert #11', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8}]",
])

	#
	# #12
	#

try:
  xdb.insertRowNative({
    "table": "testratings",
    "values": {
      "id": 0,
      "pid": 3,
      "name": "fruitycorp",
      "rating": 4
    }
  })
except Exception as e:
  log.println(e)

assertDb('insert #12', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4}]",
])

	#
	# #13
	#

try:
  xdb.insertRowNative({
    "table": "testratings",
    "values": {
      "id": 0,
      "pid": 99,
      "name": "appledude",
      "reviewed": False,
      "rating": 5
    }
  })
except Exception as e:
  log.println(e)

assertDb('insert #13', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false}]",
])

	#
	# #14
	#

try:
  xdb.insertRowNative({
    "table": "testratings",
    "values": {
      "id": 0,
      "pid": 3,
      "name": "apricoteater",
      "draft": True,
      "rating": 3
    }
  })
except Exception as e:
  log.println(e)

assertDb('insert #14', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3}]",
])

	#
	# #15
	#

try:
  xdb.insertRowNative({
    "table": "testratings",
    "values": {
      "id": 0,
      "pid": 8,
      "name": "produceguy",
      "rating": 7
    }
  })
except Exception as e:
  log.println(e)

assertDb('insert #15', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
])

	#
	# #16
	#

try:
  xdb.updateRowNative({
    "table": "testplants",
    "values": {
      "good4pie": True,
      "val": "apricot (changed)",
    },
    "n": 2,
    "where": {
      "category": "fruit",
    },
    "limit": 1,
  })
except Exception as e:
  log.println(e)

assertDb('update #16', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
])

	#
	# #17
	#

def get_key(row):
  return row.get('rating')

try:
  rows = xdb.readRowsNative({
    'table': 'testplants',
    'on': {
      'testratings': {
        'testratings.pid': 'testplants.id'
      }
    },
    'where': {
      'category': 'fruit'
    },
    'order by': '`testratings`.`rating`'
  })
  rows.sort(key=get_key)
  assertRows('select on #17', rows, False,
		"[{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9}]",
  )
except Exception as e:
  log.println(e)

# UpdateRowNative: more changes

	#
	# #18
	#

try:
  rows = xdb.readRowsNative({
    'table': 'testplants',
    'columns': [
      'val',
      'price'
    ],
    'on': {
      'testratings': {
        'testratings.pid': 'testplants.id'
      }
    },
    'where': {
      'category': 'fruit'
    },
    'order by': '`testratings`.`rating`'
  })
  rows.sort(key=get_key)
  assertRows('select on #18', rows, False,
		"[{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"price\":2.0,\"rating\":3,\"val\":\"apricot (changed)\"},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"price\":2.0,\"rating\":4,\"val\":\"apricot (changed)\"},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"price\":0.08,\"rating\":7,\"val\":\"strawberry\"},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"price\":0.08,\"rating\":8,\"val\":\"strawberry\"},{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"price\":0.08,\"rating\":9,\"val\":\"strawberry\"}]",
  )
except Exception as e:
  log.println(e)

	#
	# #19
	#

try:
  row = xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "fruit",
      "val": "kiwi",
      "colors": " green ",
      "seeds": False,
      "total": 4,
      "sweet": "very, very",
      "price": 2.28,
      "created": now
    },
    "where": {
      "category": "fruit",
    },
    "n": 0,
  })
except Exception as e:
  log.println(e)

assertDb('insert #19', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
])

	#
	# #20
	#

try:
  xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "fruit",
      "val": "raspberry",
      "colors": " red ",
      "seeds": False,
      "total": 17,
      "sweet": 3,
      "price": 0.12,
      "created": now
    },
    "where": {
      "category": "fruit",
    },
    "n": 4,
  })
except Exception as e:
  log.println(e)

assertDb('insert #20', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
])

	#
	# #21
	#

try:
  xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "fruit",
      "val": "grapefruit",
      "colors": " orange yellow pink ",
      "seeds": True,
      "total": 3,
      "sour": 4,
      "price": 3.14,
      "created": now
    },
    "where": {
      "category": "fruit",
    },
    "n": 4,
  })
except Exception as e:
  log.println(e)

assertDb('insert #21', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
])

	#
	# #22
	#

try:
  xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "fruit",
      "val": "banana",
      "colors": " yellow green ",
      "seeds": False,
      "total": 3,
      "pulpcolor": "white",
      "price": 1.02,
      "created": now
    },
    "where": " WHERE `category`='fruit'",
    "n": 4,
  })
except Exception as e:
  log.println(e)

assertDb('insert #22', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
])

	#
	# #23
	#

try:
  xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "fruit",
      "val": "watermelon",
      "colors": " red ",
      "seeds": False,
      "total": 1.5,
      "price": 2.50,
      "created": now
    },
    "where": " WHERE `category`='fruit'",
    "n": 4,
  })
except Exception as e:
  log.println(e)

assertDb('insert #23', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
])

	#
	# #24
	#

try:
  xdb.insertRowNative({
    "table": "testplants",
    "values": {
      "id": 0,
      "category": "fruit",
      "val": "mango",
      "colors": " orange ",
      "seeds": True,
      "total": 7,
      "price": 1.13,
      "created": now
    },
    "where": "`category`='fruit'",
    "n": 4,
  })
except Exception as e:
  log.println(e)

assertDb('insert #24', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"price\":1.13,\"seeds\":true,\"total\":7,\"val\":\"mango\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
])

	#
	# #25
	#

try:
  xdb.insertRowNative({
    "table": "testplants",
    "values": "(`category`,`val`,`colors`,`seeds`,`total`,`price`,`created`,`n`,`json`) VALUES ('fruit','blueberry',' blue ',0,18,0.22,'2023-01-13 19:21:00',13,'{\"stains\":true}')",
    "where": {
      "category": "fruit",
    },
    "n": 13,
  })
except Exception as e:
  log.println(e)

assertDb('insert #25', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"price\":1.13,\"seeds\":true,\"total\":7,\"val\":\"mango\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
])

	#
	# #26
	#

try:
  xdb.updateRowNative({
    "table": "testplants",
    "values": {
      "open": True,
      "val": "mango (changed)"
    },
    "n": 4,
    "where": {
      "category": "fruit",
    }
  })
except Exception as e:
  log.println(e)

assertDb('update #26', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"open\":true,\"price\":1.13,\"seeds\":true,\"total\":7,\"val\":\"mango (changed)\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
])

	#
	# #27
	#

try:
  xdb.updateRowNative({
    "table": "testplants",
    "values": {
      "val": "mango2 (changed)",
      "zebra": 2.0
    },
    "n": 4,
    "where": {
      "category": "fruit",
    }
  })
except Exception as e:
  log.println(e)

assertDb('update #27', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"open\":true,\"price\":1.13,\"seeds\":true,\"total\":7,\"val\":\"mango2 (changed)\",\"zebra\":2.0},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
])

	#
	# #28
	#

try:
  xdb.updateRowNative({
    "table": "testplants",
    "values": {
      "zebra": 3.1
    },
    "n": 4,
    "where": {
      "category": "fruit",
    }
  })
except Exception as e:
  log.println(e)

assertDb('update #28', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"open\":true,\"price\":1.13,\"seeds\":true,\"total\":7,\"val\":\"mango2 (changed)\",\"zebra\":3.1},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
])

	#
	# #29
	#

try:
  xdb.updateRowNative({
    "table": "testplants",
    "values": {
      "unfinished":  True,
      "val": "mango33 (changed)",
      "n": "str"
    },
    "n": 4,
    "where": {
      "category": "fruit",
    }
  })
except Exception as e:
  log.println(e)

assertDb('update #29', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"n\":\"str\",\"open\":true,\"price\":1.13,\"seeds\":true,\"total\":7,\"unfinished\":true,\"val\":\"mango33 (changed)\",\"zebra\":3.1},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
])

	#
	# #30
	#

try:
  rows = xdb.readRowsNative({
    'table': 'testplants',
    'where': {
      'category': 'fruit'
    }
  })
  assertRows('select on #30', rows, False,
		"[{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"n\":\"str\",\"open\":true,\"price\":1.13,\"seeds\":true,\"total\":7,\"unfinished\":true,\"val\":\"mango33 (changed)\",\"zebra\":3.1},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]"
  )
except Exception as e:
  log.println(e)

	#
	# #31
	#

try:
  xdb.deleteRowNative({
    "table": "testplants",
    "where": {
      "category": "fruit",
    },
    "n": 4,
  })
except Exception as e:
  log.println(e)

assertDb('delete #31', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
])

	#
	# #32
	#

try:
  xdb.deleteRowNative({
    "table": "testplants",
    "where": {
      "category": "fruit",
    },
    "n": 0,
  })
except Exception as e:
  log.println(e)

assertDb('delete #32', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
])

	#
	# #33
	#

try:
  xdb.deleteRowNative({
    "table": "testplants",
    "where": {
      "category": "fruit",
    },
    "n": -1,
  })
except Exception as e:
  log.println(e)

assertDb('delete #33', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
])

	#
	# #34
	#

try:
  xdb.deleteRowNative({
    "table": "testplants",
    "where": " WHERE `category`='fruit'",
    "n": 0,
  })
except Exception as e:
  log.println(e)

assertDb('delete #34', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
])

	#
	# #35
	#

try:
  xdb.deleteRowNative({
    "table": "testplants",
    "where": " WHERE `category`='fruit'",
    "n": 0,
  })
except Exception as e:
  log.println(e)

assertDb('delete #35', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
])

	#
	# #36
	#

try:
  xdb.deleteRowNative({
    "table": "testplants",
    "where": "`category`='fruit'",
    "n": 0,
  })
except Exception as e:
  log.println(e)

assertDb('delete #36', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
])

	#
	# #37
	#

try:
  xdb.deleteRowNative({
    "table": "testratings",
    "where": {
      "pid": 99
    }
  })
except Exception as e:
  log.println(e)

assertDb('delete #37', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
])

	#
	# #38
	#

try:
  # DeleteRowNative: "n" is not an int; n is a JSON string
  xdb.deleteRowNative({
    "table": "testplants",
    "where": {
      "category": "fruit",
    },
    "n": '{"address": "608"}'
  })
except Exception as e:
  if str(e) != "1054 (42S22): Unknown column 'address' in 'where clause'":
    log.println(e)

assertDb('delete #38', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
])

	#
	# #39
	#

try:
  # DeleteRowNative: "n" is not an int; something else
  xdb.deleteRowNative({
    "table": "testplants",
    "where": {
      "category": "fruit",
    },
    "n": " ADN something"
  })
except Exception as e:
  if str(e) != "1064 (42000): You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'ADN something ORDER BY `n` DESC' at line 1":
    log.println(e)

assertDb('delete #39', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
])

	#
	# #40
	#

try:
  xdb.moveRowNative({
    "table": "testplants",
    "where": {
      "category": "fruit",
    },
    "m": 2,
    "n": 6,
  })
except Exception as e:
  log.println(e)

assertDb('move #40', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
])

	#
	# #41
	#

try:
  xdb.moveRowNative({
    "table": "testplants",
    "where": {
      "category": "fruit",
    },
    "m": 5,
    "n": 1,
  })
except Exception as e:
  log.println(e)

assertDb('move #41', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
])

	#
	# #42
	#

try:
  xdb.moveRowNative({
    "table": "testplants",
    "where": {
      "category": "fruit",
    },
    "m": 5,
    "n": 0,
  })
except Exception as e:
  log.println(e)

assertDb('move #42', xdb, ['testplants', 'testratings'], False, [
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
])

	#
	# #43
	#
