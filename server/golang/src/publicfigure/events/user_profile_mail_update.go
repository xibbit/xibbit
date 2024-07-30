// The MIT License (MIT)
//
// xibbit 1.5.3 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @version 1.5.3
// @copyright xibbit 1.5.3 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
package events

import (
	"github.com/xibbit/xibbit/server/golang/src/publicfigure/array"
	"github.com/xibbit/xibbit/server/golang/src/publicfigure/asserte"
	"github.com/xibbit/xibbit/server/golang/src/publicfigure/pfapp"
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
	uid, ok := event["_session"].(map[string]interface{})["uid"].(int)
	asserte.Asserte(func() bool { return ok }, "current user not found")
	asserte.Asserte(func() bool { return uid > 0 }, "current user not found")
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
