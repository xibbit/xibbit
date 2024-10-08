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
	"github.com/xibbit/xibbit/server/golang/src/publicfigure/array"
	"github.com/xibbit/xibbit/server/golang/src/publicfigure/asserte"
	"github.com/xibbit/xibbit/server/golang/src/publicfigure/pfapp"
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
