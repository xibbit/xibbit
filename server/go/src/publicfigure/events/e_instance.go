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

	if ok && useInstances {
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
			event["_session"].(map[string]interface{})["instance"] = instance
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
