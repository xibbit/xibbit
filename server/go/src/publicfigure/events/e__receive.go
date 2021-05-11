// The MIT License (MIT)
//
// xibbit 1.50 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @copyright xibbit 1.50 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
package events

import (
	"encoding/json"
	"publicfigure/pfapp"
)

/**
 * Handle __receive event.  Change event queue to
 * use instances instead of usernames.
 *
 * @author DanielWHoward
 **/
func E__receive(event map[string]interface{}, vars map[string]interface{}) map[string]interface{} {
	pf := vars["pf"].(*pfapp.Pfapp)

	// assume that this event does not need special handling
	event["e"] = "unimplemented"

	useInstances, ok := vars["useInstances"].(bool)
	if ok && useInstances {
		sessionMap, _ := event["_session"].(map[string]interface{})
		if instance, ok := sessionMap["instance"].(string); ok {
			event["eventQueue"] = []map[string]interface{}{}
			// get the events from the events table
			events, _ := pf.ReadRows(map[string]interface{}{
				"table": "sockets_events",
				"where": map[string]interface{}{
					"sid": instance,
				},
			})
			for f := 0; f < len(events); f++ {
				evt := events[f]["event"].(string)
				evtMap := make(map[string]interface{}, 0)
				json.Unmarshal([]byte(evt), &evtMap)
				// delete the event from the events table
				pf.DeleteRow(map[string]interface{}{
					"table": "sockets_events",
					"where": map[string]interface{}{
						"id": events[f]["id"],
					},
				})
				event["eventQueue"] = append(event["eventQueue"].([]map[string]interface{}), evtMap)
			}
			delete(event, "e")
		}
	}
	return event
}