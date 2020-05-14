///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
package events

import (
	"publicfigure/array"
	"publicfigure/asserte"
	"publicfigure/pfapp"
)

/**
 * Handle user_profile_mail_update event.  Change
 * this user"s mailing address and other values.
 *
 * @author DanielWHoward
 **/
func User_profile_mail_update(event map[string]interface{}, vars map[string]interface{}) map[string]interface{} {
	pf := vars["pf"].(*pfapp.Pfapp)

	asserte.Asserte(func() bool { _, ok := event["user"]; return ok }, "missing:user")
	asserte.Asserte(func() bool { return array.HasStringKeys(event["user"].(map[string]interface{})) }, "typeof:user")

	// get the current user
	uid := event["_session"].(map[string]interface{})["uid"].(int)
	me, _ := pf.ReadOneRow(map[string]interface{}{
		"table": "users",
		"where": map[string]interface{}{
			"uid": uid,
		},
	})
	asserte.Asserte(func() bool { return me != nil }, "current user not found")
	// remove all uneditable fields
	readonly := [...]string{
		"id",
		"roles",
		"json",
		"n",
		"password",
	}
	for _, key := range readonly {
		if event["user"].(map[string]interface{})[key] != nil {
			delete(event["user"].(map[string]interface{}), "key")
		}
	}
	// update the profile
	pf.UpdateRow(map[string]interface{}{
		"table":  "users",
		"values": event["user"],
		"where": map[string]interface{}{
			"uid": uid,
		},
	})
	// info: profile updated
	event["i"] = "profile updated"
	return event
}
