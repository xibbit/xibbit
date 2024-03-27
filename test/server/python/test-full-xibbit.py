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
sys.path.insert(0, '../../../server/python/django')

import datetime
import json
import mysql.connector
import sys
import traceback

from xibbit.xibbithub import *

sql_prefix = "test_"

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

def assertBool(name, output, actual):
  color = 'green'
  result = 'passed'
  out = ''
  if output:
    quoted = actual
    out += str(quoted)
  if not actual:
    color = 'red'
    result = 'failed'
  pre = '\x1b[32m'
  if color != 'green':
    pre = '\x1b[31m'
  print(pre + name + ': ' + result + '\x1b[0m')
  if out:
    print(out)

def assertStr(name, output, actual, expected):
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
  def println(self, msg, lvl=2):
    print('' + str(lvl) + ':' + msg)

log = LogMe()

now = datetime.datetime(2023, 1, 13, 19, 21, 0)

installer = XibbitHub({
  'mysql': {
    'link': mysql_link,
    'SQL_PREFIX': sql_prefix
  }
})

installer.dropDatabaseTables(log, True)

installer.createDatabaseTables(log, "`json` text")

installer.stopHub()

class FakeSocket(object):
  def __init__(self, fake_sid):
    self.sid = fake_sid

	#
	# #1
	#

try:
  class Impl1(object):
    def __init__(self, sid, config):
      self.useSocketIO = True

    def mysql_real_escape_string(self, unescaped_string):
      return unescaped_string

    def mysql_query(self, query):
      return []

    def mysql_fetch_assoc(self, result):
      return None

    def mysql_free_query(self, result):
      pass

  wrapper = SocketIOWrapper()
  socket = wrapper.wrapSocket(None, {
    'impl': Impl1('', {})
  })
  assertStr("SocketWrapper #1", False,
    socket.__class__.__name__,
    'SocketWrapper'
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub = None

	#
	# #2
	#

try:
  hub = XibbitHub({})
  conn1 = FakeSocket('sid_abc')
  conn2 = FakeSocket('sid_def')
  conn3 = FakeSocket('sid_ghi')
  hub.sessions.append({
    "session_data": {
      "instance_id": 'instance_abc',
      "value": "quickbrownfox"
    },
    "_conn": {
      "sockets": [conn1]
    }
  })
  hub.sessions.append({
    "session_data": {
      "instance_id": 'instance_def',
      "value": "jumpedover"
    },
    "_conn": {
      "sockets": [conn2]
    }
  })
  hub.sessions.append({
    "session_data": {
      "instance_id": 'instance_ghi',
      "value": "lazydog"
    },
    "_conn": {
      "sockets": [conn3]
    }
  })
  sock = conn2
  retValMap = hub.getSession(sock)
  assertStr("XibbitHub.getSession #2", False,
    json.dumps(retValMap['session_data']),
    "{\"instance_id\": \"instance_def\", \"value\": \"jumpedover\"}"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #3
	#

try:
  hub = XibbitHub({})
  conn1 = FakeSocket('sid_abc')
  conn2 = FakeSocket('sid_def')
  conn3 = FakeSocket('sid_ghi')
  hub.sessions.append({
    "session_data": {
      "instance_id": 'instance_abc',
      "value": "quickbrownfox"
    },
    "_conn": {
      "sockets": [conn1]
    }
  })
  hub.sessions.append({
    "session_data": {
      "instance_id": 'instance_def',
      "value": "jumpedover"
    },
    "_conn": {
      "sockets": [conn2]
    }
  })
  hub.sessions.append({
    "session_data": {
      "instance_id": 'instance_ghi',
      "value": "lazydog"
    },
    "_conn": {
      "sockets": [conn3]
    }
  })
  sock = conn2
  retValInt = hub.getSessionIndex(sock)
  assertStr("XibbitHub.getSessionIndex #3", False,
    str(retValInt),
    "1"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #4
	#

try:
  hub = XibbitHub({})
  conn1 = FakeSocket('sid_abc')
  conn2 = FakeSocket('sid_def')
  conn3 = FakeSocket('sid_ghi')
  hub.sessions.append({
    "session_data": {
      "instance_id": 'instance_abc',
      "value": "quickbrownfox"
    },
    "_conn": {
      "sockets": [conn1]
    }
  })
  hub.sessions.append({
    "session_data": {
      "instance_id": 'instance_def',
      "value": "jumpedover"
    },
    "_conn": {
      "sockets": [conn2]
    }
  })
  hub.sessions.append({
    "session_data": {
      "instance_id": 'instance_ghi',
      "value": "lazydog"
    },
    "_conn": {
      "sockets": [conn3]
    }
  })
  retValMap = hub.getSessionByInstance('instance_def')
  assertStr("XibbitHub.getSessionByInstance #4", False,
    json.dumps(retValMap['session_data']),
    "{\"instance_id\": \"instance_def\", \"value\": \"jumpedover\"}"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #5
	#

try:
  hub = XibbitHub({})
  hub.sessions.append({
    "session_data": {
      "instance_id": 'instance_abc',
      "_username": 'john',
      "value": "quickbrownfox"
    }
  })
  hub.sessions.append({
    "session_data": {
      "instance_id": 'instance_def',
      "_username": 'bill',
      "value": "jumpedover"
    }
  })
  hub.sessions.append({
    "session_data": {
      "instance_id": 'instance_ghi',
      "_username": 'ray',
      "value": "lazydog"
    }
  })
  retValArrMap = hub.getSessionsByUsername('bill')
  assertStr('XibbitHub.getSessionsByUsername #5', False,
    json.dumps(retValArrMap),
    "[{\"session_data\": {\"instance_id\": \"instance_def\", \"_username\": \"bill\", \"value\": \"jumpedover\"}}]"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #6
	#

try:
  # create and configure the XibbitHub object
  hub = XibbitHub({})
  hub.sessions.append({
    "session_data": {
      "instance_id": 'instance_abc',
      "_username": 'john',
      "value": "quickbrownfox"
    }
  })
  hub.sessions.append({
    "session_data": {
      "instance_id": 'instance_def',
      "_username": 'bill',
      "value": "jumpedover"
    }
  })
  hub.sessions.append({
    "session_data": {
      "instance_id": 'instance_ghi',
      "_username": 'ray',
      "value": "lazydog"
    }
  })
  retValArrMap = hub.getSessionsByUsername('all')
  assertStr('XibbitHub.getSessionsByUsername #6', False,
    json.dumps(retValArrMap),
    "[{\"session_data\": {\"instance_id\": \"instance_abc\", \"_username\": \"john\", \"value\": \"quickbrownfox\"}}, {\"session_data\": {\"instance_id\": \"instance_def\", \"_username\": \"bill\", \"value\": \"jumpedover\"}}, {\"session_data\": {\"instance_id\": \"instance_ghi\", \"_username\": \"ray\", \"value\": \"lazydog\"}}]"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #7
	#

try:
  hub = XibbitHub({})
  conn1 = FakeSocket('sid_abc')
  conn2 = FakeSocket('sid_def')
  conn3 = FakeSocket('sid_ghi')
  session = {}
  session["session_data"] = {
    "instance_id": 'instance_abc',
    "value": "quickbrownfox"
  }
  session["_conn"] = {
    "sockets": [conn1]
  }
  hub.sessions.append(session)
  session = {}
  session["session_data"] = {
    "instance_id": 'instance_def',
    "value": "lazydog"
  }
  session["_conn"] = {
    "sockets": [conn2]
  }
  hub.sessions.append(session)
  sock = conn3
  hub.addSession(sock)
  assertStr('XibbitHub.addSession #7', False,
    "unimplemented",
    "unimplemented"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #8
	#

try:
  # create and configure the XibbitHub object
  hub = XibbitHub({})
  conn1 = FakeSocket('sid_abc')
  conn2 = FakeSocket('sid_def')
  conn3 = FakeSocket('sid_ghi')
  session = {}
  session["session_data"] = {
    "instance_id": 'instance_abc',
    "value": "quickbrownfox"
  }
  session["_conn"] = {
    "sockets": [conn1]
  }
  hub.sessions.append(session)
  session = {}
  session["session_data"] = {
    "instance_id": 'instance_def',
    "value": "lazydog"
  }
  session["_conn"] = {
    "sockets": [conn2]
  }
  hub.sessions.append(session)
  session = {}
  session["session_data"] = {
    "instance_id": 'instance_ghi',
    "value": "jumped"
  }
  session["_conn"] = {
    "sockets": [conn3]
  }
  sock = conn2
  hub.removeSocketFromSession(sock)
  assertStr('XibbitHub.removeSocketFromSession #8', False,
    "unimplemented",
    "unimplemented"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #9
	#

try:
  hub = XibbitHub({})
  conn1 = FakeSocket('sid_abc')
  conn2 = FakeSocket('sid_def')
  conn3 = FakeSocket('sid_ghi')
  session = {}
  session["session_data"] = {
    "instance_id": 'instance_abc',
    "value": "quickbrownfox"
  }
  session["_conn"] = {
    "sockets": [conn1]
  }
  hub.sessions.append(session)
  session = {}
  session["session_data"] = {
    "instance_id": 'instance_def',
    "value": "lazydog"
  }
  session["_conn"] = {
    "sockets": [conn2]
  }
  hub.sessions.append(session)
  session = {}
  session["session_data"] = {
    "instance_id": 'instance_ghi',
    "value": "jumped"
  }
  session["_conn"] = {
    "sockets": [conn3]
  }
  hub.sessions.append(session)
  sock = conn2
  hub.combineSessions("instance_abc", sock)
  assertStr("XibbitHub.combineSessions #9", False,
    str(len(hub.sessions[0]['_conn']['sockets'])),
    "2"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #10
	#

try:
  hub = XibbitHub({})
  conn1 = FakeSocket('sid_abc')
  session = {}
  session["session_data"] = {
    "instance_id": 'instance_abc',
    "value": "fred",
    "value2": 4
  }
  session["_conn"] = {
    "sockets": [conn1]
  }
  retValMap = hub.cloneSession(session)
  assertStr("XibbitHub.cloneSession #10", False,
    json.dumps(retValMap['session_data']),
    "{\"instance_id\": \"instance_abc\", \"value\": \"fred\", \"value2\": 4}"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #11
	#

try:
  hub = XibbitHub({})
  o = {"a": 4, "b": 5, "c": 6}
  j = json.dumps(o)
  retVal = hub.reorderJson(j, ["c"], ["b"])
  assertStr("XibbitHub.reorderJson #11", False,
    retVal,
    "{\"c\": 6,\"a\": 4,\"b\": 5}"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #12
	#

try:
  hub = XibbitHub({})
  o = {"a": 4, "b": 5, "c": 6}
  retVal = hub.reorderMap(o, ["c"], ["b"])
  assertStr("XibbitHub.reorderMap #12", False,
    json.dumps(retVal),
    "{\"c\": 6, \"a\": 4, \"b\": 5}"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #13
	#

try:
  hub = XibbitHub({})
  hub.start("best")
  assertStr('XibbitHub.start #13', False,
    "worked",
    "worked"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #14
	#

try:
  hub = XibbitHub({})
  def handler():
    print('handler')
  retVal = hub.readAndWriteUploadEvent('api', 'an_event', handler)
  assertStr('XibbitHub.readAndWriteUploadEvent #14', False,
    "unimplemented",
    "unimplemented"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #15
	#

try:
  hub = XibbitHub({})
  def onHandler():
    return event
  hub.on('api', 'an_event', onHandler)
  assertBool("XibbitHub.on #15", False,
    hub.handler_groups['api']['an_event'] == onHandler
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #16
	#

try:
  hub = XibbitHub({})
  invoked = False
  def triggerHandler(event, vars):
    global invoked
    invoked = True
    return event
  hub.handler_groups['api']['an_event'] = triggerHandler
  hub.trigger({"type": "an_event"})
  assertBool("XibbitHub.trigger #16", False,
    invoked
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #17
	#

try:
  hub = XibbitHub({})
  invoked = False
  class FakeSocket17(object):
    def __init__(self):
      pass

    def emit(self, room, event):
      global invoked
      invoked = True

  session = {}
  session["session_data"] = {
    'instance_id': 'bill',
    '_username': 'bill'
  }
  session["_conn"] = {
    "sockets": [FakeSocket17()]
  }
  hub.sessions.append(session)
  hub.send({'type': 'an_event'}, 'bill', True)
  assertBool('XibbitHub.send #17', False,
    invoked
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #18
	#

try:
  hub = XibbitHub({})
  events = [{"type": "an_event"}]
  retVal = hub.receive(events, {}, True)
  assertStr("XibbitHub.receive #18", False,
    json.dumps(retVal),
    "[{\"type\": \"an_event\"}]"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #19
	#

try:
  hub = XibbitHub({})
  event = {"type": "an_event", "_session": {}}
  retVal = hub.connect(event, "bill", True)
  assertStr("XibbitHub.connect #19", False,
    json.dumps(retVal),
    "{\"type\": \"an_event\", \"_session\": {}}"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #20
	#

try:
  # create and configure the XibbitHub object
  hub = XibbitHub({})
  hub.touch({})
  assertStr("XibbitHub.touch #20", False,
    "unimplemented",
    "unimplemented"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #21
	#

try:
  hub = XibbitHub({
    'mysql': {
      'link': mysql_link,
      'SQL_PREFIX': sql_prefix
    }
  })
  invoked = False
  def clockHandler(event, vars):
    global invoked
    invoked = True
    return {'globalVars': {}}
  hub.handler_groups['api'] = {}
  hub.handler_groups['api']['__clock'] = clockHandler
  hub.checkClock()
  assertStr('XibbitHub.checkClock #21', False,
    "unimplemented",
    "unimplemented"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #22
	#

try:
  # create and configure the XibbitHub object
  hub = XibbitHub({
    'mysql': {
      'link': mysql_link,
      'SQL_PREFIX': sql_prefix
    }
  })
  hub.updateExpired('sockets', 5)
  assertStr("XibbitHub.updateExpired #22", False,
    "unimplemented",
    "unimplemented"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #23
	#

try:
  hub = XibbitHub({
    'mysql': {
      'link': mysql_link,
      'SQL_PREFIX': sql_prefix
    }
  })
  hub.deleteExpired('sockets', 5)
  assertStr("XibbitHub.deleteExpired #23", False,
    "unimplemented",
    "unimplemented"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #24
	#

try:
  hub = XibbitHub({
    'mysql': {
      'link': mysql_link,
      'SQL_PREFIX': sql_prefix
    }
  })
  hub.deleteOrphans("sockets_events", "sid", "sockets", "sid")
  assertStr("XibbitHub.deleteOrphans #24", False,
    "unimplemented",
    "unimplemented"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #25
	#

try:
  hub = XibbitHub({})
  retValInt = hub.cmp({'___id': 4}, {'___id': 8})
  assertStr('XibbitHub.cmp #25', False,
    str(retValInt),
    "-1"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #26
	#

try:
  hub = XibbitHub({})
  event = {"type": "a_event", "a": "b", "c": "d", "e": "f"}
  retValMap = hub.cloneEvent(event, ["a", "e"])
  assertStr('XibbitHub.cloneEvent #26', False,
    json.dumps(retValMap),
    "{\"type\": \"a_event\", \"c\": \"d\"}"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #27
	#

try:
  hub = XibbitHub({})
  event = {"type": "a_event", "a": "b", "c": "d", "e": "f"}
  retValMap = hub.updateEvent(event, {"c": "z", "r": 4}, ["r", "type"])
  assertStr('XibbitHub.updateEvent #27', False,
    json.dumps(retValMap),
    "{\"type\": \"a_event\", \"a\": \"b\", \"c\": \"z\", \"e\": \"f\"}"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #28
	#

try:
  hub = XibbitHub({})
  retValInt = hub.rand_secure(0, 4)
  assertBool("XibbitHub.rand_secure #28", False,
    (retValInt >= 0) and (retValInt <= 4)
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #29
	#

try:
  hub = XibbitHub({
    'mysql': {
      'link': mysql_link,
      'SQL_PREFIX': sql_prefix
    }
  })
  retValBool = hub.lockGlobalVars()
  hub.unlockGlobalVars()
  assertBool('XibbitHub.lockGlobalVars #29', False,
    retValBool
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #30
	#

try:
  hub = XibbitHub({
    'mysql': {
      'link': mysql_link,
      'SQL_PREFIX': sql_prefix
    }
  })
  retValBool = hub.lockGlobalVarsUsingSql()
  assertBool('XibbitHub.lockGlobalVarsUsingSql #30', False,
    retValBool
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #31
	#

try:
  hub = XibbitHub({
    'mysql': {
      'link': mysql_link,
      'SQL_PREFIX': sql_prefix
    }
  })
  retValBool = hub.unlockGlobalVars()
  assertBool('XibbitHub.unlockGlobalVars #31', False,
    retValBool
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #32
	#

try:
  hub = XibbitHub({
    'mysql': {
      'link': mysql_link,
      'SQL_PREFIX': sql_prefix
    }
  })
  retValBool = hub.unlockGlobalVarsUsingSql()
  assertBool('XibbitHub.unlockGlobalVarsUsingSql #32', False,
    retValBool
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #33
	#

try:
  hub = XibbitHub({
    'mysql': {
      'link': mysql_link,
      'SQL_PREFIX': sql_prefix
    }
  })
  retValMap = hub.readGlobalVars()
  assertBool('XibbitHub.readGlobalVars #33', False,
    '_lastTick' in retValMap
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #34
	#

try:
  hub = XibbitHub({
    'mysql': {
      'link': mysql_link,
      'SQL_PREFIX': sql_prefix
    }
  })
  retValMap = hub.readGlobalVarsUsingSql()
  assertBool('XibbitHub.readGlobalVarsUsingSql #34', False,
    '_lastTick' in retValMap
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #35
	#

try:
  hub = XibbitHub({
    'mysql': {
      'link': mysql_link,
      'SQL_PREFIX': sql_prefix
    }
  })
  hub.writeGlobalVars({"kind": "mammal"})
  retValMap = hub.readGlobalVars()
  assertStr('XibbitHub.writeGlobalVars #35', False,
    json.dumps(retValMap),
    "{\"kind\": \"mammal\"}"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #36
	#

try:
  hub = XibbitHub({
    'mysql': {
      'link': mysql_link,
      'SQL_PREFIX': sql_prefix
    }
  })
  hub.writeGlobalVarsUsingSql({"kind": "mammal"})
  retValMap = hub.readGlobalVarsUsingSql()
  assertStr('XibbitHub.writeGlobalVarsUsingSql #36', False,
    json.dumps(retValMap),
    "{\"kind\": \"mammal\"}"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #37
	#

try:
  hub = XibbitHub({
    'mysql': {
      'link': mysql_link,
      'SQL_PREFIX': sql_prefix
    }
  })
  qr = hub.mysql_query("SELECT `socksessid` FROM "+sql_prefix+"sockets_sessions;")
  retValMap = hub.mysql_fetch_assoc(qr)
  hub.mysql_free_query(qr)
  assertStr('XibbitHub.mysql_query #37', False,
    json.dumps(retValMap),
    "{\"socksessid\": \"global\"}"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #38
	#

try:
  hub = XibbitHub({
    'mysql': {
      'link': mysql_link,
      'SQL_PREFIX': sql_prefix
    }
  })
  retValStr = hub.mysql_real_escape_string("\"Chicago Pizz'a\" is good")
  assertStr('XibbitHub.mysql_real_escape_string #38', False,
    retValStr,
    "\\\"Chicago Pizz\\'a\\\" is good"
  )
except Exception as e:
  exc_info = sys.exc_info()
  traceback.print_exception(*exc_info)
hub.stopHub()
hub = None

	#
	# #39
	#

try:
  hub = XibbitHub({
    'mysql': {
      'link': mysql_link,
      'SQL_PREFIX': sql_prefix
    }
  })
  try:
    hub.mysql_query("SELECT x FROM "+sql_prefix+"sockets")
    assertBool('XibbitHub.mysql_errno #39', False,
      False
    )
  except Exception as e:
    retValInt = hub.mysql_errno(e)
    assertStr('XibbitHub.mysql_errno #39', False,
      str(retValInt),
      "1054"
  )
except Exception as e:
  log.println(str(e))
hub.stopHub()
hub = None

	#
	# #40
	#

try:
  hub = XibbitHub({
    'mysql': {
      'link': mysql_link,
      'SQL_PREFIX': sql_prefix
    }
  })
  try:
    hub.mysql_query("SELECT x FROM "+sql_prefix+"sockets")
    assertBool('XibbitHub.mysql_errstr #40', False,
      False
    )
  except Exception as e:
    retValStr = hub.mysql_errstr(e)
    assertStr('XibbitHub.mysql_errstr #40', False,
      retValStr,
      "Unknown column 'x' in 'field list'"
  )
except Exception as e:
  log.println(str(e))
hub = None
