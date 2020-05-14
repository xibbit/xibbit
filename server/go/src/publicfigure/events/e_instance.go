///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
package events

import (
	"publicfigure/pfapp"
	"time"
	"xibbit"
)

/**
 * Handle _instance event.  Save instance so
 * events can be broadcast to it later.
 *
 * @author DanielWHoward
 **/
func E_instance(event map[string]interface{}, vars map[string]interface{}) map[string]interface{} {
	hub := vars["hub"].(*xibbit.XibbitHub)
	pf := vars["pf"].(*pfapp.Pfapp)

	useInstances, ok := vars["useInstances"].(bool)
	if useInstances && ok {
		now := time.Now().Format("2006-01-02 15:04:05")
		localSid := ""
		uid, _ := event["_session"].(map[string]interface{})["uid"].(int)
		instance := event["instance"].(string)
		// see if the instance already exists
		row, _ := pf.ReadOneRow(map[string]interface{}{
			"table": "instances",
			"where": map[string]interface{}{
				"instance": instance,
			},
		})
		// save the instance
		if row == nil {
			// this is a brand new instance/user
			values := map[string]interface{}{
				"id":        0,
				"sid":       localSid,
				"uid":       uid,
				"instance":  instance,
				"connected": now,
				"touched":   now,
			}
			event["_session"].(map[string]interface{})["instance"] = event["instance"]
			pf.InsertRow(map[string]interface{}{
				"table":  "instances",
				"values": values,
			})
			hub.Send(map[string]interface{}{
				"type": "notify_instance",
				"to":   "all",
			}, "", false)
		} else {
			// if the browser page is reloaded, a new socket is
			//  created with an existing instance
			values := map[string]interface{}{
				"sid":      localSid,
				"uid":      uid,
				"instance": instance,
				"touched":  now,
			}
			pf.UpdateRow(map[string]interface{}{
				"table":  "instances",
				"values": values,
				"where": map[string]interface{}{
					"instance": event["_session"].(map[string]interface{})["instance"],
				},
			})
		}
	}
	return event
}
