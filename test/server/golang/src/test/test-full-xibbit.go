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
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"sort"
	"strconv"
	"strings"
	"time"

	"database/sql"
	_ "github.com/go-sql-driver/mysql"
	socketio "github.com/googollee/go-socket.io"

	"github.com/xibbit/xibbit/server/golang/src/xibbit"
)

var sql_prefix = "test_"

func sortJsonNativeXibbit(o interface{}) (s string) {
	_, ok32 := o.(float32)
	_, ok64 := o.(float64)
	if oArr, ok := o.([]map[string]interface{}); ok {
		s += "["
		for _, value := range oArr {
			if s != "[" {
				s += ","
			}
			s += sortJsonNativeXibbit(value)
		}
		s += "]"
	} else if oArr, ok := o.([]interface{}); ok {
		s += "["
		for _, value := range oArr {
			if s != "[" {
				s += ","
			}
			s += sortJsonNativeXibbit(value)
		}
		s += "]"
	} else if oMap, ok := o.(map[string]interface{}); ok {
		keys := make([]string, len(oMap))
		i := 0
		for k, _ := range oMap {
			keys[i] = k
			i++
		}
		sort.Strings(keys)
		s += "{"
		for _, key := range keys {
			value := oMap[key]
			if s != "{" {
				s += ","
			}
			s += sortJsonNativeXibbit(key) + ":" + sortJsonNativeXibbit(value)
		}
		s += "}"
	} else if oBool, ok := o.(bool); ok {
		s = "false"
		if oBool {
			s = "true"
		}
	} else if oInt, ok := o.(int); ok {
		s = strconv.Itoa(oInt)
	} else if ok32 || ok64 {
		s = fmt.Sprintf("%v", o)
		if !strings.Contains(s, ".") {
			s += ".0"
		}
	} else if oTime, ok := o.(time.Time); ok {
		s = "\"" + strings.ReplaceAll(oTime.Format("2006-01-02 15:04:05"), "\"", "\\\"") + "\""
	} else if oStr, ok := o.(string); ok {
		s = "\"" + strings.ReplaceAll(oStr, "\"", "\\\"") + "\""
	}
	return s
}
func assertBool(name string, output bool, actual bool) {
	color := "green"
	result := "passed"
	out := ""
	if output {
		quoted := ""
		quoted = strings.ReplaceAll(quoted, "\\", "\\\\")
		quoted = strings.ReplaceAll(quoted, "\"", "\\\"")
		quoted = "\"" + quoted + "\","
		out += quoted + "\n"
	}
	if !actual {
		color = "red"
		result = "failed to match actual to expected"
	}
	pre := "\x1b[32m"
	if color != "green" {
		pre = "\x1b[31m"
	}
	log.Println(pre + name + ": " + result + "\x1b[0m")
	if (out != "") || output {
		log.Println("\n" + out)
	}
}
func assertStr(name string, output bool, actual string, expected string) {
	color := "green"
	result := "passed"
	out := ""
	if output {
		quoted := actual
		quoted = strings.ReplaceAll(quoted, "\\", "\\\\")
		quoted = strings.ReplaceAll(quoted, "\"", "\\\"")
		quoted = "\"" + quoted + "\","
		out += quoted
	}
	if actual != expected {
		color = "red"
		result = "failed"
	}
	pre := "\x1b[32m"
	if color != "green" {
		pre = "\x1b[31m"
	}
	log.Println(pre + name + ": " + result + "\x1b[0m")
	if out != "" {
		log.Println(out)
	}
}

func TestFullXibbit() {
	// connect to the MySQL database
	const host string = "127.0.0.1"
	const spec string = "root:mysql@tcp(" + host + ":3306)/publicfigure"
	link, e := sql.Open("mysql", spec)
	if e != nil {
		log.Fatal(e)
	}
	var log xibbit.ILog = xibbit.NewLogMeImpl()
	// create and configure the XibbitHub object
	var installer = xibbit.NewXibbitHub(map[string]interface{}{
		"mysql": map[string]interface{}{
			"link":       link,
			"SQL_PREFIX": sql_prefix,
		},
	})

	installer.DropDatabaseTables(log, true)

	installer.CreateDatabaseTables(log, "`json` text")

	installer.StopHub()

	session := map[string]interface{}{}
	event := map[string]interface{}{}
	retValBool := false
	retValInt := 0
	retValMap := map[string]interface{}{}
	retValArrMap := []map[string]interface{}{}

	//
	// #1
	//

	hub := xibbit.NewXibbitHub(map[string]interface{}{})
	conn1 := xibbit.NewFakeSocket("sid_abc")
	conn2 := xibbit.NewFakeSocket("sid_def")
	conn3 := xibbit.NewFakeSocket("sid_ghi")
	hub.Sessions = append(hub.Sessions, map[string]interface{}{
		"session_data": map[string]interface{}{
			"instance_id": "instance_abc",
			"value":       "quickbrownfox",
		},
		"_conn": map[string]interface{}{
			"sockets": []*xibbit.SocketWrapper{
				conn1,
			},
		},
	})
	hub.Sessions = append(hub.Sessions, map[string]interface{}{
		"session_data": map[string]interface{}{
			"instance_id": "instance_def",
			"value":       "jumpedover",
		},
		"_conn": map[string]interface{}{
			"sockets": []*xibbit.SocketWrapper{
				conn2,
			},
		},
	})
	hub.Sessions = append(hub.Sessions, map[string]interface{}{
		"session_data": map[string]interface{}{
			"instance_id": "instance_ghi",
			"value":       "lazydog",
		},
		"_conn": map[string]interface{}{
			"sockets": []*xibbit.SocketWrapper{
				conn3,
			},
		},
	})
	retValMap = hub.GetSession("sid_def")
	b, _ := json.Marshal(retValMap["session_data"])
	assertStr("XibbitHub.GetSession #1", false,
		string(b),
		"{\"instance_id\":\"instance_def\",\"value\":\"jumpedover\"}",
	)
	hub.StopHub()
	hub = nil

	//
	// #2
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	conn1 = xibbit.NewFakeSocket("sid_abc")
	conn2 = xibbit.NewFakeSocket("sid_def")
	conn3 = xibbit.NewFakeSocket("sid_ghi")
	hub.Sessions = append(hub.Sessions, map[string]interface{}{
		"session_data": map[string]interface{}{
			"instance_id": "instance_abc",
			"value":       "quickbrownfox",
		},
		"_conn": map[string]interface{}{
			"sockets": []*xibbit.SocketWrapper{
				conn1,
			},
		},
	})
	hub.Sessions = append(hub.Sessions, map[string]interface{}{
		"session_data": map[string]interface{}{
			"instance_id": "instance_def",
			"value":       "jumpedover",
		},
		"_conn": map[string]interface{}{
			"sockets": []*xibbit.SocketWrapper{
				conn2,
			},
		},
	})
	hub.Sessions = append(hub.Sessions, map[string]interface{}{
		"session_data": map[string]interface{}{
			"instance_id": "instance_ghi",
			"value":       "lazydog",
		},
		"_conn": map[string]interface{}{
			"sockets": []*xibbit.SocketWrapper{
				conn3,
			},
		},
	})
	retValInt = hub.GetSessionIndex(conn2.ID())
	assertStr("XibbitHub.GetSessionIndex #2", false,
		strconv.Itoa(retValInt),
		"1",
	)
	hub.StopHub()
	hub = nil

	//
	// #3
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	conn1 = xibbit.NewFakeSocket("sid_abc")
	conn2 = xibbit.NewFakeSocket("sid_def")
	conn3 = xibbit.NewFakeSocket("sid_ghi")
	hub.Sessions = append(hub.Sessions, map[string]interface{}{
		"session_data": map[string]interface{}{
			"instance_id": "instance_abc",
			"value":       "quickbrownfox",
		},
		"_conn": map[string]interface{}{
			"sockets": []*xibbit.SocketWrapper{
				conn1,
			},
		},
	})
	hub.Sessions = append(hub.Sessions, map[string]interface{}{
		"session_data": map[string]interface{}{
			"instance_id": "instance_def",
			"value":       "jumpedover",
		},
		"_conn": map[string]interface{}{
			"sockets": []*xibbit.SocketWrapper{
				conn2,
			},
		},
	})
	hub.Sessions = append(hub.Sessions, map[string]interface{}{
		"session_data": map[string]interface{}{
			"instance_id": "instance_ghi",
			"value":       "lazydog",
		},
		"_conn": map[string]interface{}{
			"sockets": []*xibbit.SocketWrapper{
				conn3,
			},
		},
	})
	retValMap = hub.GetSessionByInstance("instance_def")
	b, _ = json.Marshal(retValMap["session_data"])
	assertStr("XibbitHub.GetSessionByInstance #3", false,
		string(b),
		"{\"instance_id\":\"instance_def\",\"value\":\"jumpedover\"}",
	)
	hub.StopHub()
	hub = nil

	//
	// #4
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	session = map[string]interface{}{}
	session["session_data"] = map[string]interface{}{"_username": "john", "value": "handsome"}
	hub.Sessions = append(hub.Sessions, session)
	session = map[string]interface{}{}
	session["session_data"] = map[string]interface{}{"_username": "bill", "value": "smart"}
	hub.Sessions = append(hub.Sessions, session)
	session = map[string]interface{}{}
	session["session_data"] = map[string]interface{}{"_username": "ray", "value": "wise"}
	hub.Sessions = append(hub.Sessions, session)
	retValArrMap = hub.GetSessionsByUsername("bill")
	b, _ = json.Marshal(retValArrMap)
	assertStr("XibbitHub.GetSessionsByUsername #4", false,
		string(b),
		"[{\"session_data\":{\"_username\":\"bill\",\"value\":\"smart\"}}]",
	)
	hub.StopHub()
	hub = nil

	//
	// #5
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	session = map[string]interface{}{}
	session["username"] = "john"
	session["session"] = map[string]interface{}{"value": "handsome"}
	hub.Sessions = append(hub.Sessions, session)
	session = map[string]interface{}{}
	session["username"] = "bill"
	session["session"] = map[string]interface{}{"value": "smart"}
	hub.Sessions = append(hub.Sessions, session)
	session = map[string]interface{}{}
	session["username"] = "ray"
	session["session"] = map[string]interface{}{"value": "wise"}
	hub.Sessions = append(hub.Sessions, session)
	retValArrMap = hub.GetSessionsByUsername("all")
	b, _ = json.Marshal(retValArrMap)
	assertStr("XibbitHub.GetSessionsByUsername #5", false,
		string(b),
		"[{\"session\":{\"value\":\"handsome\"},\"username\":\"john\"},{\"session\":{\"value\":\"smart\"},\"username\":\"bill\"},{\"session\":{\"value\":\"wise\"},\"username\":\"ray\"}]",
	)
	hub.StopHub()
	hub = nil

	//
	// #6
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	conn1 = xibbit.NewFakeSocket("sid_abc")
	conn2 = xibbit.NewFakeSocket("sid_def")
	hub.Sessions = append(hub.Sessions, map[string]interface{}{
		"session_data": map[string]interface{}{
			"instance_id": "instance_abc",
			"a":           "bc",
		},
		"_conn": map[string]interface{}{
			"sockets": []*xibbit.SocketWrapper{
				conn1,
			},
		},
	})
	sock := conn2
	hub.AddSession(sock)
	assertStr("XibbitHub.AddSession #6", false,
		strconv.Itoa(len(hub.Sessions)),
		"2",
	)
	hub.StopHub()
	hub = nil

	//
	// #7
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	conn1 = xibbit.NewFakeSocket("sid_abc")
	conn2 = xibbit.NewFakeSocket("sid_def")
	conn3 = xibbit.NewFakeSocket("sid_ghi")
	hub.Sessions = append(hub.Sessions, map[string]interface{}{
		"session_data": map[string]interface{}{
			"instance_id": "instance_abc",
			"value":       "quickbrownfox",
		},
		"_conn": map[string]interface{}{
			"sockets": []*xibbit.SocketWrapper{
				conn1,
			},
		},
	})
	hub.Sessions = append(hub.Sessions, map[string]interface{}{
		"session_data": map[string]interface{}{
			"instance_id": "instance_def",
			"value":       "jumpedover",
		},
		"_conn": map[string]interface{}{
			"sockets": []*xibbit.SocketWrapper{
				conn2,
			},
		},
	})
	hub.Sessions = append(hub.Sessions, map[string]interface{}{
		"session_data": map[string]interface{}{
			"instance_id": "instance_ghi",
			"value":       "lazydog",
		},
		"_conn": map[string]interface{}{
			"sockets": []*xibbit.SocketWrapper{
				conn3,
			},
		},
	})
	sock = conn2
	hub.RemoveSocketFromSession(sock)
	assertStr("XibbitHub.RemoveSocketFromSession #7", false,
		strconv.Itoa(len(hub.Sessions[1]["_conn"].(map[string]interface{})["sockets"].([]*xibbit.SocketWrapper))),
		"0",
	)
	hub.StopHub()
	hub = nil

	//
	// #8
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	conn1 = xibbit.NewFakeSocket("sid_abc")
	conn2 = xibbit.NewFakeSocket("sid_def")
	conn3 = xibbit.NewFakeSocket("sid_ghi")
	session = map[string]interface{}{
		"session_data": map[string]interface{}{
			"instance_id": "instance_abc",
			"value":       "quickbrownfox",
		},
		"_conn": map[string]interface{}{
			"sockets": []*xibbit.SocketWrapper{
				conn1,
			},
		},
	}
	hub.Sessions = append(hub.Sessions, session)
	session = map[string]interface{}{
		"session_data": map[string]interface{}{
			"instance_id": "instance_def",
			"value":       "jumpedover",
		},
		"_conn": map[string]interface{}{
			"sockets": []*xibbit.SocketWrapper{
				conn2,
			},
		},
	}
	hub.Sessions = append(hub.Sessions, session)
	session = map[string]interface{}{
		"session_data": map[string]interface{}{
			"instance_id": "instance_ghi",
			"value":       "lazydog",
		},
		"_conn": map[string]interface{}{
			"sockets": []*xibbit.SocketWrapper{
				conn3,
			},
		},
	}
	hub.Sessions = append(hub.Sessions, session)
	sock = conn2
	hub.CombineSessions("instance_ghi", sock)
	assertStr("XibbitHub.CombineSessions #8", false,
		hub.Sessions[1]["session_data"].(map[string]interface{})["value"].(string),
		"lazydog",
	)
	hub.StopHub()
	hub = nil

	//
	// #9
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	session = map[string]interface{}{"value1": "fred", "value2": 4}
	retValMap = hub.CloneSession(session)
	b, _ = json.Marshal(retValMap)
	assertStr("XibbitHub.CloneSession #9", false,
		string(b),
		"{\"value1\":\"fred\",\"value2\":4}",
	)
	hub.StopHub()
	hub = nil

	//
	// #10
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	o := map[string]interface{}{"a": 4, "b": 5, "c": 6}
	b, _ = json.Marshal(o)
	retValStr := hub.ReorderJson(string(b), []string{"c"}, []string{"b"})
	assertStr("XibbitHub.ReorderJson #10", false,
		retValStr,
		"{\"c\":6,\"a\":4,\"b\":5}",
	)
	hub.StopHub()
	hub = nil

	//
	// #11
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	o = map[string]interface{}{"a": 4, "b": 5, "c": 6}
	retValMap = hub.ReorderMap(o, []string{"c"}, []string{"b"})
	b, _ = json.Marshal(retValMap)
	assertStr("XibbitHub.ReorderMap #11", false,
		string(b),
		"{\"a\":4,\"b\":5,\"c\":6}",
	)
	hub.StopHub()
	hub = nil

	//
	// #12
	//

	socketioServer := socketio.NewServer(nil)
	hub = xibbit.NewXibbitHub(map[string]interface{}{
		"socketio": socketioServer,
	})
	hub.Start("best")
	assertStr("XibbitHub.Start #12", false,
		"alwaysfails",
		"alwayspasses",
	)
	hub.StopHub()
	hub = nil

	//
	// #13
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	events := []map[string]interface{}{{"a": "b"}}
	retValArrMap = hub.ReadAndWriteUploadEvent(events)
	b, _ = json.Marshal(retValArrMap)
	assertStr("XibbitHub.ReadAndWriteUploadEvent #13", false,
		string(b),
		"[{\"a\":\"b\"}]fails",
	)
	hub.StopHub()
	hub = nil

	//
	// #14
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	onHandler := func(event map[string]interface{}, vars map[string]interface{}) map[string]interface{} {
		return event
	}
	hub.On("on", "an_event", onHandler)
	assertBool("XibbitHub.On #14", false,
		hub.Handler_groups["on"]["an_event"] != nil,
	)
	hub.StopHub()
	hub = nil

	//
	// #15
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	apiHandler := func(event map[string]interface{}, vars map[string]interface{}) map[string]interface{} {
		return event
	}
	hub.On("api", "an_event", apiHandler)
	assertBool("XibbitHub.Api #15", false,
		hub.Handler_groups["api"]["an_event"] != nil,
	)
	hub.StopHub()
	hub = nil

	//
	// #16
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	invoked := false
	hub.Handler_groups["api"]["an_event"] = func(event map[string]interface{}, vars map[string]interface{}) map[string]interface{} {
		invoked = true
		return event
	}
	hub.Trigger(map[string]interface{}{"type": "an_event"})
	assertBool("XibbitHub.Trigger #16", false,
		invoked,
	)
	hub.StopHub()
	hub = nil

	//
	// #17
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	conn1 = xibbit.NewFakeSocket("sid_abc")
	session = map[string]interface{}{
		"session_data": map[string]interface{}{
			"_username": "bill",
		},
	}
	session["_conn"] = map[string]interface{}{"sockets": []*xibbit.SocketWrapper{conn1}}
	hub.Sessions = append(hub.Sessions, session)
	event = map[string]interface{}{"type": "an_event"}
	retValMap, e = hub.Send(event, "bill", true)
	assertStr("XibbitHub.Send #17", false,
		conn1.Fake_data,
		"{\"type\":\"an_event\"}",
	)
	hub.StopHub()
	hub = nil

	//
	// #18
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	events = []map[string]interface{}{{"type": "an_event"}}
	retValArrMap = hub.Receive(events, map[string]interface{}{}, false)
	b, _ = json.Marshal(retValArrMap)
	assertStr("XibbitHub.Receive #18", false,
		string(b),
		"[{\"type\":\"an_event\"}]",
	)
	hub.StopHub()
	hub = nil

	//
	// #19
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	event = map[string]interface{}{"type": "an_event", "_session": map[string]interface{}{}}
	retValMap = hub.Connect(event, "bill", true)
	b, _ = json.Marshal(retValMap)
	assertStr("XibbitHub.Connect #19", false,
		string(b),
		"{\"_session\":{\"_username\":\"bill\"},\"type\":\"an_event\"}",
	)
	hub.StopHub()
	hub = nil

	//
	// #20
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	hub.Touch(map[string]interface{}{})
	assertStr("XibbitHub.Touch #20", false,
		"alwaysfails",
		"alwayspasses",
	)
	hub.StopHub()
	hub = nil

	//
	// #21
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{
		"mysql": map[string]interface{}{
			"link":       link,
			"SQL_PREFIX": sql_prefix,
		},
	})
	invoked = false
	clockHandler := func(event map[string]interface{}, vars map[string]interface{}) map[string]interface{} {
		invoked = true
		return map[string]interface{}{"globalVars": map[string]interface{}{}}
	}
	hub.Handler_groups["api"]["__clock"] = clockHandler
	hub.CheckClock()
	assertBool("XibbitHub.CheckClock #21", false,
		invoked,
	)
	hub.StopHub()
	hub = nil

	//
	// #22
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{
		"mysql": map[string]interface{}{
			"link":       link,
			"SQL_PREFIX": sql_prefix,
		},
	})
	hub.Mysql_query("INSERT INTO `" + sql_prefix + "sockets` VALUES (1, 1, '1999-01-01 00:14:33', '1999-01-01 00:14:33', '{}');")
	hub.UpdateExpired("sockets", 5, "")
	rows, e, _ := hub.Mysql_query("SELECT * FROM `" + sql_prefix + "sockets`;")
	value1 := 0
	value2 := 0
	value3 := []byte{}
	value4 := []byte{}
	value5 := []byte{}
	rows.Next()
	rows.Scan(&value1, &value2, &value3, &value4, &value5)
	assertStr("XibbitHub.UpdateExpired #22", false,
		string(value3),
		"1970-01-01 00:00:00",
	)
	hub.StopHub()
	hub = nil

	//
	// #23
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{
		"mysql": map[string]interface{}{
			"link":       link,
			"SQL_PREFIX": sql_prefix,
		},
	})
	hub.Mysql_query("DELETE FROM `" + sql_prefix + "sockets`;")
	hub.Mysql_query("INSERT INTO `" + sql_prefix + "sockets` VALUES (1, 1, '1999-01-01 00:14:33', '1999-01-01 00:14:33', '{}');")
	hub.DeleteExpired("sockets", 5, "")
	rows, e, _ = hub.Mysql_query("SELECT * FROM `" + sql_prefix + "sockets`;")
	retValBool = rows.Next()
	assertStr("XibbitHub.DeleteExpired #23", false,
		strconv.FormatBool(retValBool),
		"false",
	)
	hub.StopHub()
	hub = nil

	//
	// #24
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{
		"mysql": map[string]interface{}{
			"link":       link,
			"SQL_PREFIX": sql_prefix,
		},
	})
	hub.Mysql_query("DELETE FROM `" + sql_prefix + "sockets`;")
	hub.Mysql_query("DELETE FROM `" + sql_prefix + "sockets_events`;")
	hub.Mysql_query("INSERT INTO `" + sql_prefix + "sockets` VALUES (1, 1, '1999-01-01 00:14:33', '1999-01-01 00:14:33', '{}');")
	hub.Mysql_query("INSERT INTO `" + sql_prefix + "sockets` VALUES (2, 2, '1999-01-01 00:14:33', '1999-01-01 00:14:33', '{}');")
	hub.Mysql_query("INSERT INTO `" + sql_prefix + "sockets_events` VALUES (3, 3, 'event', '1999-01-01 00:14:33');")
	hub.Mysql_query("INSERT INTO `" + sql_prefix + "sockets_events` VALUES (4, 4, 'event', '1999-01-01 00:14:33');")
	hub.DeleteOrphans("sockets_events", "sid", "sockets", "sid")
	rows, e, _ = hub.Mysql_query("SELECT * FROM `" + sql_prefix + "sockets_events`;")
	retValBool = rows.Next()
	assertStr("XibbitHub.DeleteOrphans #24", false,
		strconv.FormatBool(retValBool),
		"false",
	)
	hub.StopHub()
	hub = nil

	//
	// #25
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	retValInt = hub.Cmp(map[string]interface{}{"___id": 4}, map[string]interface{}{"___id": 8})
	assertStr("XibbitHub.Cmp #25", false,
		strconv.Itoa(retValInt),
		"-1",
	)
	hub.StopHub()
	hub = nil

	//
	// #26
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	event = map[string]interface{}{"type": "a_event", "a": "b", "c": "d", "e": "f"}
	retValMap = hub.CloneEvent(event, []string{"a", "e"})
	b, _ = json.Marshal(retValMap)
	assertStr("XibbitHub.CloneEvent #26", false,
		string(b),
		"{\"c\":\"d\",\"type\":\"a_event\"}",
	)
	hub.StopHub()
	hub = nil

	//
	// #27
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	event = map[string]interface{}{"type": "a_event", "a": "b", "c": "d", "e": "f"}
	retValMap = hub.UpdateEvent(event, map[string]interface{}{"c": "z", "r": 4}, []string{"r", "type"})
	b, _ = json.Marshal(retValMap)
	assertStr("XibbitHub.UpdateEvent #27", false,
		string(b),
		"{\"a\":\"b\",\"c\":\"z\",\"e\":\"f\",\"type\":\"a_event\"}",
	)
	hub.StopHub()
	hub = nil

	//
	// #28
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	retValInt = hub.RandSecure(0, 4)
	assertBool("XibbitHub.RandSecure #28", false,
		(retValInt >= 0) && (retValInt <= 4),
	)
	hub.StopHub()
	hub = nil

	//
	// #29
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	retValBool = hub.LockGlobalVars()
	hub.UnlockGlobalVars()
	assertBool("XibbitHub.LockGlobalVars #29", false,
		retValBool,
	)
	hub.StopHub()
	hub = nil

	//
	// #30
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{
		"mysql": map[string]interface{}{
			"link":       link,
			"SQL_PREFIX": sql_prefix,
		},
	})
	retValBool = hub.LockGlobalVarsUsingSql()
	hub.UnlockGlobalVarsUsingSql()
	assertBool("XibbitHub.LockGlobalVarsUsingSql #30", false,
		retValBool,
	)
	hub.StopHub()
	hub = nil

	//
	// #31
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	hub.LockGlobalVars()
	e = hub.UnlockGlobalVars()
	assertBool("XibbitHub.UnlockGlobalVars #31", false,
		e == nil,
	)
	hub.StopHub()
	hub = nil

	//
	// #32
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{
		"mysql": map[string]interface{}{
			"link":       link,
			"SQL_PREFIX": sql_prefix,
		},
	})
	hub.LockGlobalVarsUsingSql()
	e = hub.UnlockGlobalVarsUsingSql()
	assertBool("XibbitHub.UnlockGlobalVarsUsingSql #32", false,
		e == nil,
	)
	hub.StopHub()
	hub = nil

	//
	// #33
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	hub.WriteGlobalVars(map[string]interface{}{"kind": "mammal"})
	retValMap = hub.ReadGlobalVars()
	b, _ = json.Marshal(retValMap)
	assertStr("XibbitHub.ReadGlobalVars #33", false,
		string(b),
		"{\"kind\":\"mammal\"}",
	)
	hub.StopHub()
	hub = nil

	//
	// #34
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{
		"mysql": map[string]interface{}{
			"link":       link,
			"SQL_PREFIX": sql_prefix,
		},
	})
	hub.WriteGlobalVarsUsingSql(map[string]interface{}{"kind": "mouse"})
	retValMap = hub.ReadGlobalVarsUsingSql()
	b, _ = json.Marshal(retValMap)
	assertStr("XibbitHub.ReadGlobalVarsUsingSql #34", false,
		string(b),
		"{\"kind\":\"mouse\"}",
	)
	hub.StopHub()
	hub = nil

	//
	// #35
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	globalVars := map[string]interface{}{"craft": "beer", "good": true}
	hub.WriteGlobalVars(globalVars)
	globalVars = hub.ReadGlobalVars()
	b, _ = json.Marshal(globalVars)
	assertStr("XibbitHub.WriteGlobalVars #35", false,
		string(b),
		"{\"craft\":\"beer\",\"good\":true}",
	)
	hub.StopHub()
	hub = nil

	//
	// #36
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{
		"mysql": map[string]interface{}{
			"link":       link,
			"SQL_PREFIX": sql_prefix,
		},
	})
	globalVars = map[string]interface{}{"take": 5, "make": "a profit"}
	hub.WriteGlobalVarsUsingSql(globalVars)
	globalVars = hub.ReadGlobalVarsUsingSql()
	b, _ = json.Marshal(globalVars)
	assertStr("XibbitHub.WriteGlobalVarsUsingSql #36", false,
		string(b),
		"{\"make\":\"a profit\",\"take\":5}",
	)
	hub.StopHub()
	hub = nil

	//
	// #37
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{
		"mysql": map[string]interface{}{
			"link":       link,
			"SQL_PREFIX": sql_prefix,
		},
	})
	rows, e, _ = hub.Mysql_query("SELECT `socksessid` FROM " + sql_prefix + "sockets_sessions;")
	retValMap = hub.Mysql_fetch_assoc(rows)
	b, _ = json.Marshal(retValMap)
	assertStr("XibbitHub.Mysql_query #37", false,
		string(b),
		"{\"socksessid\":\"global\"}",
	)
	hub.StopHub()
	hub = nil

	//
	// #38
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{})
	retValStr = hub.Mysql_real_escape_string("\"Chicago Pizz'a\" is good")
	assertStr("XibbitHub.Mysql_real_escape_string #38", false,
		retValStr,
		"\\\"Chicago Pizz\\'a\\\" is good",
	)
	hub.StopHub()
	hub = nil

	//
	// #39
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{
		"mysql": map[string]interface{}{
			"link":       link,
			"SQL_PREFIX": sql_prefix,
		},
	})
	_, e, _ = hub.Mysql_query("SELECT x FROM " + sql_prefix + "sockets")
	retValInt = hub.Mysql_errno(e)
	assertStr("XibbitHub.Mysql_errno #39", false,
		strconv.Itoa(retValInt),
		"1054",
	)
	hub.StopHub()
	hub = nil

	//
	// #40
	//

	hub = xibbit.NewXibbitHub(map[string]interface{}{
		"mysql": map[string]interface{}{
			"link":       link,
			"SQL_PREFIX": sql_prefix,
		},
	})
	_, e, _ = hub.Mysql_query("SELECT x FROM " + sql_prefix + "sockets")
	retValStr = hub.Mysql_errstr(e)
	assertStr("XibbitHub.Mysql_errstr #40", false,
		retValStr,
		"Error 1054 (42S22): Unknown column 'x' in 'field list'",
	)
	hub.StopHub()
	hub = nil
}
