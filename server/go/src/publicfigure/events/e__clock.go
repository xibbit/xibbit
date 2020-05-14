///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
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

		event["globalVars"] = globalVars
	}

	return event
}
