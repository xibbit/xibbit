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
	"github.com/xibbit/xibbit/server/golang/src/xibbit"
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

	uid := event["_session"].(map[string]interface{})["uid"].(int)
	instance := event["_session"].(map[string]interface{})["instance_id"].(string)

	// find user in the database
	username := ""
	mes, _ := pf.ReadRows(map[string]interface{}{
		"table": "users",
		"where": map[string]interface{}{
			"uid": uid,
		},
	})
	if (len(mes) == 1) {
		username = mes[0]["username"].(string)
	}

	// broadcast this instance logged out
	hub.Send(map[string]interface{}{
		"type": "notify_logout",
		"to":   "all",
		"from": username,
	}, "", false)
	// logout this instance
	event = hub.Connect(event, username, false)
	// remove UID from the instance
	row, _ := pf.ReadOneRow(map[string]interface{}{
		"table": "instances",
		"where": map[string]interface{}{
			"instance": instance,
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
				"instance": instance,
			},
		})
	}
	// remove UID and user info from the session
	delete(event["_session"].(map[string]interface{}), "uid")
	if _, ok := event["e"]; !ok {
		event["i"] = "logged out"
	}

	return event
}
