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
	"io"
	"os"
	"github.com/xibbit/xibbit/server/golang/src/publicfigure/pfapp"
)

/**
 * Handle user_profile event.  Get this user's
 * profile.
 *
 * @author DanielWHoward
 **/
func User_profile_upload_photo(event map[string]interface{}, vars map[string]interface{}) map[string]interface{} {
	pf := vars["pf"].(*pfapp.Pfapp)

	uid := event["_session"].(map[string]interface{})["uid"].(int)

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

	perm_fn, err := os.Create("./public/images/"+username+".png")
	success := true
	if err != nil {
		success = false
	}
	if (success) {
		defer perm_fn.Close()
		_, err = io.Copy(perm_fn, event["image"].(map[string]interface{})["tmp_name"].(io.Reader))
	}
	if err != nil {
		success = false
	}
	event["image"] = map[string]interface{}{
		"tmp_name": "./public/images/"+username+".png",
	}
	if err == nil {
		event["i"] = "uploaded"
	} else {
		event["e"] = "upload failed"
	}
	return event
}
