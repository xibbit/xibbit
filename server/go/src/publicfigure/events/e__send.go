///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
package events

import (
	"encoding/json"
	"publicfigure/pfapp"
	"time"
	"xibbit"
)

/**
 * Handle __send event.  Process "all" and user
 * aliases to send this event to multiple
 * instances.
 *
 * @author DanielWHoward
 **/
func E__send(event map[string]interface{}, vars map[string]interface{}) map[string]interface{} {
	hub := vars["hub"].(*xibbit.XibbitHub)
	pf := vars["pf"].(*pfapp.Pfapp)

	// assume that this event does not need special handlingt
	event["e"] = "unimplemented"

	useInstances, ok := vars["useInstances"].(bool)
	if useInstances && ok {
		now := time.Now().Format("2006-01-02 15:04:05")
		eventMap, _ := event["event"].(map[string]interface{})
		if toStr, ok := eventMap["to"].(string); ok {
			sent := false
			eventFrom := eventMap["from"]
			if eventFrom == nil {
				eventFrom = "x"
			}
			// get the sender
			from, _ := pf.ReadOneRow(map[string]interface{}{
				"table": "users",
				"where": map[string]interface{}{
					"username": eventFrom,
				},
			})
			// get the receiver
			to, _ := pf.ReadOneRow(map[string]interface{}{
				"table": "users",
				"where": map[string]interface{}{
					"username": toStr,
				},
			})
			// resolve the "to" address to instances
			instances := hub.Sessions
			q := map[string]interface{}{
				"table": "instances",
			}
			if (to != nil) && (toStr != "all") {
				q = map[string]interface{}{
					"table": "instances",
					"where": map[string]interface{}{
						"uid": to["uid"],
					},
				}
			}
			instances, _ = pf.ReadRows(q)
			// send an event to each instance
			for _, instance := range instances {
				keysToSkip := []string{"_conn"}
				sent = true
				// clone the event so we can safely modify it
				var evt = hub.CloneEvent(eventMap, keysToSkip)
				// "to" is an instance ID in events table
				instanceId := instance["instance"]
				// overwrite "from" and add "fromid" field
				if from != nil {
					evt["from"] = from["username"]
					evt["fromid"] = from["uid"]
				}
				evtBytes, _ := json.Marshal(evt)
				evtStr := string(evtBytes)
				values := map[string]interface{}{
					"id":      0,
					"sid":     instanceId,
					"event":   evtStr,
					"touched": now,
				}
				pf.InsertRow(map[string]interface{}{
					"table":  "sockets_events",
					"values": values,
				})
			}
			if sent {
				delete(event, "e")
			}
		}
	}
	return event
}
