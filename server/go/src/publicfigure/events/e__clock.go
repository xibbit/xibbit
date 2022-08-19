// The MIT License (MIT)
//
// xibbit 1.5.2 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @version 1.5.2
// @copyright xibbit 1.5.2 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
package events

import (
	"time"
	"xibbit"
)

/**
 * Handle __clock event.  Remove saved instances if
 * they have not been heard from in a while.
 *
 * @author DanielWHoward
 **/
func E__clock(event map[string]interface{}, vars map[string]interface{}) map[string]interface{} {
	hub := vars["hub"].(*xibbit.XibbitHub)

	// use seconds since epoch instead of datetime string to demo how this is done
	now := time.Now()
	globalVars := event["globalVars"].(map[string]interface{})

	lastRandomEventTime, ok := globalVars["lastRandomEventTime"].(float64)
	if !ok ||
		now.After(time.Unix(int64(lastRandomEventTime), 0).Add(time.Second*time.Duration(10))) {
		//(now.Unix() > (int64(lastRandomEventTime) + 10)) { // simpler version
		globalVars["lastRandomEventTime"] = int(now.Unix())
		if _, ok := globalVars["numRandom"].(float64); ok {
			globalVars["numRandom"] = int(globalVars["numRandom"].(float64)) + 1
		} else {
			globalVars["numRandom"] = 1
		}
		if _, ok := globalVars["lastRandomEventIndex"]; !ok {
			globalVars["lastRandomEventIndex"] = 0
		}
		globalVars["lastRandomEventIndex"] =
			int((globalVars["lastRandomEventIndex"].(float64))+1) % 4
		eventIndex := globalVars["lastRandomEventIndex"].(int)

		randomUsers := [][]interface{}{
			[]interface{}{"admin", 1},
			[]interface{}{"user1", 2},
		}
		randomTypes := [...]string{
			"notify_laughs",
			"notify_jumps",
		}
		randomUser := randomUsers[eventIndex%2][0]
		randomType := randomTypes[eventIndex/2]
		hub.Send(map[string]interface{}{
			"type": randomType,
			"to":   "all",
			"from": randomUser,
		}, "", false)
	}

	return event
}
