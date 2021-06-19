// The MIT License (MIT)
//
// xibbit 1.5.1 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @version 1.5.1
// @copyright xibbit 1.5.1 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
package xibbit

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	socketio "github.com/googollee/go-socket.io"
	"log"
	"math"
	"regexp"
	"strconv"
	"strings"
	"time"
)

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
	config   map[string]interface{}
	onfn     map[string]func(event map[string]interface{}, vars map[string]interface{}) map[string]interface{}
	apifn    map[string]func(event map[string]interface{}, vars map[string]interface{}) map[string]interface{}
	prefix   string
	Sessions []map[string]interface{}
}

/**
 * Constructor.
 *
 * @author DanielWHoward
 **/
func NewXibbitHub(config map[string]interface{}) *XibbitHub {
	self := new(XibbitHub)
	config["vars"].(map[string]interface{})["hub"] = self
	self.config = config
	self.prefix = ""
	self.onfn = make(map[string]func(event map[string]interface{}, vars map[string]interface{}) map[string]interface{})
	self.apifn = make(map[string]func(event map[string]interface{}, vars map[string]interface{}) map[string]interface{})
	self.socketio = config["socketio"].(*socketio.Server)
	self.Sessions = make([]map[string]interface{}, 0)
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
 * Return the socket associated with a socket ID.
 *
 * @param sid string The socket ID.
 * @return A socket.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) GetSocket(sid string, config map[string]interface{}) *socketio.Server {
	return self.socketio
}

/**
 * Get the session associated with a socket which always
 * has a data key and a _conn key.  The _conn key has a
 * map that contains a sockets key with an array of
 * sockets.  A socket is globally unique in the sessions
 * object.  The session may also have a username key and
 * an instance key.
 *
 * An instance is also globally unique.  A socket may
 * have a non-instance session or may be combined with
 * other sockets for an instanced session.
 *
 * @param sock socketio.Conn A socket.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) GetSession(sock socketio.Conn) map[string]interface{} {
	var session map[string]interface{} = nil
	i := self.GetSessionIndex(sock)
	if i != -1 {
		session = self.CloneSession(self.Sessions[i])
	}
	return session
}

/**
 * This is an implementation helper.  It assumes that
 * the session store is an array.
 *
 * @param sock socketio.Conn A socket.
 * @returns int The index into a session array.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) GetSessionIndex(sock socketio.Conn) int {
	for i, session := range self.Sessions {
		socks := session["_conn"].(map[string]interface{})["sockets"].([]socketio.Conn)
		for _, skt := range socks {
			if sock == skt {
				return i
			}
		}
	}
	return -1
}

/**
 * Get the session associated with an instance.
 *
 * @param instance string An instance string.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) GetSessionByInstance(instance string) map[string]interface{} {
	if instance != "" {
		for _, session := range self.Sessions {
			if instance == session["instance"] {
				return self.CloneSession(session)
			}
		}
	}
	return nil
}

/**
 * Change the session associated with a socket.
 *
 * @param sock socketio.Conn A socket.
 * @param session map The session values.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) SetSession(sock socketio.Conn, session map[string]interface{}) {
	i1 := self.GetSessionIndex(sock)
	if i1 == -1 {
		log.Println("XibbitHub.SetSession() could not find the session")
		//		self.AddSession(sock, session)
	} else {
		instance1, ok1 := self.Sessions[i1]["instance"].(string)
		instance2, ok2 := session["instance"].(string)
		if (!ok1 && !ok2) || (ok1 && ok2 && (instance1 == instance2)) {
			clone := self.CloneSession(session)
			conn := self.Sessions[i1]["_conn"]
			self.Sessions[i1] = clone
			self.Sessions[i1]["_conn"] = conn
		} else if ok1 && !ok2 {
			clone := self.CloneSession(session)
			conn := self.Sessions[i1]["_conn"]
			self.Sessions[i1] = clone
			self.Sessions[i1]["instance"] = instance1
			self.Sessions[i1]["_conn"] = conn
		} else {
			i2 := -1
			for i2i, sess := range self.Sessions {
				if instance2 == sess["instance"] {
					i2 = i2i
				}
			}
			if i2 == -1 {
				clone := self.CloneSession(session)
				conn := self.Sessions[i1]["_conn"]
				self.Sessions[i1] = clone
				self.Sessions[i1]["_conn"] = conn
			} else {
				socks := self.Sessions[i1]["_conn"].(map[string]interface{})["sockets"].([]socketio.Conn)
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
				clone := self.CloneSession(session)
				conn := self.Sessions[i2]["_conn"]
				self.Sessions[i2] = clone
				self.Sessions[i2]["_conn"] = conn
				socks = self.Sessions[i2]["_conn"].(map[string]interface{})["sockets"].([]socketio.Conn)
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
func (self *XibbitHub) AddSession(sock socketio.Conn) {
	session := map[string]interface{}{
		"session_data": map[string]interface{}{},
		"_conn": map[string]interface{}{
			"sockets": []socketio.Conn{
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
func (self *XibbitHub) RemoveSession(sock socketio.Conn) {
	s := -1
	k := -1
	found := false
	// find the session index and socket index
	for si, session := range self.Sessions {
		sockets := session["_conn"].(map[string]interface{})["sockets"].([]socketio.Conn)
		instance, _ := session["instance"].(string)
		for ki, skt := range sockets {
			if sock == skt {
				s = si
				if (len(sockets) > 1) || (instance != "") {
					k = ki
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
	if found && (k == -1) {
		self.Sessions = append(self.Sessions[0:s], self.Sessions[s+1:]...)
	} else if found {
		sockets := self.Sessions[s]["_conn"].(map[string]interface{})["sockets"].([]socketio.Conn)
		sockets = append(sockets[0:k], sockets[k+1:]...)
		self.Sessions[s]["_conn"].(map[string]interface{})["sockets"] = sockets
	} else {
		log.Println("XibbitHub.RemoveSession() could not find the session")
	}
}

/**
 * Return a duplicate of the session, though the _conn is shared.  A
 * clone prevents code from relying on shared pointers.
 *
 * @param session map The session values.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) CloneSession(session map[string]interface{}) map[string]interface{} {
	var _conn interface{} = session["_conn"]
	delete(session, "_conn")
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
	session["_conn"] = _conn
	clone["_conn"] = _conn
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
	for _, f := range last {
		v, ok := targets[len(first)][f]
		if ok {
			targets[i] = make(map[string]interface{})
			targets[i][f] = v
			delete(targets[len(first)], f)
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
 * Return a JSON string with keys in a specific order.
 *
 * @param s map A JSON string with keys in random order.
 * @param first slice An array of key names to put in order at the start.
 * @param last slice An array of key names to put in order at the end.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) ReorderArray(source string, first []string, last []string) string {
	return source
}

/**
 * Start the Xibbit server system.
 *
 * @param method string An event handling strategy.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) Start(method string) {
	// socket connected
	self.socketio.OnConnect("/", func(sock socketio.Conn) error {
		session := self.GetSession(sock)
		if session == nil {
			self.AddSession(sock)
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
		session := self.GetSession(sock)
		// process the event
		events := []map[string]interface{}{}
		handled := false
		if !handled {
			// verify that the event is well formed
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
					events = append(events, event)
					handled = true
					break
				}
			}
			if !handled {
				// check event type exists
				if _, ok := event["type"]; !ok {
					event["e"] = "malformed--type"
					events = append(events, event)
					handled = true
				}
				// check event type is string and has valid value
				if !handled {
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
						events = append(events, event)
						handled = true
					}
				}
				if !handled {
					// add _session and _conn properties for convenience
					event["_session"] = session["session_data"]
					event["_conn"] = map[string]interface{}{
						"sockets": sock,
						"user":    session,
					}
				}
				// handle _instance event
				if !handled && (event["type"] == "_instance") {
					created := "retrieved"
					// event instance value takes priority
					instance := ""
					if value, ok := event["instance"].(string); ok {
						instance = value
					}
					// recreate session
					sess := self.GetSessionByInstance(instance)
					if sess == nil {
						instanceMatched, _ := regexp.MatchString(`^[a-zA-Z0-9]{25}$`, instance)
						if instanceMatched {
							created = "recreated"
						} else {
							var length = 25
							var a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
							instance = ""
							for i := 0; i < length; i++ {
								instance += string(a[self.RandSecure(0, len(a))])
							}
							created = "created"
						}
						// create a new instance for every tab even though they share session cookie
						event["instance"] = instance
						// update request with instance for convenience
						session["instance"] = instance
						self.SetSession(sock, session)
					}
					// get session (again)
					session = self.GetSessionByInstance(instance)
					event["_session"] = session["session_data"]
					event["_session"].(map[string]interface{})["instance"] = instance
					event["_conn"] = session["_conn"]
					event["i"] = "instance " + created
				}
				// handle the event
				if !handled {
					eventsReply, _ := self.Trigger(event)
					eventReply := eventsReply[0]
					session["session_data"] = eventReply["_session"]
					if _, ok := session["session_data"].(map[string]interface{})["instance"]; ok {
						delete(session["session_data"].(map[string]interface{}), "instance")
					}
					self.SetSession(sock, session)
					// remove the session property
					if eventReply["_session"] != nil {
						delete(eventReply, "_session")
					}
					// remove the connection property
					if eventReply["_conn"] != nil {
						delete(eventReply, "_conn")
					}
					// _instance event does not require an implementation; it's optional
					ee, ok := eventReply["e"].(string)
					if (eventReply["type"].(string) == "_instance") && ok && (ee == "unimplemented") {
						delete(eventReply, "e")
					}
					events = append(events, eventReply)
					handled = true
				}
			}
		}
		// emit all events
		for i := 0; i < len(events); i++ {
			sock.Emit("client", events[i])
		}
	})
	// socket disconnected
	self.socketio.OnDisconnect("/", func(sock socketio.Conn, reason string) {
		session := self.GetSession(sock)
		self.RemoveSession(sock)
		self.CheckClock(session)
	})

	ticker := time.NewTicker(time.Second)
	go func() {
		for {
			select {
			case <-ticker.C:
				session := map[string]interface{}{}
				self.CheckClock(session)
				keysToSkip := []string{"_session", "_conn"}
				for _, session := range self.Sessions {
					events := []map[string]interface{}{}
					session["session_data"].(map[string]interface{})["instance"] = session["instance"]
					events = self.Receive(events, session["session_data"].(map[string]interface{}), false)
					for _, event := range events {
						if _conn, ok := session["_conn"].(map[string]interface{}); ok {
							sockets := _conn["sockets"].([]socketio.Conn)
							for _, socket := range sockets {
								clone := self.CloneEvent(event, keysToSkip)
								socket.Emit("client", clone)
							}
						}
					}
				}
			}
		}
	}()
}

/**
 * Provide an authenticated callback for an event.
 *
 * @param typ string The event to handle.
 * @param fn mixed A function that will handle the event.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) On(typ string, fn func(event map[string]interface{}, vars map[string]interface{}) map[string]interface{}) {
	self.onfn[typ] = fn
}

/**
 * Provide an unauthenticated callback for an event.
 *
 * @param typ string The event to handle.
 * @param fn mixed A function that will handle the event.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) Api(typ string, fn func(event map[string]interface{}, vars map[string]interface{}) map[string]interface{}) {
	self.apifn[typ] = fn
}

/**
 * Invoke callbacks for an event.
 *
 * @param event array The event to handle.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) Trigger(event map[string]interface{}) ([]map[string]interface{}, error) {
	keysToSkip := []string{"_conn", "_session"}
	var eventType = event["type"].(string)
	//	var pluginsFolder = nil;
	//	var handlerFile = nil;
	//	var handler = nil;
	_, invoked := event["e"]
	var handler func(event map[string]interface{}, vars map[string]interface{}) map[string]interface{} = nil
	var onHandler func(event map[string]interface{}, vars map[string]interface{}) map[string]interface{} = nil
	var apiHandler func(event map[string]interface{}, vars map[string]interface{}) map[string]interface{} = nil
	// find the event handler to invoke
	onHandler, _ = self.onfn[eventType]
	apiHandler, _ = self.apifn[eventType]
	if onHandler != nil {
		handler = onHandler
	} else if apiHandler != nil {
		handler = apiHandler
	}
	// load event handler dynamically
	if invoked {
		return []map[string]interface{}{event}, nil
	} else if handler != nil {
		// clone the event

		var eventReply = self.CloneEvent(event, keysToSkip)
		if _, ok := event["_conn"]; ok {
			eventReply["_conn"] = event["_conn"]
		}
		if _, ok := event["_session"]; ok {
			eventReply["_session"] = event["_session"]
		}
		// authenticate
		if self.onfn[eventType] != nil && event["from"] == nil && event["_session"] == nil {
			if _, ok := self.apifn[eventType]; ok {
				handler = self.apifn[eventType]
			} else {
				eventReply["e"] = "unauthenticated"
				invoked = true
			}
		}
		// invoke the handler
		if !invoked {
			func() {
				defer func() {
					if e := recover(); e != nil {
						eventReply["e"] = e
					}
				}()
				eventReply = handler(eventReply, self.config["vars"].(map[string]interface{}))
			}()
			if _, ok := eventReply["type"]; !ok {
				// handle asynchronous asserte() failure
				e := eventReply
				eventReply = self.CloneEvent(event, keysToSkip)
				if _, ok := event["_conn"]; ok {
					eventReply["_conn"] = event["_conn"]
				}
				if _, ok := event["_session"]; ok {
					eventReply["_session"] = event["_session"]
				}
				eventReply["e"] = e
				return []map[string]interface{}{eventReply}, nil
			}
		}
		event = eventReply
	} else {
		// get the plugins folder
	}
	return []map[string]interface{}{event}, nil
}

/**
 * Send an event to another user and, optionally,
 * provide a callback to process a response.
 *
 * @param event array The event to send.
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
			recipients := []map[string]interface{}{}
			if address == "all" {
				recipients = self.GetUsers()
			} else {
				recipients = self.GetUser(address)
			}
			if len(recipients) > 0 {
				for _, recipient := range recipients {
					sockets := recipient["_conn"].(map[string]interface{})["sockets"].([]socketio.Conn)
					for _, socket := range sockets {
						clone := self.CloneEvent(event, keysToSkip)
						socket.Emit("client", clone)
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
		if len(ret) > 0 {
			if err, ok := ret[0]["e"]; ok && (err == "unimplemented") {
				self.Send(clone, recipient, true)
			}
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
		rets, _ := self.Trigger(map[string]interface{}{
			"type":     "__receive",
			"_session": session,
		})
		ret := rets[0]
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
func (self *XibbitHub) Connect(event map[string]interface{}, username string, connect bool) {
	// update last connection time for user in the database
	//	connected := 0
	user := event["_conn"].(map[string]interface{})["user"].(map[string]interface{})
	// update username variables
	if connect {
		user["username"] = username
		user["session_data"].(map[string]interface{})["username"] = username
	} else {
		delete(user["session_data"].(map[string]interface{}), "username")
		delete(user, "username")
	}
}

/**
 * Update the connected value for this user.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) Touch() {
	// nothing to do
}

/**
 * Garbage collector.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) CheckClock(user map[string]interface{}) {
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
		event, _ := self.Trigger(map[string]interface{}{
			"type":       "__clock",
			"tick":       tick,
			"lastTick":   lastTick,
			"globalVars": globalVars,
		})
		// write and unlock global variables
		globalVars = event[0]["globalVars"].(map[string]interface{})
		globalVars["_lastTick"] = tick.Format("2006-01-02 15:04:05")
		self.WriteGlobalVars(globalVars)
		self.UnlockGlobalVars()
	}
}

/**
 * Return user status, permissions, etc.
 *
 * @param username string The user name of the user to retrieve.
 * @return array The user.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) GetUser(username string) []map[string]interface{} {
	users := make([]map[string]interface{}, 0)
	for _, session := range self.Sessions {
		if username == session["username"] {
			users = append(users, session)
		}
	}
	return users
}

/**
 * Return all users' status, permissions, etc.
 *
 * @return array An array of users.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) GetUsers() []map[string]interface{} {
	return self.Sessions
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
 * @param $table string A table to delete rows from.
 * @param $column string A column to try to match to a column in the other table.
 * @param $table2 string The other table that should have a corresponding row.
 * @param $column2 string A column of the other table to match against.
 *
 * @author DanielWHoward
 **/
func (self *XibbitHub) DeleteOrphans(table string, secs int, clause string) {
	expiration := time.Now().Add(time.Second * time.Duration(secs)).Format("2006-01-02 15:04:05")
	q := "DELETE FROM `" + self.prefix + table + "` "
	q += "WHERE (`touched` < '" + expiration + "'" + clause + ");"
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
	} else if a["___id"].(int) > b["___id"].(int) {
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
 */
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
 */
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
 */
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
 */
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
