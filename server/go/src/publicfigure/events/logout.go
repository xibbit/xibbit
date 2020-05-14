///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
package events

import (
	"publicfigure/asserte"
	"publicfigure/pfapp"
	"xibbit"
)

/**
 * Handle logout event.  Sign out a user.
 *
 * @author DanielWHoward
 **/
func Logout(event map[string]interface{}, vars map[string]interface{}) map[string]interface{} {
	hub := vars["hub"].(*xibbit.XibbitHub)
	pf := vars["pf"].(*pfapp.Pfapp)

	asserte.NoAsserte(event)

	// broadcast this instance logged out
	hub.Send(map[string]interface{}{
		"type": "notify_logout",
		"to":   "all",
		"from": event["from"],
	}, "", false)
	// logout this instance
	hub.Connect(event, event["_session"].(map[string]interface{})["username"].(string), false)
	// remove UID from the instance
	row, _ := pf.ReadOneRow(map[string]interface{}{
		"table": "instances",
		"where": map[string]interface{}{
			"instance": event["_session"].(map[string]interface{})["instance"],
		},
	})
	if row != nil {
		values := map[string]interface{}{
			"uid": 0,
		}
		pf.UpdateRow(map[string]interface{}{
			"table":  "instances",
			"values": values,
			"where": map[string]interface{}{
				"instance": event["_session"].(map[string]interface{})["instance"],
			},
		})
	}
	// remove UID and user info from the session
	delete(event["_session"].(map[string]interface{}), "uid")
	delete(event["_session"].(map[string]interface{}), "user")
	event["i"] = "logged out"
	return event
}
