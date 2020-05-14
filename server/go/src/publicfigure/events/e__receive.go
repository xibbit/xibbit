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
)

/**
 * Handle __receive event.  Change event queue to
 * use instances instead of usernames.
 *
 * @author DanielWHoward
 **/
func E__receive(event map[string]interface{}, vars map[string]interface{}) map[string]interface{} {
	pf := vars["pf"].(*pfapp.Pfapp)

	// assume that this event does not need special handling
	event["e"] = "unimplemented"

	useInstances, ok := vars["useInstances"].(bool)
	if ok && useInstances {
		sessionMap, _ := event["_session"].(map[string]interface{})
		if instance, ok := sessionMap["instance"].(string); ok {
			event["eventQueue"] = []map[string]interface{}{}
			// get the events from the events table
			events, _ := pf.ReadRows(map[string]interface{}{
				"table": "sockets_events",
				"where": map[string]interface{}{
					"sid": instance,
				},
			})
			for f := 0; f < len(events); f++ {
				evt := events[f]["event"].(string)
				evtMap := make(map[string]interface{}, 0)
				json.Unmarshal([]byte(evt), &evtMap)
				// delete the event from the events table
				pf.DeleteRow(map[string]interface{}{
					"table": "sockets_events",
					"where": map[string]interface{}{
						"id": events[f]["id"],
					},
				})
				event["eventQueue"] = append(event["eventQueue"].([]map[string]interface{}), evtMap)
			}
			delete(event, "e")
		}
	}
	return event
}
