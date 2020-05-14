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
	"publicfigure/pwd"
	"regexp"
	"time"
)

/**
 * Handle user_create event.  Create a new user.
 *
 * @author DanielWHoward
 **/
func User_create(event map[string]interface{}, vars map[string]interface{}) map[string]interface{} {
	pf := vars["pf"].(*pfapp.Pfapp)

	asserte.Asserte(func() bool { _, ok := event["username"]; return ok }, "missing:username")
	asserte.Asserte(func() bool { _, ok := event["username"].(string); return ok }, "typeof:username")
	asserte.Asserte(func() bool { return !array.ArrayIncludes(event["username"].(string), pf.UsernamesNotAllowed) }, "invalid:username")
	asserte.Asserte(func() bool {
		ok, _ := regexp.MatchString(`^[a-z][a-z0-9]{2,11}$`, event["username"].(string))
		return ok
	}, "regexp:username")
	asserte.Asserte(func() bool { _, ok := event["email"]; return ok }, "missing:email")
	asserte.Asserte(func() bool { _, ok := event["email"].(string); return ok }, "typeof:email")
	asserte.Asserte(func() bool {
		ok, _ := regexp.MatchString(`^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,4}$`, event["email"].(string))
		return ok
	}, "regexp:email")
	asserte.Asserte(func() bool { _, ok := event["pwd"]; return ok }, "missing:pwd")
	asserte.Asserte(func() bool { _, ok := event["pwd"].(string); return ok }, "typeof:pwd")

	username := event["username"].(string)
	email := event["email"].(string)
	hashedPwd, _ := pwd.Pwd_hash(event["pwd"].(string), "", "", false)

	now := time.Now().Format("2006-01-02 15:04:05")
	nullDateTime := "1970-01-01 00:00:00"
	// see if the user is already in the database
	me, _ := pf.ReadOneRow(map[string]interface{}{
		"table": "users",
		"where": map[string]interface{}{
			"or":       "or",
			"username": username,
			"email":    email,
		},
	})
	// insert the user into the database
	if me == nil {
		// insert the user
		user, _ := pf.InsertRow(map[string]interface{}{
			"table": "users",
			"values": map[string]interface{}{
				"id":        0,
				"uid":       0,
				"username":  username,
				"email":     email,
				"pwd":       hashedPwd,
				"created":   now,
				"connected": nullDateTime,
				"touched":   nullDateTime,
			},
		})
		id := int(user["id"].(float64))
		uid := int(user["id"].(float64))
		// update the uid
		values := map[string]interface{}{
			"uid": uid,
		}
		pf.UpdateRow(map[string]interface{}{
			"table":  "users",
			"values": values,
			"where": map[string]interface{}{
				"id": id,
			},
		})
		delete(event, "pwd")
		event["i"] = "created"
	} else {
		delete(event, "pwd")
		event["e"] = "already exists"
	}
	return event
}
