// The MIT License (MIT)
//
// xibbit 2.0.0 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @version 2.0.0
// @copyright xibbit 2.0.0 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
var timeZone = 'America/Los_Angeles';
var XibbitHub = require('../../../server/node/xibbithub')();

var mysql = require('mysql');
const util = require('util');

var sql_prefix= 'test_';
var now = '2023-12-16 02:30:45';
var nullDateTime = '1970-01-01 00:00:00';

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

function assertBool(name, output, actual) {
  var color = 'green';
  var result = 'passed';
  var out = '';
  if (output) {
    quoted = "";
    quoted = quoted.split("\\").join("\\\\");
    quoted = quoted.split("\"").join("\\\"");
    quoted = "\"" + quoted + "\",";
    out += quoted;
  }
  if (!actual) {
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
function assertStr(name, output, actual, expected) {
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
  this.println = function(msg, lvl) {
    lvl = ([0, 1, 2].indexOf(lvl) === -1)? 2: lvl;
    console.log('' + lvl + ':' + msg);
  };
}
var log = new LogMe();

// create and configure the XibbitHub object
var installer = new XibbitHub({
  //'socketio': socketio,
  'mysql': {
    'link': link,
    'SQL_PREFIX': 'test_'
  },
  time_zone: timeZone
}, false);

installer.dropDatabaseTables(log, true, function() {

installer.createDatabaseTables(log, '`json` text', function () {

installer.stopHub();

function FakeSocket(fake_sid, id) {
  this.sid = fake_sid;
  this.id = fake_sid;
};

async function runTests() {

var hub = null;

	//
	// #1
	//

try {
  hub = new XibbitHub({});
  var conn1 = new FakeSocket('sid_abc');
  var conn2 = new FakeSocket('sid_def');
  var conn3 = new FakeSocket('sid_ghi');
  hub.sessions.push({
    "session_data": {
      "instance_id": "instance_abc",
      "value": "thequickbrownfox"
    },
    "_conn": {
      "sockets": [conn1]
    }
  });
  hub.sessions.push({
    "session_data": {
      "instance_id": "instance_def",
      "value": "jumpedover"
    },
    "_conn": {
      "sockets": [conn2]
    }
  });
  hub.sessions.push({
    "session_data": {
      "instance_id": "instance_ghi",
      "value": "lazydog"
    },
    "_conn": {
      "sockets": [conn3]
    }
  });
  var sock = conn2;
  var retValMap = hub.getSession(sock);
  assertStr("XibbitHub.getSession #1", false,
    JSON.stringify(retValMap.session_data),
    "{\"instance_id\":\"instance_def\",\"value\":\"jumpedover\"}"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #2
	//

try {
  hub = new XibbitHub({});
  var conn1 = new FakeSocket('sid_abc');
  var conn2 = new FakeSocket('sid_def');
  var conn3 = new FakeSocket('sid_ghi');
  var session = {
    "session_data": {
      "instance_id": "instance_abc",
      "value": "thequickbrownfox"
    },
    "_conn": {
      "sockets": [conn1]
    }
  };
  hub.sessions.push(session);
  session = {
    "session_data": {
      "instance_id": "instance_def",
      "value": "jumpedover"
    },
    "_conn": {
      "sockets": [conn2]
    }
  };
  hub.sessions.push(session);
  session = {
    "session_data": {
      "instance_id": "instance_ghi",
      "value": "lazydog"
    },
    "_conn": {
      "sockets": [conn3]
    }
  };
  hub.sessions.push(session);
  var sock = conn2;
  var retValInt = hub.getSessionIndex(sock);
  assertStr("XibbitHub.getSessionIndex #2", false,
    ''+retValInt,
    '1'
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #3
	//

try {
  hub = new XibbitHub({});
  var conn1 = new FakeSocket('sid_abc');
  var conn2 = new FakeSocket('sid_def');
  var conn3 = new FakeSocket('sid_ghi');
  var session = {
    "session_data": {
      "instance_id": "instance_abc",
      "value": "thequickbrownfox"
    },
    "_conn": {
      "sockets": [conn1]
    }
  };
  hub.sessions.push(session);
  session = {
    "session_data": {
      "instance_id": "instance_def",
      "value": "jumpedover"
    },
    "_conn": {
      "sockets": [conn2]
    }
  };
  hub.sessions.push(session);
  session = {
    "session_data": {
      "instance_id": "instance_ghi",
      "value": "lazydog"
    },
    "_conn": {
      "sockets": [conn3]
    }
  };
  hub.sessions.push(session);
  var sock = conn2
  var retValMap = hub.getSessionByInstance('instance_def');
  assertStr("XibbitHub.getSessionByInstance #3", false,
    JSON.stringify(retValMap.session_data),
    "{\"instance_id\":\"instance_def\",\"value\":\"jumpedover\"}"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #4
	//

try {
  hub = new XibbitHub({});
  hub.sessions.push({
    "session_data": {
      "instance_id": "instance_abc",
      "value": "thequickbrownfox"
    },
    "_conn": {
      "sockets": [conn1]
    }
  });
  hub.sessions.push({
    "session_data": {
      "instance_id": "instance_def",
      "_username": "bill",
      "value": "jumpedover"
    },
    "_conn": {
      "sockets": [conn2]
    }
  });
  hub.sessions.push({
    "session_data": {
      "instance_id": "instance_ghi",
      "_username": "bill",
      "value": "lazydog"
    },
    "_conn": {
      "sockets": [conn3]
    }
  });
  var retValArrMap = hub.getSessionsByUsername('bill');
  assertStr('XibbitHub.getSessionsByUsername #4', false,
    retValArrMap[0].session_data.value + retValArrMap[1].session_data.value,
    "jumpedoverlazydog"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #5
	//

try {
  // create and configure the XibbitHub object
  hub = new XibbitHub({});
  hub.sessions.push({
    "session_data": {
      "instance_id": "instance_abc",
      "value": "thequickbrownfox"
    },
    "_conn": {
      "sockets": [conn1]
    }
  });
  hub.sessions.push({
    "session_data": {
      "instance_id": "instance_def",
      "_username": "bill",
      "value": "jumpedover"
    },
    "_conn": {
      "sockets": [conn2]
    }
  });
  hub.sessions.push({
    "session_data": {
      "instance_id": "instance_ghi",
      "_username": "bill",
      "value": "lazydog"
    },
    "_conn": {
      "sockets": [conn3]
    }
  });
  var retValArrMap = hub.getSessionsByUsername('all');
  assertStr('XibbitHub.getSessionsByUsername #5', false,
    '' + retValArrMap.length,
    "3"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #6
	//

try {
  hub = new XibbitHub({});
  var conn1 = new FakeSocket('sid_abc');
  var conn2 = new FakeSocket('sid_def');
  var conn3 = new FakeSocket('sid_ghi');
  var session = {
    "session_data": {
      "instance_id": "instance_abc",
      "value": "thequickbrownfox"
    },
    "_conn": {
      "sockets": [conn1]
    }
  };
  hub.sessions.push(session);
  session = {
    "session_data": {
      "instance_id": "instance_def",
      "value": "jumpedover"
    },
    "_conn": {
      "sockets": [conn2]
    }
  };
  hub.sessions.push(session);
  session = {
    "session_data": {
      "instance_id": "instance_ghi",
      "value": "lazydog"
    },
    "_conn": {
      "sockets": [conn3]
    }
  };
  hub.sessions.push(session);
  var sock = conn2;
  hub.setSessionData(sock, {"instance_id": "instance_def", "value": "goodman"});
  assertStr("XibbitHub.setSessionData #6", false,
    hub.sessions[1]['session_data']['value'],
    "goodman"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #7
	//

try {
  hub = new XibbitHub({});
  var conn1 = new FakeSocket('sid_abc');
  var conn2 = new FakeSocket('sid_def');
  var session = {};
  session["session"] = {"value": "thequickbrownfox"};
  session["socket"] = conn1;
  hub.sessions['instance_abc'] = session;
  session = {};
  session["session"] = { "value": "jumpedover"};
  session["socket"] = conn2;
  hub.sessions['instance_def'] = session;
  var sock = conn2;
  hub.addSession(sock);
  assertStr('XibbitHub.addSession #7', false,
    "unimplemented",
    "unimplemented"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #8
	//

try {
  // create and configure the XibbitHub object
  hub = new XibbitHub({});
  var conn1 = new FakeSocket('sid_abc');
  var conn2 = new FakeSocket('sid_def');
  var conn3 = new FakeSocket('sid_ghi');
  var session = {};
  session["session"] = {"value": "thequickbrownfox"};
  session["socket"] = conn1;
  hub.sessions['instance_abc'] = session;
  session = {};
  session["session"] = {"value": "lazydog"};
  session["socket"] = conn2;
  hub.sessions['instance_def'] = session;
  session = {};
  session["session"] = {"value": "jumped"};
  session["socket"] = conn3;
  hub.sessions['instance_ghi'] = session;
  var sock = conn2;
  hub.removeSocketFromSession(sock);
  assertStr('XibbitHub.removeSocketFromSession #8', false,
    "unimplemented",
    "unimplemented"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #9
	//

try {
  hub = new XibbitHub({});
  var conn1 = new FakeSocket('sid_abc');
  var conn2 = new FakeSocket('sid_def');
  var session = {
    "session_data": {
      "instance_id": "instance_abc",
      "value": "thequickbrownfox"
    },
    "_conn": {
      "sockets": [conn1]
    }
  };
  hub.sessions.push(session);
  session = {
    "session_data": {
      "instance_id": "instance_def",
      "a": "b"
    },
    "_conn": {
      "sockets": [conn2]
    }
  };
  hub.sessions.push(session);
  var sock = conn2;
  hub.combineSessions('instance_abc', sock);
  assertStr('XibbitHub.combineSessions #9', false,
    ''+hub.sessions[0]["_conn"]["sockets"].length,
    "2"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #10
	//

try {
  hub = new XibbitHub({});
  var session = {"value1": "fred", "value2": 4};
  var retValMap = hub.cloneSession(session);
  assertStr("XibbitHub.cloneSession #10", false,
    JSON.stringify(retValMap),
    "{\"value1\":\"fred\",\"value2\":4}"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #11
	//

try {
  hub = new XibbitHub({});
  var o = {"a": 4, "b": 5, "c": 6};
  var j = JSON.stringify(o);
  var retValStr = hub.reorderJson(j, ["c"], ["b"]);
  assertStr("XibbitHub.reorderJson #11", false,
    retValStr,
    "{\"c\":6,\"a\":4,\"b\":5}"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #12
	//

try {
  hub = new XibbitHub({});
  var o = {"a": 4, "b": 5, "c": 6};
  var retVal = hub.reorderMap(o, ["c"], ["b"]);
  assertStr("XibbitHub.reorderMap #12", false,
    JSON.stringify(retVal),
    "{\"c\":6,\"a\":4,\"b\":5}"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #13
	//

try {
  var hub = new XibbitHub({});
  hub.start("best");
  assertStr('XibbitHub.start #13', false,
    "worked",
    "worked"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #14
	//

try {
  hub = new XibbitHub({});
  var handler = function() {
    console.log('handler');
  };
  retVal = hub.readAndWriteUploadEvent('api', 'an_event', handler);
  assertStr("XibbitHub.readAndWriteUploadEvent #14", false,
    "unimplemented",
    "unimplemented"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #15
	//

try {
  hub = new XibbitHub({});
  var onHandler = function(event, vars) {
    return event;
  };
  hub.on("on", "an_event", onHandler);
  assertBool("XibbitHub.on #15", false,
    hub.handler_groups["on"]["an_event"] === onHandler
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #16
	//

try {
  hub = new XibbitHub({});
  var apiHandler = function(event, vars) {
    return event;
  };
  hub.on("api", "an_event", apiHandler);
  assertBool("XibbitHub.api #16", false,
    hub.handler_groups["api"]["an_event"] === apiHandler
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #17
	//

try {
  hub = new XibbitHub({});
  var invoked = false;
  hub.handler_groups["api"]["an_event"] = function(event, vars, callback) {
    invoked = true;
    callback(null, event);
  };
  hub.trigger({"type": "an_event"}, function() {})
  assertBool("XibbitHub.trigger #17", false,
    invoked
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #18
	//

try {
  hub = new XibbitHub({});
  var fake_data = '';
  function FakeSocket16() { }
  FakeSocket16.prototype.emit = function(room, event) {
    fake_data += JSON.stringify(event);
  };
  hub.sessions.push({'session_data': {'instance_id': 'bill'}, '_conn': {'sockets': [new FakeSocket16()]}});
  hub.send({'type': 'an_event'}, 'bill', true);
  assertBool('XibbitHub.send #18', false,
    invoked
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #19
	//

try {
  hub = new XibbitHub({});
  var events = [{"type": "an_event"}];
  var retValArrMap = await hub.receive(events, {}, true);
  assertStr("XibbitHub.receive #19", false,
    JSON.stringify(retValArrMap),
    "[{\"type\":\"an_event\"}]"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #20
	//

try {
  hub = new XibbitHub({});
  var event = {"type": "an_event", "_session": {}, "_conn": {"sockets": []}};
  var retValMap = hub.connect(event, "bill", true);
  assertStr("XibbitHub.connect #20", false,
    JSON.stringify(retValMap._session),
    "{\"_username\":\"bill\"}"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #21
	//

try {
  // create and configure the XibbitHub object
  var hub = new XibbitHub({});
  hub.touch({});
  assertStr("XibbitHub.touch #21", false,
    "unimplemented",
    "unimplemented"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #22
	//

try {
  var hub = new XibbitHub({
    'mysql': {
      'link': link,
      'SQL_PREFIX': sql_prefix
    },
    'time_zone': 'America/Los_Angeles'
  });
  var invoked = false;
  var clockHandler = function(event, vars, callback) {
    invoked = true;
    callback(null, {'globalVars': {}});
  };
  hub.handler_groups['api']['__clock'] = clockHandler;
  await hub.checkClock();
  assertBool('XibbitHub.checkClock #22', false,
    invoked
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #23
	//

try {
  // create and configure the XibbitHub object
  var hub = new XibbitHub({
    'mysql': {
      'link': link,
      'SQL_PREFIX': sql_prefix
    },
    'time_zone': 'America/Los_Angeles'
  });
  hub.updateExpired("sockets", 5, "");
  assertStr("XibbitHub.updateExpired #23", false,
    "unimplemented",
    "unimplemented"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #24
	//

try {
  var hub = new XibbitHub({
    'mysql': {
      'link': link,
      'SQL_PREFIX': sql_prefix
    },
    'time_zone': 'America/Los_Angeles'
  });
  hub.deleteExpired("sockets", 5, "");
  assertStr("XibbitHub.deleteExpired #24", false,
    "unimplemented",
    "unimplemented"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #25
	//

try {
  var hub = new XibbitHub({
    'mysql': {
      'link': link,
      'SQL_PREFIX': sql_prefix
    },
    'time_zone': 'America/Los_Angeles'
  });
  hub.deleteOrphans("sockets_events", "sid", "sockets", "sid");
  assertStr("XibbitHub.deleteOrphans #25", false,
    "unimplemented",
    "unimplemented"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #26
	//

try {
  hub = new XibbitHub({});
  var retValInt = hub.cmp({'___id': 4}, {'___id': 8});
  assertStr('XibbitHub.cmp #26', false,
    '' + retValInt,
    "-1"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #27
	//

try {
  hub = new XibbitHub({});
  var event = {"type": "a_event", "a": "b", "c": "d", "e": "f"};
  var retValMap = hub.cloneEvent(event, ["a", "e"]);
  assertStr('XibbitHub.cloneEvent #27', false,
    JSON.stringify(retValMap),
    "{\"type\":\"a_event\",\"c\":\"d\"}"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #28
	//

try {
  hub = new XibbitHub({});
  var event = {"type": "a_event", "a": "b", "c": "d", "e": "f"};
  var retValMap = hub.updateEvent(event, {"c": "z", "r": 4}, ["r", "type"]);
  assertStr('XibbitHub.updateEvent #28', false,
    JSON.stringify(retValMap),
    "{\"type\":\"a_event\",\"a\":\"b\",\"c\":\"z\",\"e\":\"f\"}"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #29
	//

try {
  hub = new XibbitHub({});
  retValInt = hub.rand_secure(0, 4);
  assertBool("XibbitHub.rand_secure #29", false,
    (retValInt >= 0) && (retValInt <= 4)
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #30
	//

try {
  var hub = new XibbitHub({
    'mysql': {
      'link': link,
      'SQL_PREFIX': sql_prefix
    },
    'time_zone': 'America/Los_Angeles'
  });
  retValBool = await hub.lockGlobalVars();
  assertBool('XibbitHub.lockGlobalVars #30', false,
    retValBool
  );
  await hub.unlockGlobalVars();
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #31
	//

try {
  var hub = new XibbitHub({
    'mysql': {
      'link': link,
      'SQL_PREFIX': sql_prefix
    },
    'time_zone': 'America/Los_Angeles'
  });
  retValBool = await hub.lockGlobalVarsUsingSql();
  assertBool('XibbitHub.lockGlobalVarsUsingSql #31', false,
    retValBool
  );
  await hub.unlockGlobalVars();
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #32
	//

try {
  var hub = new XibbitHub({
    'mysql': {
      'link': link,
      'SQL_PREFIX': sql_prefix
    },
    'time_zone': 'America/Los_Angeles'
  });
  await hub.lockGlobalVars();
  var retValBool = await hub.unlockGlobalVars();
  assertBool('XibbitHub.unlockGlobalVars #32', false,
    retValBool
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #33
	//

try {
  var hub = new XibbitHub({
    'mysql': {
      'link': link,
      'SQL_PREFIX': sql_prefix
    },
    'time_zone': 'America/Los_Angeles'
  });
  await hub.lockGlobalVarsUsingSql();
  var retValBool = await hub.unlockGlobalVarsUsingSql();
  assertBool('XibbitHub.unlockGlobalVarsUsingSql #33', false,
    retValBool
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #34
	//

try {
  var hub = new XibbitHub({
    'mysql': {
      'link': link,
      'SQL_PREFIX': sql_prefix
    },
    'time_zone': 'America/Los_Angeles'
  });
  await hub.writeGlobalVars({"kind": "mammal"});
  var retValMap = await hub.readGlobalVars();
  assertStr('XibbitHub.readGlobalVars #34', false,
    JSON.stringify(retValMap),
    "{\"kind\":\"mammal\"}"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #35
	//

try {
  var hub = new XibbitHub({
    'mysql': {
      'link': link,
      'SQL_PREFIX': sql_prefix
    },
    'time_zone': 'America/Los_Angeles'
  });
  await hub.writeGlobalVars({"kind": "reptile"});
  var retValMap = await hub.readGlobalVarsUsingSql();
  assertStr('XibbitHub.readGlobalVarsUsingSql #35', false,
    JSON.stringify(retValMap),
    "{\"kind\":\"reptile\"}"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #36
	//

try {
  var hub = new XibbitHub({
    'mysql': {
      'link': link,
      'SQL_PREFIX': sql_prefix
    },
    'time_zone': 'America/Los_Angeles'
  });
  await hub.writeGlobalVars({"kind": "mammal"});
  var retValMap = await hub.readGlobalVars();
  assertStr('XibbitHub.writeGlobalVars #36', false,
    JSON.stringify(retValMap),
    "{\"kind\":\"mammal\"}"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #37
	//

try {
  var hub = new XibbitHub({
    'mysql': {
      'link': link,
      'SQL_PREFIX': sql_prefix
    },
    'time_zone': 'America/Los_Angeles'
  });
  hub.writeGlobalVarsUsingSql({"kind": "mammal"});
  var retValMap = await hub.readGlobalVarsUsingSql();
  assertStr('XibbitHub.writeGlobalVarsUsingSql #37', false,
    JSON.stringify(retValMap),
    "{\"kind\":\"mammal\"}"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #38
	//

try {
  var hub = new XibbitHub({
    'mysql': {
      'link': link,
      'SQL_PREFIX': sql_prefix
    }
  });
  var qr = await hub.mysql_query("SELECT `socksessid` FROM "+sql_prefix+"sockets_sessions;");
  var retValMap = hub.mysql_fetch_assoc(qr);
  hub.mysql_free_query(qr);
  assertStr('XibbitHub.mysql_query #38', false,
    JSON.stringify(retValMap),
    "{\"socksessid\":\"global\"}"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #39
	//

try {
  hub = new XibbitHub({});
  var retValStr = hub.mysql_real_escape_string("\"Chicago Pizz'a\" is good");
  assertStr('XibbitHub.mysql_real_escape_string #39', false,
    retValStr,
    "\\\"Chicago Pizz\\'a\\\" is good"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #40
	//

try {
  var hub = new XibbitHub({
    'mysql': {
      'link': link,
      'SQL_PREFIX': sql_prefix
    }
  });
  var e = null;
  try {
    await hub.mysql_query("SELECT x FROM "+sql_prefix+"sockets");
  } catch (ee) {
    e = ee;
  }
  var retValInt = hub.mysql_errno(e);
  assertStr('XibbitHub.mysql_errno #40', false,
    '' + retValInt,
    "1054"
  );
} catch (e) {
  console.trace(e)
}
hub.stopHub();
hub = null;

	//
	// #41
	//

try {
  var hub = new XibbitHub({
    'mysql': {
      'link': link,
      'SQL_PREFIX': sql_prefix
    }
  });
  var e = null;
  try {
    await hub.mysql_query("SELECT x FROM "+sql_prefix+"sockets");
  } catch (ee) {
    e = ee;
  }
  var retValStr = hub.mysql_errstr(e);
  assertStr('XibbitHub.mysql_errstr #41', false,
    retValStr,
    "Error: ER_BAD_FIELD_ERROR: Unknown column 'x' in 'field list'"
  );
} catch (e) {
  console.trace(e)
}
hub = null;

await link.end();
}

runTests();

});
});
});
