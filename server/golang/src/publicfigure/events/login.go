// The MIT License (MIT)
//
// xibbit 2.0.0 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @version 2.0.0
// @copyright xibbit 2.0.0 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
package events

import (
	"github.com/xibbit/xibbit/server/golang/src/publicfigure/asserte"
	"github.com/xibbit/xibbit/server/golang/src/publicfigure/pfapp"
	"github.com/xibbit/xibbit/server/golang/src/publicfigure/pwd"
	"regexp"
	"github.com/xibbit/xibbit/server/golang/src/xibbit"
)

/**
 * Handle login event.  Sign in a user.
 *
 * @author DanielWHoward
 **/
func Login(event map[string]interface{}, vars map[string]interface{}) map[string]interface{} {
	hub := vars["hub"].(*xibbit.XibbitHub)
	pf := vars["pf"].(*pfapp.Pfapp)

	asserte.Asserte(func() bool { _, ok := event["to"]; return ok }, "missing:to")
	asserte.Asserte(func() bool { _, ok := event["to"].(string); return ok }, "typeof:to")
	asserte.Asserte(func() bool {
		ok, _ := regexp.MatchString(`^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,4}$`, event["to"].(string))
		return ok
	}, "regexp:to")
	asserte.Asserte(func() bool { _, ok := event["pwd"]; return ok }, "missing:pwd")
	asserte.Asserte(func() bool { _, ok := event["pwd"].(string); return ok }, "typeof:pwd")
	to := event["to"].(string)
	passwd := event["pwd"].(string)

	// save the password but remove it from the event
	delete(event, "pwd")
	event["loggedIn"] = false
	var verified interface{} = true
	if verified.(bool) {
		// find user in the database
		me, _ := pf.ReadOneRow(map[string]interface{}{
			"table": "users",
			"where": map[string]interface{}{
				"email": to,
			},
		})
		if me == nil {
			// if there is no user, force the password code to run
			//  with fake data so the user cannot guess usernames
			//  based on timing
			me = map[string]interface{}{
				"pwd": "$5$9f9b9bc83f164e1f1f392499e2561f05940c1d6c47bcad69e3bd311e620ab9d5$ee2334e03ba30379fb09cd1df0d4088ea8a853411062be0f83925ccdd2037aaf",
			}
		}
		// compare but do not allow user to guess hash string based on timing
		verified, _ = pwd.Pwd_verify(passwd, me["pwd"].(string))
		if upgradedPwd, ok := verified.(string); ok {
			pf.UpdateRow(map[string]interface{}{
				"table": "users",
				"values": map[string]interface{}{
					"pwd": upgradedPwd,
				},
				"where": map[string]interface{}{
					"id": me["id"],
				},
			})
			verified = true
		}
		if verified, ok := verified.(bool); verified && ok {
			// find user in the database
			mes, _ := pf.ReadRows(map[string]interface{}{
				"table": "users",
				"where": map[string]interface{}{
					"uid": me["uid"],
				},
			})
			if (len(mes) == 1) && (mes[0]["username"] == "user") {
				event["i"] = "collect:username"
			}
			me = mes[len(mes)-1]
			// connect to this user
			event["username"] = me["username"]
			event = hub.Connect(event, me["username"].(string), true)
			// add UID and user to the session variables
			event["_session"].(map[string]interface{})["uid"] = me["id"]
			// return user info
			event["me"] = map[string]interface{}{
				"username": me["username"],
				"roles": me["roles"],
			}
			event["loggedIn"] = true
			// update the instance with UID
			row, _ := pf.ReadOneRow(map[string]interface{}{
				"table": "instances",
				"where": map[string]interface{}{
					"instance": event["_session"].(map[string]interface{})["instance_id"],
				},
			})
			if row != nil {
				values := map[string]interface{}{
					"uid": event["_session"].(map[string]interface{})["uid"],
				}
				pf.UpdateRow(map[string]interface{}{
					"table":  "instances",
					"values": values,
					"where": map[string]interface{}{
						"instance": event["_session"].(map[string]interface{})["instance_id"],
					},
				})
			}
			hub.Send(map[string]interface{}{
				"type": "notify_login",
				"to":   "all",
				"from": me["username"],
			}, "", false)
			// info: user logged in
			if _, ok := event["i"]; !ok {
				event["i"] = "logged in"
			}
			return event
		} else {
			// error: user not found or wrong password
			event["e"] = "unauthenticated"
			return event
		}
	} else {
		// error: user not found or wrong password
		event["e"] = "unauthenticated"
		return event
	}
}
