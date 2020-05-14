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
 * Handle user_profile event.  Get this user's
 * profile.
 *
 * @author DanielWHoward
 **/
func User_profile(event map[string]interface{}, vars map[string]interface{}) map[string]interface{} {
	pf := vars["pf"].(*pfapp.Pfapp)

	asserte.NoAsserte(event)

	// get the current user
	uid, _ := event["_session"].(map[string]interface{})["uid"].(int)
	asserte.Asserte(func() bool { return uid > 0 }, "current user not found")
	me, _ := pf.ReadOneRow(map[string]interface{}{
		"table": "users",
		"where": map[string]interface{}{
			"uid": uid,
		},
	})
	asserte.Asserte(func() bool { return me != nil }, "current user not found")
	// set default values for missing values
	me = array.ArrayMerge(map[string]interface{}{
		"name":     "",
		"address":  "",
		"address2": "",
		"city":     "",
		"state":    "",
		"zip":      "",
	}, me)
	// return the profile
	event["profile"] = map[string]interface{}{
		"name":     me["name"],
		"address":  me["address"],
		"address2": me["address2"],
		"city":     me["city"],
		"state":    me["state"],
		"zip":      me["zip"],
	}
	// info: profile returned
	event["i"] = "profile found"
	return event
}
