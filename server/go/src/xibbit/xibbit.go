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
package xibbit

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	socketio "github.com/googollee/go-socket.io"
	"log"
	"math"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"
)

type ILog interface {
	Println(msg string, lvl int)
}

/**
 * A logger.
 *
 * @package xibbit
 * @author DanielWHoward
 **/
type LogMeImpl struct {
}

/**
 * Constructor.
 *
 * @author DanielWHoward
 **/
func NewLogMeImpl() *LogMeImpl {
	self := new(LogMeImpl)
	return self
}

/**
 * Write to the log.
 *
 * @author DanielWHoward
 **/
func (self *LogMeImpl) Println(msg string, lvl int) {
	log.Println(strconv.Itoa(lvl) + ":" + msg)
}

type XibbitHubOutputStream interface {
	write(sock *SocketWrapper, eventName string, data map[string]interface{})
	flush()
}

/**
 * An output stream.
 *
 * @package xibbit
 * @author DanielWHoward
 **/
type XibbitHubOutputStreamImpl struct {
}

/**
 * Constructor.
 *
 * @author DanielWHoward
 **/
func NewXibbitHubOutputStreamImpl() *XibbitHubOutputStreamImpl {
	self := new(XibbitHubOutputStreamImpl)
	return self
}

/**
 * Write data to the stream.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHubOutputStreamImpl) write(sock *SocketWrapper, eventName string, data map[string]interface{}) {
	sock.Emit(eventName, data)
}

/**
 * Flush any cached data.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHubOutputStreamImpl) flush() {
}

/**
 * Wraps socketio.Conn to support unit tests.
 *
 * @package xibbit
 * @author DanielWHoward
 **/
type SocketWrapper struct {
	conn *socketio.Conn
	use_conn bool
	fake_sid string
	Fake_data string
}
func NewSocket(conn *socketio.Conn) *SocketWrapper {
	self := new(SocketWrapper)
	self.use_conn = true
	self.conn = conn
	return self
}
func NewFakeSocket(fake_sid string) *SocketWrapper {
	self := new(SocketWrapper)
	self.use_conn = false
	self.fake_sid = fake_sid
	return self
}
func (self *SocketWrapper) ID() (sid string) {
	if self.use_conn {
		sid = (*self.conn).ID()
	} else {
		sid = self.fake_sid
	}
	return
}
func (self *SocketWrapper) Emit(eventName string, v ...interface{}) {
	if self.use_conn {
		(*self.conn).Emit(eventName, v...)
	} else {
		for _, arg := range v {
			if argMap, ok := arg.(map[string]interface{}); ok {
				b, _ := json.Marshal(argMap)
				self.Fake_data += string(b)
			} else if argStr, ok := arg.(string); ok {
				self.Fake_data += argStr
			}
		}
	}
	return
}
func (self *SocketWrapper) equals(other *SocketWrapper) (same bool) {
	same = true
	if same && (self.use_conn != other.use_conn) {
		same = false
	}
	if same && self.use_conn && (self.conn != other.conn) && ((*self.conn).ID() != (*other.conn).ID()) {
		same = false
	}
	if same && !self.use_conn && (self.fake_sid != other.fake_sid) {
		same = false
	}
	return
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
type XibbitHub struct {
	socketio *socketio.Server
	config         map[string]interface{}
	suppressCloneSession bool
	Handler_groups map[string]map[string]func(event map[string]interface{}, vars map[string]interface{}) map[string]interface{}
	prefix         string
	Sessions       []map[string]interface{}
	OutputStream   XibbitHubOutputStream
	mu             sync.Mutex
	globalVars     map[string]interface{}
}

/**
 * Constructor.
 *
 * @author DanielWHoward
 **/
func NewXibbitHub(config map[string]interface{}) *XibbitHub {
	self := new(XibbitHub)
	if _, ok := config["vars"].(map[string]interface{}); !ok {
		config["vars"] = map[string]interface{}{}
	}
	config["vars"].(map[string]interface{})["hub"] = self
	self.config = config
	self.suppressCloneSession = false
	self.prefix = ""
	self.Handler_groups = make(map[string]map[string]func(event map[string]interface{}, vars map[string]interface{}) map[string]interface{})
	self.Handler_groups["api"] = map[string]func(event map[string]interface{}, vars map[string]interface{}) map[string]interface{}{}
	self.Handler_groups["on"] = map[string]func(event map[string]interface{}, vars map[string]interface{}) map[string]interface{}{}
	self.Handler_groups["int"] = map[string]func(event map[string]interface{}, vars map[string]interface{}) map[string]interface{}{}
	if _, ok := config["socketio"].(*socketio.Server); ok {
		self.socketio = config["socketio"].(*socketio.Server)
	}
	self.Sessions = make([]map[string]interface{}, 0)
	self.OutputStream = NewXibbitHubOutputStreamImpl()
	self.globalVars = map[string]interface{}{}
	mysql, ok := self.config["mysql"].(map[string]interface{})
	if ok && self.prefix == "" {
		self.prefix, _ = mysql["SQL_PREFIX"].(string)
	}
	mysqli, ok := self.config["mysqli"].(map[string]interface{})
	if ok && self.prefix == "" {
		self.prefix, _ = mysqli["SQL_PREFIX"].(string)
	}
	return self
}

/**
 * Shut down this hub instance.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) StopHub() {
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
func (self *XibbitHub) GetSocketIO() *socketio.Server {
	return self.socketio
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
 * @param sock string A socket ID.
 * @return map The session object with session_data and _conn keys.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) GetSession(sockId string) map[string]interface{} {
	var session map[string]interface{} = nil
	i := self.GetSessionIndex(sockId)
	if i != -1 {
		session = self.CloneSession(self.Sessions[i])
	}
	return session
}

/**
 * This is an implementation helper.  It assumes that
 * the session store is an array.
 *
 * @param sock string A socket ID.
 * @returns int The index into a session array.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) GetSessionIndex(sockId string) int {
	for s, _ := range self.Sessions {
		for ss, _ := range self.Sessions[s]["_conn"].(map[string]interface{})["sockets"].([]*SocketWrapper) {
			if self.Sessions[s]["_conn"].(map[string]interface{})["sockets"].([]*SocketWrapper)[ss].ID() == sockId {
				return s
			}
		}
	}
	return -1
}

/**
 * Get the session associated with an instance.
 *
 * @param instance_id string An instance string.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) GetSessionByInstance(instance_id string) map[string]interface{} {
	if instance_id != "" {
		for _, session := range self.Sessions {
			if session["session_data"].(map[string]interface{})["instance_id"].(string) == instance_id {
				return self.CloneSession(session)
			}
		}
	}
	return nil
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
func (self *XibbitHub) GetSessionsByUsername(username string) (sessions []map[string]interface{}) {
	if username == "all" {
		sessions = self.Sessions
	} else {
		for _, session := range self.Sessions {
			if _username, _ := session["session_data"].(map[string]interface{})["_username"].(string); _username == username {
				sessions = append(sessions, session)
			}
		}
	}
	return sessions
}

/**
 * Change the session associated with a socket.
 *
 * @param sock socketio.Conn A socket.
 * @param session map The session values.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) SetSessionData(sock *SocketWrapper, sessionData map[string]interface{}) {
	i1 := self.GetSessionIndex(sock.ID())
	if i1 == -1 {
		log.Println("XibbitHub.SetSessionData() could not find the session")
		//		self.AddSession(sock, session)
	} else {
		instance1, ok1 := self.Sessions[i1]["session_data"].(map[string]interface{})["instance_id"].(string)
		instance2, ok2 := sessionData["instance_id"].(string)
		if (!ok1 && !ok2) || (ok1 && ok2 && (instance1 == instance2)) {
			clone := self.CloneSession(sessionData)
			self.Sessions[i1]["session_data"] = clone
		} else if ok1 && !ok2 {
			clone := self.CloneSession(sessionData)
			self.Sessions[i1]["session_data"] = clone
			self.Sessions[i1]["session_data"].(map[string]interface{})["instance_id"] = instance1
		} else {
			i2 := -1
			for i2i, sess := range self.Sessions {
				if instance2 == sess["session_data"].(map[string]interface{})["instance_id"] {
					i2 = i2i
				}
			}
			if i2 == -1 {
				clone := self.CloneSession(sessionData)
				self.Sessions[i1]["session_data"] = clone
			} else {
				socks := self.Sessions[i1]["_conn"].(map[string]interface{})["sockets"].([]*SocketWrapper)
				if len(socks) == 1 {
					last := len(self.Sessions) - 1
					if i1 != last {
						self.Sessions[i1], self.Sessions[last] = self.Sessions[last], self.Sessions[i1]
					}
					self.Sessions = self.Sessions[:last]
					if i2 > i1 {
						i2--
					}
				}
				clone := self.CloneSession(sessionData)
				self.Sessions[i2]["session_data"] = clone
				socks = self.Sessions[i2]["_conn"].(map[string]interface{})["sockets"].([]*SocketWrapper)
				socks = append(socks, sock)
				self.Sessions[i2]["_conn"].(map[string]interface{})["sockets"] = socks
			}
		}
	}
}

/**
 * Add a new, empty session only for this socket.
 *
 * @param sock socketio.Conn A socket.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) AddSession(sock *SocketWrapper) {
	session := map[string]interface{}{
		"session_data": map[string]interface{}{
			"instance_id": "",
		},
		"_conn": map[string]interface{}{
			"sockets": []*SocketWrapper{
				sock,
			},
		},
	}
	self.Sessions = append(self.Sessions, session)
}

/**
 * Remove the socket from the session or the whole session
 * if it is the only socket.
 *
 * @param sock socketio.Conn A socket.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) RemoveSocketFromSession(sock *SocketWrapper) {
	s := -1
	ss := -1
	found := false
	// find the session index and socket index
	for si, session := range self.Sessions {
		socks := session["_conn"].(map[string]interface{})["sockets"].([]*SocketWrapper)
		instance, _ := session["session_data"].(map[string]interface{})["instance_id"].(string)
		for ssi, skt := range socks {
			if (*sock).equals(skt) {
				s = si
				// instances and their session_data should hang
				/// around even if there are no sockets because
				//  instances can be retrieved later and assigned
				//  to a new socket (e.g. page reload)
				if (len(socks) > 1) || (instance != "") {
					ss = ssi
				}
				found = true
				break
			}
		}
		if found {
			break
		}
	}
	// remove the whole session or just the socket
	if found && (ss == -1) {
		self.Sessions = append(self.Sessions[0:s], self.Sessions[s+1:]...)
	} else if found {
		socks := self.Sessions[s]["_conn"].(map[string]interface{})["sockets"].([]*SocketWrapper)
		socks = append(socks[0:ss], socks[ss+1:]...)
		self.Sessions[s]["_conn"].(map[string]interface{})["sockets"] = socks
	} else {
		log.Println("XibbitHub.RemoveSocketFromSession() could not find the session")
	}
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
 * @param instance_id string The instance to add the socket to.
 * @param sock socketio.Conn The socket to be moved.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) CombineSessions(instance_id string, sock *SocketWrapper) {
	i := self.GetSessionIndex(sock.ID())
	self.Sessions = append(self.Sessions[0:i], self.Sessions[i+1:]...)
	for s, _ := range self.Sessions {
		if self.Sessions[s]["session_data"].(map[string]interface{})["instance_id"].(string) == instance_id {
			socks := self.Sessions[s]["_conn"].(map[string]interface{})["sockets"].([]*SocketWrapper)
			socks = append(socks, sock)
			self.Sessions[s]["_conn"].(map[string]interface{})["sockets"] = socks
			break
		}
	}
}

/**
 * Return a duplicate of the session with no shared
 * pointers except for the special _conn key, if it
 * exists.  This method works for the entire session
 * or just the session_data in a session.
 *
 * A clone prevents a common coding error where the
 * code relies on shared pointers rather than using
 * the SetSessionData() method.
 *
 * The usual implementation is to convert to JSON and
 * then back again.  For some types, a workaround must
 * be implemented.
 *
 * @param session map The session or session_data.
 * @return map The clone.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) CloneSession(session map[string]interface{}) map[string]interface{} {
	if self.suppressCloneSession {
		return session
	}
	var conn interface{} = nil
	if connValue, ok := session["_conn"]; ok {
		conn = connValue
		delete(session, "_conn")
	}
	b, _ := json.Marshal(session)
	s := string(b)
	clone := make(map[string]interface{})
	e := json.Unmarshal([]byte(s), &clone)
	if e != nil {
		log.Println(e)
	}
	// recursively convert all float64 values into int values
	var convertFloat64ToInt func(p map[string]interface{}) map[string]interface{}
	convertFloat64ToInt = func(p map[string]interface{}) map[string]interface{} {
		for k, v := range p {
			if _, ok := v.(float64); ok {
				s := fmt.Sprintf("%.0f", v)
				if i, e := strconv.Atoi(s); e == nil {
					p[k] = i
				}
			} else if c, ok := v.(map[string]interface{}); ok {
				p[k] = convertFloat64ToInt(c)
			}
		}
		return p
	}
	clone = convertFloat64ToInt(clone)
	if conn != nil {
		session["_conn"] = conn
		clone["_conn"] = conn
	}
	return clone
}

/**
 * Return a JSON string with keys in a specific order.
 *
 * @param s string A JSON string with keys in random order.
 * @param first array An array of key names to put in order at the start.
 * @param last array An array of key names to put in order at the end.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) ReorderJson(s string, first []string, last []string) string {
	// create JSON maps
	i := 0
	targets := make([]map[string]interface{}, len(first)+len(last)+1)
	json.Unmarshal([]byte(s), &targets[len(first)])
	// save the first key-value pairs
	for _, f := range first {
		v, ok := targets[len(first)][f]
		if ok {
			targets[i] = make(map[string]interface{})
			targets[i][f] = v
			delete(targets[len(first)], f)
		}
		i++
	}
	if len(last) > 0 {
		i++
	}
	// save the last key-value pairs
	for _, l := range last {
		v, ok := targets[len(first)][l]
		if ok {
			targets[i] = make(map[string]interface{})
			targets[i][l] = v
			delete(targets[len(first)], l)
		}
		i++
	}
	// generate the JSON string
	s = ""
	for _, o := range targets {
		if (o != nil) && (len(o) > 0) {
			b, _ := json.Marshal(o)
			j := string(b)
			if s == "" {
				s = j
			} else {
				s = s[:len(s)-1] + "," + j[1:]
			}
		}
	}
	return s
}

/**
 * Some associative arrays have their keys stored in a
 * specific order.
 *
 * Golang does not do this so this method is pointless.
 *
 * Return a hashtable with keys in a specific order.
 *
 * @param source map A JSON string with keys in random order.
 * @param first slice An array of key names to put in order at the start.
 * @param last slice An array of key names to put in order at the end.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) ReorderMap(source map[string]interface{}, first []string, last []string) map[string]interface{} {
	// create JSON maps
	target := map[string]interface{}{};
	// save the first key-value pairs
	for _, f := range first {
		key := f
		if _, ok := source[key]; ok {
			target[key] = source[key]
		}
	}
	// save the non-first and non-last key-value pairs
	for key, value := range source {
		fok := false
		for _, fval := range first {
			if fval == key {
				fok = true
			}
		}
		lok := false
		for _, lval := range last {
			if lval == key {
				lok = true
			}
		}
		if !fok && !lok {
			target[key] = value
		}
	}
	// save the last key-value pairs
	for _, l := range last {
		key := l
		if _, ok := source[key]; ok {
			target[key] = source[key]
		}
	}
	return target;
}

/**
 * Start the xibbit server system.
 *
 * @param method string An event handling strategy.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) Start(method string) {
	// socket connected
	self.socketio.OnConnect("/", func(sock socketio.Conn) error {
		session := self.GetSession(sock.ID())
		if session == nil {
			self.AddSession(NewSocket(&sock))
		}
		return nil
	})
	// decode the event
	self.socketio.OnEvent("/", "server", func(sock socketio.Conn, event map[string]interface{}) {
		defer func() {
			if e := recover(); e != nil {
				fmt.Println(e)
			}
		}()
		allowedKeys := []string{"_id"}
		allowedTypes := []string{"_instance"}
		session := self.GetSession(sock.ID())
		// process the event
		events := []struct {eventName string; data map[string]interface{}}{}
		handled := false
		if !handled {
			// see if the event has illegal keys
			for key, _ := range event {
				malformed := true
				// _id is a special property so sender can invoke callbacks
				if key[0:1] == "_" {
					for _, r := range allowedKeys {
						if key == r {
							malformed = false
						}
					}
				} else {
					malformed = false
				}
				if malformed {
					event["e"] = "malformed--property"
					events = append(events, struct {eventName string; data map[string]interface{}}{"client", event})
					handled = true
					break
				}
			}
		}
		if !handled {
			// see if there is no event type
			if _, ok := event["type"]; !ok {
				event["e"] = "malformed--type"
				events = append(events, struct {eventName string; data map[string]interface{}}{"client", event})
				handled = true
			}
		}
		if !handled {
			// see if event type has illegal value
			typeStr, _ := event["type"].(string)
			typeValidated, _ := regexp.MatchString(`^[a-z][a-z_]*$`, typeStr)
			if !typeValidated {
				for _, v := range allowedTypes {
					if typeStr == v {
						typeValidated = true
					}
				}
			}
			if !typeValidated {
				event["e"] = "malformed--type:" + event["type"].(string)
				events = append(events, struct {eventName string; data map[string]interface{}}{"client", event})
				handled = true
			}
		}
		// handle _instance event
		if !handled && (event["type"] == "_instance") {
			created := "retrieved"
			// instance value in event takes priority
			instance := ""
			if value, ok := event["instance"].(string); ok {
				instance = value
			}
			// recreate session
			if sess := self.GetSessionByInstance(instance); sess == nil {
				instanceMatched, _ := regexp.MatchString(`^[a-zA-Z0-9]{25}$`, instance)
				if instanceMatched {
					created = "recreated"
				} else {
					instance = self.GenerateInstance()
					created = "created"
				}
				// create a new instance for every tab even though they share session cookie
				event["instance"] = instance
				// save new instance_id in session
				session["session_data"].(map[string]interface{})["instance_id"] = instance
				self.SetSessionData(NewSocket(&sock), session["session_data"].(map[string]interface{}))
			} else {
				self.CombineSessions(instance, NewSocket(&sock))
			}
			session = self.GetSessionByInstance(instance)
			event["i"] = "instance " + created
		}
		// handle the event
		if !handled {
			event["_session"] = session["session_data"]
			event["_conn"] = map[string]interface{}{
				"socket": sock,
			}
			eventReply, _ := self.Trigger(event)
			// save session changes
			self.SetSessionData(NewSocket(&sock), eventReply["_session"].(map[string]interface{}))
			// remove the session property
			if _, ok := eventReply["_session"]; ok {
				delete(eventReply, "_session")
			}
			// remove the connection property
			if _, ok := eventReply["_conn"]; ok {
				delete(eventReply, "_conn")
			}
			// _instance event does not require an implementation; it's optional
			ee, ok := eventReply["e"].(string)
			if (eventReply["type"].(string) == "_instance") && ok && (ee == "unimplemented") {
				delete(eventReply, "e")
			}
			// reorder the properties so they look pretty
			reorderedEventReply := eventReply
			events = append(events, struct {eventName string; data map[string]interface{}}{"client", reorderedEventReply})
			handled = true
		}
		// emit all events
		for i := 0; i < len(events); i++ {
			self.OutputStream.write(NewSocket(&sock), events[i].eventName, events[i].data)
		}
	})
	// socket disconnected
	self.socketio.OnDisconnect("/", func(sock socketio.Conn, reason string) {
		self.RemoveSocketFromSession(NewSocket(&sock))
		self.CheckClock()
	})

	ticker := time.NewTicker(time.Second)
	go func() {
		for {
			select {
			case <-ticker.C:
				self.CheckClock()
				keysToSkip := []string{"_session", "_conn"}
				for _, session := range self.Sessions {
					events := []map[string]interface{}{}
					session["session_data"].(map[string]interface{})["instance_id"] = session["instance_id"]
					events = self.Receive(events, session["session_data"].(map[string]interface{}), false)
					for _, event := range events {
						if _conn, ok := session["_conn"].(map[string]interface{}); ok {
							socks := _conn["sockets"].([]*SocketWrapper)
							for _, sock := range socks {
								clone := self.CloneEvent(event, keysToSkip)
								self.OutputStream.write(sock, "client", clone)
							}
						}
					}
				}
			}
		}
	}()
}

/**
 * Package events, execute them and return response events.
 *
 * @param array fileEvents
 * @return NULL[]
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) ReadAndWriteUploadEvent(event []map[string]interface{}) []map[string]interface{} {
	return event
}

/**
 * Provide an authenticated callback for an event.
 *
 * @param typ string The event to handle.
 * @param fn mixed A function that will handle the event.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) On(group string, typ string, fn func(event map[string]interface{}, vars map[string]interface{}) map[string]interface{}) {
	self.Handler_groups[group][typ] = fn
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
 * @param event map The event to handle.
 * @return error If the loader had an error.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) LoadHandler(event map[string]interface{}) error {
	return errors.New("unimplemented")
}

/**
 * Invoke callbacks for an event.
 *
 * @param event array The event to handle.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) Trigger(event map[string]interface{}) (map[string]interface{}, error) {
	// clone the event
	keysToSkip := []string{"_conn", "_session", "image"}
	eventType, _ := event["type"].(string)
	var eventReply = self.CloneEvent(event, keysToSkip)
	for _, key := range keysToSkip {
		if _, exists := event[key]; exists {
			eventReply[key] = event[key]
		}
	}
	// determine authentication
	authenticated := false
	if session, ok := event["_session"].(map[string]interface{}); ok {
		if username, ok := session["_username"]; ok && (username != "") {
			authenticated = true
		}
	}
	// try to find event handler to invoke
	var handler func(event map[string]interface{}, vars map[string]interface{}) map[string]interface{} = nil
	onHandler, _ := self.Handler_groups["on"][eventType]
	apiHandler, _ := self.Handler_groups["api"][eventType]
	// try to load event handler dynamically
	if (onHandler == nil) && (apiHandler == nil) {
		e := self.LoadHandler(event)
		if e != nil {
			eventReply["e"] = e.Error()
		}
	}
	// try to find event handler to invoke again
	onHandler, _ = self.Handler_groups["on"][eventType]
	apiHandler, _ = self.Handler_groups["api"][eventType]
	// determine event handler to invoke
	if _, ok := eventReply["e"]; ok {
		handler = nil
	} else if (onHandler != nil) && authenticated {
		handler = onHandler
	} else if (apiHandler != nil)  {
		handler = apiHandler
	} else if (onHandler != nil) && !authenticated {
		handler = nil
		eventReply["e"] = "unauthenticated"
	} else {
		handler = nil
		eventReply["e"] = "unimplemented"
	}
	// invoke the handler
	if handler != nil {
		func() {
			defer func() {
				if e, _ := recover().(error); e != nil {
					eventReply["e"] = e.Error()
					b := make([]byte, 2048) // adjust buffer size to be larger than expected stack
					n := runtime.Stack(b, false)
					eventReply["e_stacktrace"] = string(b[:n])
				}
			}()
			eventReply = handler(eventReply, self.config["vars"].(map[string]interface{}))
		}()
	}
	return eventReply, nil
}

/**
 * Send an event to another user.
 *
 * The special &quot;all&quot; recipient
 * sends it to all logged in users.
 *
 * @param event map The event to send.
 * @param recipient string The username to send to.
 * @param emitOnly boolean Just call emit() or invoke __send event, too.
 * @return boolean True if the event was sent.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) Send(event map[string]interface{}, recipient string, emitOnly bool) (map[string]interface{}, error) {
	var e error = nil
	keysToSkip := []string{"_session", "_conn"}
	if emitOnly {
		address := ""
		if recipient != "" {
			address = recipient
		} else if recipient, ok := event["to"].(string); ok {
			address = recipient
		}
		if address != "" {
			recipients := self.GetSessionsByUsername(address)
			if len(recipients) > 0 {
				for _, recipient := range recipients {
					socks := recipient["_conn"].(map[string]interface{})["sockets"].([]*SocketWrapper)
					for _, sock := range socks {
						clone := self.CloneEvent(event, keysToSkip)
						self.OutputStream.write(sock, "client", clone)
					}
				}
			}
		}
	} else {
		// temporarily remove _session property
		keysToSkip := []string{"_session", "_conn", "_id", "__id"}
		clone := self.CloneEvent(event, keysToSkip)
		// convert _id to __id
		if _, ok := event["_id"]; ok {
			clone["__id"] = event["_id"]
		}
		// provide special __send event for caller to implement aliases, groups, all addresses
		ret, _ := self.Trigger(map[string]interface{}{
			"type":  "__send",
			"event": clone,
		})
		if err, ok := ret["e"]; ok && (err == "unimplemented") {
			self.Send(clone, recipient, true)
		}
		// restore properties
		event = self.UpdateEvent(event, clone, keysToSkip)
	}
	return event, e
}

/**
 * Return an array of events for this user.
 *
 * @return array An array of events.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) Receive(events []map[string]interface{}, session map[string]interface{}, collectOnly bool) []map[string]interface{} {
	if collectOnly {
		//TODO collect database events that can be shared across implementations
	} else {
		// provide special __receive event for alternative event system
		ret, _ := self.Trigger(map[string]interface{}{
			"type":     "__receive",
			"_session": session,
		})
		if (ret["type"].(string) != "__receive") || (ret["e"] == nil) || (ret["e"] != "unimplemented") {
			if eventQueue, ok := ret["eventQueue"].([]map[string]interface{}); ok {
				events = append(events, eventQueue...)
			}
		}
	}
	return events
}

/**
 * Connect or disconnect a user from the event system.
 *
 * @param event array The event to connect or disconnect.
 * @param connect boolean Connect or disconnect.
 * @return array The modified event.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) Connect(event map[string]interface{}, username string, connect bool) map[string]interface{} {
	// update last connection time for user in the database
	//	connected := 0
	session := event["_session"].(map[string]interface{})
	// update username variables
	if connect {
		session["_username"] = username
	} else {
		delete(session, "_username")
	}
	return event
}

/**
 * Update the connected value for this user.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) Touch(sessionData map[string]interface{}) {
	if username, ok := sessionData["_username"].(string); ok {
		// update last ping for this user in the database
		touched := time.Now().Format("2006-01-02 15:04:05")
		nullDateTime := "1970-01-01 00:00:00"
		q := "UPDATE `" + self.prefix + "users` SET `touched` = '" + touched + "' WHERE "
		q += "`username` = '" + username + "' && "
		q += "`connected` <> '" + nullDateTime + "';"
		self.Mysql_query(q)
	}
}

/**
 * Garbage collector.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) CheckClock() {
	// try to lock the global variables
	if self.LockGlobalVars() {
		globalVars := self.ReadGlobalVars()
		// create tick and lastTick native time objects
		tick := time.Now()
		lastTick := time.Unix(tick.Unix(), 0)
		if lastTickStr, ok := globalVars["_lastTick"].(string); ok {
			lastTickObject, e := time.Parse("2006-01-02 15:04:05", lastTickStr)
			if e == nil {
				lastTick = lastTickObject
			}
		}
		if _, ok := globalVars["_lastTick"]; ok {
			delete(globalVars, "_lastTick")
		}
		// provide special __clock event for housekeeping
		eventReply, _ := self.Trigger(map[string]interface{}{
			"type":       "__clock",
			"tick":       tick,
			"lastTick":   lastTick,
			"globalVars": globalVars,
		})
		// write and unlock global variables
		globalVars = eventReply["globalVars"].(map[string]interface{})
		globalVars["_lastTick"] = tick.Format("2006-01-02 15:04:05")
		self.WriteGlobalVars(globalVars)
		self.UnlockGlobalVars()
	}
}

/**
 * Update rows that have not been touched recently.
 *
 * @param secs int A number of seconds.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) UpdateExpired(table string, secs int, clause string) {
	expiration := time.Now().Add(time.Second * time.Duration(secs)).Format("2006-01-02 15:04:05")
	nullDateTime := "1970-01-01 00:00:00"
	q := "UPDATE `" + self.prefix + table + "` SET "
	q += "connected='" + nullDateTime + "', "
	q += "touched='" + nullDateTime + "' "
	q += "WHERE (`touched` < '" + expiration + "'" + clause + ");"
	self.Mysql_query(q)
}

/**
 * Delete rows that have not been touched recently.
 *
 * @param secs int A number of seconds.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) DeleteExpired(table string, secs int, clause string) {
	expiration := time.Now().Add(time.Second * time.Duration(secs)).Format("2006-01-02 15:04:05")
	q := "DELETE FROM `" + self.prefix + table + "` "
	q += "WHERE (`touched` < '" + expiration + "'" + clause + ");"
	self.Mysql_query(q)
}

/**
 * Delete rows in the first table that don't have a row in the second table.
 *
 * This is a way to manually enforce a foreign key constraint.
 *
 * @param table string A table to delete rows from.
 * @param column string A column to try to match to a column in the other table.
 * @param table2 string The other table that should have a corresponding row.
 * @param column2 string A column of the other table to match against.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) DeleteOrphans(table string, column string, table2 string, column2 string) {
    q := "DELETE FROM `" + self.prefix + table + "` " +
      "WHERE NOT EXISTS (SELECT * FROM `" + self.prefix + table2 + "` " +
      "WHERE `" + column2 + "`=`" + self.prefix + table + "`.`" + column + "`);";
	self.Mysql_query(q)
}

/**
 * Sort events by the __id database property.
 *
 * @param a array An event.
 * @param b array A different event.
 * @return int 1, -1 or 0.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) Cmp(a map[string]interface{}, b map[string]interface{}) int {
	ret := 0
	if a["___id"].(int) > b["___id"].(int) {
		ret = 1
	} else if a["___id"].(int) < b["___id"].(int) {
		ret = -1
	}
	return ret
}

/**
 * Create a clone with a subset of key-value pairs.
 *
 * Often, there are unneeded or problematic keys
 * that are better to remove or copy manually to
 * the clone.
 *
 * @param event map An event to clone.
 * @param keysToSkip slice An array of keys to not copy to the clone.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) CloneEvent(event map[string]interface{}, keysToSkip []string) map[string]interface{} {
	// remove and save values to be skipped
	saved := map[string]interface{}{}
	for _, key := range keysToSkip {
		if _, exists := event[key]; exists {
			saved[key] = event[key]
			delete(event, key)
		}
	}
	// clone the event
	//  guarantee no shared values
	b, e := json.Marshal(event)
	if e != nil {
		log.Println(e)
	}
	s := string(b)
	clone := make(map[string]interface{})
	e = json.Unmarshal([]byte(s), &clone)
	if e != nil {
		log.Println(e)
	}
	// restore saved values
	for key, value := range saved {
		event[key] = value
	}
	return clone
}

/**
 * Update the key-value pairs of an event using
 * the key-value pairs from a clone.
 *
 * This will only overwrite changed key-value
 * pairs; it will not copy unchanged key-value
 * pairs or remove keys.
 *
 * @param event array A target event.
 * @param clone array A source event.
 * @param keysToSkip An array of keys to not copy from the clone.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) UpdateEvent(event map[string]interface{}, clone map[string]interface{}, keysToSkip []string) map[string]interface{} {
	for key := range clone {
		exists := false
		for _, k := range keysToSkip {
			if k == key {
				exists = true
			}
		}
		if !exists {
			_, ok := event[key]
			if !ok || (event[key] != clone[key]) {
				event[key] = clone[key]
			}
		}
	}
	return event
}

/**
 * Return a random instance ID.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) GenerateInstance() (instance string) {
	var length = 25
	var a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	instance = ""
	for i := 0; i < length; i++ {
		instance += string(a[self.RandSecure(0, len(a))])
	}
	return
}

/**
 * Return a random number in a range.
 *
 * @param min int The minimum value.
 * @param max int The maximum value.
 * @return A random value.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) RandSecure(min int, max int) int {
	var log = math.Log2(float64(max - min))
	var bytes = int(math.Floor((log / 8) + 1))
	var bits = int(math.Floor(log + 1))
	var filter = uint(math.Floor(float64(int(1)<<bits - 1)))
	var rnd = uint(0)
	for {
		b := make([]byte, bytes)
		rand.Read(b)
		n, _ := strconv.ParseUint(hex.EncodeToString(b), 16, 64)
		rnd = uint(n)
		rnd = rnd & filter // discard irrelevant bits
		if !(rnd >= uint(max-min)) {
			break
		}
	}
	return int(math.Floor(float64(min + int(rnd))))
}

/**
 * Lock global variable in database for access.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) LockGlobalVars() bool {
	self.mu.Lock()
	return true
}

/**
 * Lock global variable in database for access.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) LockGlobalVarsUsingSql() bool {
	now := time.Now().Format("2006-01-02 15:04:05")
	// generate a unique lock identifier
	var length = 25
	var a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	var lockId = ""
	for i := 0; i < length; i++ {
		lockId += string(a[self.RandSecure(0, len(a))])
	}
	vars := "{\"id\":" + lockId + "}"
	// try to get the lock
	q := "INSERT INTO " + self.prefix + "sockets_sessions "
	q += "(`id`, `socksessid`, `connected`, `touched`, `vars`) VALUES ("
	q += "0, "
	q += "'lock', "
	q += "'" + self.Mysql_real_escape_string(now) + "', "
	q += "'" + self.Mysql_real_escape_string(now) + "', "
	q += "'" + self.Mysql_real_escape_string(vars) + "');"
	qr, e, _ := self.Mysql_query(q)
	oneAndOnly := false
	if e == nil {
		oneAndOnly = true
		self.Mysql_free_query(qr)
	}
	if oneAndOnly {
		// retrieve lock ID and confirm that it's the same
		q = "SELECT vars FROM " + self.prefix + "sockets_sessions WHERE `socksessid` = 'lock'"
		qr, _, _ := self.Mysql_query(q)
		row := self.Mysql_fetch_assoc(qr)
		if (qr != nil) && (row != nil) && (row["vars"] != nil) {
			oneAndOnly = true
		} else {
			oneAndOnly = false
		}
		self.Mysql_free_query(qr)
	}
	if !oneAndOnly {
		// release the lock if it has been too long
		self.DeleteExpired("sockets_sessions", 60, " AND `socksessid` = 'lock'")
	}
	return oneAndOnly
}

/**
 * Unlock global variable in database.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) UnlockGlobalVars() error {
	self.mu.Unlock()
	return nil
}

/**
 * Unlock global variable in database.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) UnlockGlobalVarsUsingSql() error {
	// release the lock
	q := "DELETE FROM " + self.prefix + "sockets_sessions WHERE socksessid = 'lock';"
	qr, e, _ := self.Mysql_query(q)
	self.Mysql_free_query(qr)
	return e
}

/**
 * Read global variables from database.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) ReadGlobalVars() map[string]interface{} {
	return self.globalVars
}

/**
 * Read global variables from database.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) ReadGlobalVarsUsingSql() map[string]interface{} {
	q := "SELECT vars FROM `" + self.prefix + "sockets_sessions` WHERE socksessid = 'global';"
	qr, _, _ := self.Mysql_query(q)
	vars := map[string]interface{}{}
	s := self.Mysql_fetch_assoc(qr)
	if s != nil {
		e := json.Unmarshal([]byte(s["vars"].(string)), &vars)
		if e != nil {
			log.Println(e)
		}
	}
	self.Mysql_free_query(qr)
	return vars
}

/**
 * Write global variables to database.
 *
 * @param vars map The JSON-friendly vars to save.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) WriteGlobalVars(vars map[string]interface{}) {
	self.globalVars = vars
}

/**
 * Write global variables to database.
 *
 * @param vars map The JSON-friendly vars to save.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) WriteGlobalVarsUsingSql(vars map[string]interface{}) {
	now := time.Now().Format("2006-01-02 15:04:05")
	b, _ := json.Marshal(vars)
	s := string(b)
	q := "UPDATE `" + self.prefix + "sockets_sessions` SET "
	q += "`touched` = '" + now + "',"
	q += "`vars` = '" + s + "' "
	q += "WHERE socksessid='global';"
	qr, _, _ := self.Mysql_query(q)
	self.Mysql_free_query(qr)
}

/**
 * Flexible mysql_query() function.
 *
 * @param query String The query to execute.
 * @return The mysql_query() return value.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) Mysql_query(query string) (*sql.Rows, error, []string) {
	columnNames := []string{}
	mysql, _ := self.config["mysql"].(map[string]interface{})
	link_identifier := (mysql["link"]).(*sql.DB)
	rows, e := link_identifier.Query(query)
	columnNames = []string{}
	if e == nil {
		columnNames, _ = rows.Columns()
	} else {
		log.Println(e)
	}
	return rows, e, columnNames
}

/**
 * Flexible mysql_fetch_assoc() function.
 *
 * @param result String The result to fetch.
 * @return The mysql_fetch_assoc() return value.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) Mysql_fetch_assoc(rows *sql.Rows) map[string]interface{} {
	var e error = nil
	var row map[string]interface{} = nil
	if rows.Next() {
		columnNames, _ := rows.Columns()
		fields := make([]interface{}, len(columnNames))
		values := make([]interface{}, len(columnNames))
		for i := 0; i < len(columnNames); i++ {
			fields[i] = &values[i]
		}
		if e = rows.Scan(fields...); e == nil {
			row = make(map[string]interface{})
			for i := 0; i < len(columnNames); i++ {
				_, value := values[i].([]byte)
				if value {
					row[columnNames[i]] = string(values[i].([]byte))
				} else {
					row[columnNames[i]] = values[i]
				}
			}
		} else {
			log.Panicln("XibbitHub.Mysql_fetch_assoc() coding error: " + e.Error())
		}
	}
	return row
}

/**
 * Flexible mysql_free_result() function.
 *
 * @param result String The result to free.
 * @return The mysql_free_result() return value.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) Mysql_free_query(rows *sql.Rows) {
	if rows != nil {
		rows.Close()
	}
}

/**
 * Flexible mysql_real_escape_string() function.
 *
 * @param unescaped_string String The string.
 * @return The mysql_real_escape_string() return value.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) Mysql_real_escape_string(unescaped_string string) string {
	escaped_string := strings.ReplaceAll(unescaped_string, "\\0", "\\x00")
	escaped_string = strings.ReplaceAll(escaped_string, "\n", "\\n")
	escaped_string = strings.ReplaceAll(escaped_string, "\r", "\\r")
	escaped_string = strings.ReplaceAll(escaped_string, "\\", "\\\\")
	escaped_string = strings.ReplaceAll(escaped_string, "'", "\\'")
	escaped_string = strings.ReplaceAll(escaped_string, "\"", "\\\"")
	escaped_string = strings.ReplaceAll(escaped_string, "\x1a", "\\\x1a")
	return escaped_string
}

/**
 * Flexible mysql_errno() function.
 *
 * @return The mysql_errno() return value.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) Mysql_errno(e error) int {
	errno, _ := strconv.Atoi(e.Error()[6:10])
	return errno
}

/**
 * Flexible mysql_error() function.
 *
 * @return The mysql_error() return value.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) Mysql_errstr(e error) string {
	return e.Error()
}

/**
 * Create XibbitHub required tables.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) CreateDatabaseTables(log ILog, users string) {
	now := time.Now().Format("2006-01-02 15:04:05")
	// create the sockets table
	//  this table contains all the sockets
	//
	//  a socket persists until the page is reloaded
	//  an instance/user persists across page reloads
	q := "CREATE TABLE `" + self.prefix + "sockets` ( "
	q += "`id` bigint(20) unsigned NOT NULL auto_increment,"
	q += "`sid` text,"
	q += "`connected` datetime NOT NULL," // 2014-12-23 06:00:00 (PST)
	q += "`touched` datetime NOT NULL," // 2014-12-23 06:00:00 (PST)
	q += "`props` text,"
	q += "UNIQUE KEY `id` (`id`));"
	_, e, _ := self.Mysql_query(q)
	if (e == nil) {
		log.Println(q, 0)
	} else {
		if self.Mysql_errno(e) == 1050 {
			log.Println("Table " + self.prefix + "sockets already exists!", 1)
		} else {
			log.Println("Table " + self.prefix + " had a MySQL error (" + strconv.Itoa(self.Mysql_errno(e)) + "): " + self.Mysql_errstr(e), 2)
		}
	}

	// create the sockets_events table
	//  this table holds undelivered events/messages for sockets
	q = "CREATE TABLE `" + self.prefix + "sockets_events` ( "
	q += "`id` bigint(20) unsigned NOT NULL auto_increment,"
	q += "`sid` text,"
	q += "`event` mediumtext,"
	q += "`touched` datetime NOT NULL," // 2014-12-23 06:00:00 (PST)
	q += "UNIQUE KEY `id` (`id`));"
	_, e, _ = self.Mysql_query(q)
	if (e == nil) {
		log.Println(q, 0)
	} else {
		if self.Mysql_errno(e) == 1050 {
			log.Println("Table " + self.prefix + "sockets_events already exists!", 1)
		} else {
			log.Println("Table " + self.prefix + " had a MySQL error (" + strconv.Itoa(self.Mysql_errno(e)) + "): " + self.Mysql_errstr(e), 2)
		}
	}

	// create the sockets_sessions table
	//  this table does double duty
	//  the 'global' row is a shared, persistent, global var
	//  the other rows contain session data that replaces PHP's
	//    session_start() function which is inflexible
	q = "CREATE TABLE `" + self.prefix + "sockets_sessions` ( "
	q += "`id` bigint(20) unsigned NOT NULL auto_increment,"
	q += "`socksessid` varchar(25) NOT NULL,"
	q += "`connected` datetime NOT NULL," // 2014-12-23 06:00:00 (PST)
	q += "`touched` datetime NOT NULL," // 2014-12-23 06:00:00 (PST)
	q += "`vars` text,"
	q += "UNIQUE KEY `id` (`id`),"
	q += "UNIQUE KEY `socksessid` (`socksessid`));"
	_, e, _ = self.Mysql_query(q)
	if (e == nil) {
		log.Println(q, 0)
	} else {
		if self.Mysql_errno(e) == 1050 {
			log.Println("Table " + self.prefix + "sockets_sessions already exists!", 1)
		} else {
			log.Println("Table " + self.prefix + " had a MySQL error (" + strconv.Itoa(self.Mysql_errno(e)) + "): " + self.Mysql_errstr(e), 2)
		}
	}
	// add the global row to the sockets_sessions table
	q = "SELECT id FROM " + self.prefix + "sockets_sessions"
	_, e, _ = self.Mysql_query(q)
	num_rows := 0
	if num_rows == 0 {
		values := []string{}
		values = append(values, "0, 'global', '" + now + "', '" + now + "', '{}'")
		for _, value := range values {
			q = "INSERT INTO " + self.prefix + "sockets_sessions VALUES (" + value + ")"
			_, e, _ = self.Mysql_query(q)
			if (e != nil) {
				log.Println("<div class=\"error\">INSERT INTO: Table " + self.prefix + "sockets_sessions had a MySQL error (" + strconv.Itoa(self.Mysql_errno(e)) + "): " + self.Mysql_errstr(e) + "</div>\n", 2)
				log.Println("<div class=\"error\">" + q + "</div>\n", 2)
			} else {
				log.Println(q, 0)
			}
		}
	} else {
		log.Println("Table " + self.prefix + "sockets_sessions already has data!", 1)
	}

	// create the users table
	if users != "" {
		q = "CREATE TABLE `" + self.prefix + "users` ( "
		q += "`id` bigint(20) unsigned NOT NULL auto_increment,"
		q += "`uid` bigint(20) unsigned NOT NULL,"
		q += "`username` text,"
		q += "`email` text,"
		q += "`pwd` text,"
		q += "`created` datetime NOT NULL," // 2014-12-23 06:00:00 (PST)
		q += "`connected` datetime NOT NULL," // 2014-12-23 06:00:00 (PST)
		q += "`touched` datetime NOT NULL," // 2014-12-23 06:00:00 (PST)
		q += users + ","
		q += "UNIQUE KEY `id` (`id`));"
		_, e, _ = self.Mysql_query(q)
		if (e == nil) {
			log.Println(q, 0)
		} else {
			if self.Mysql_errno(e) == 1050 {
				log.Println("Table " + self.prefix + "users already exists!", 1)
			} else {
				log.Println("Table " + self.prefix + "users had a MySQL error (" + strconv.Itoa(self.Mysql_errno(e)) + "): " + self.Mysql_errstr(e), 2)
			}
		}
	}
}

/**
 * Drop XibbitHub required tables.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) DropDatabaseTables(log ILog, users bool) {
	// this table only has temporary data
	q := "DROP TABLE `" + self.prefix + "sockets`;"
	_, e, _ := self.Mysql_query(q)
	if e == nil {
		log.Println(q, 0)
	} else {
		log.Println(self.Mysql_errstr(e), 2)
	}

	// this table only has temporary data
	q = "DROP TABLE `" + self.prefix + "sockets_events`;"
	_, e, _ = self.Mysql_query(q)
	if e == nil {
		log.Println(q, 0)
	} else {
		log.Println(self.Mysql_errstr(e), 2)
	}

	// this table only has temporary data
	q = "DROP TABLE `" + self.prefix + "sockets_sessions`;"
	_, e, _ = self.Mysql_query(q)
	if e == nil {
		log.Println(q, 0)
	} else {
		log.Println(self.Mysql_errstr(e), 2)
	}

	// required for XibbitHub but might have persistent data
    if users {
		q = "DROP TABLE `" + self.prefix + "users`;"
		_, e, _ = self.Mysql_query(q)
		if e == nil {
			log.Println(q, 0)
		} else {
			log.Println(self.Mysql_errstr(e), 2)
		}
	}
}
