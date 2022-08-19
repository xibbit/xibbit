// The MIT License (MIT)
//
// xibbit 1.5.2 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @version 1.5.2
// @copyright xibbit 1.5.2 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
package asserte

/**
 * Throw an exception if the assert condition is false.
 *
 * @param cond boolean A boolean for the assertion.
 * @param msg The message to use if the assertion fails.
 * @throws Exception The assertion failed.
 *
 * @author DanielWHoward
 **/
func Asserte(cond func() bool, msg string) {
	if !cond() {
		panic(msg)
	}
}

/**
 * Throw an exception if the event object has too few or too many arguments.
 *
 * @param event array The event that should be minimal.
 * @throws Exception The assertion failed.
 *
 * @author DanielWHoward
 **/
func NoAsserte(event map[string]interface{}) string {
	// check the required properties
	Asserte(func() bool { _, ok := event["type"]; return ok }, "missing:type")
	Asserte(func() bool { _, ok := event["_id"]; return ok }, "missing:_id")
	Asserte(func() bool { _, ok := event["_session"]; return ok }, "missing:_session")
	Asserte(func() bool { _, ok := event["_conn"]; return ok }, "missing:_conn")
	// check the "from" property
	keys := make([]string, 0, len(event))
	for key := range event {
		keys = append(keys, key)
	}
	_, found := event["from"]
	msg := ""
	if (!found && (len(keys) != 4)) || (found && (len(keys) != 5)) {
		// find at least one extra property
		if found {
			delete(event, "from")
		}
		delete(event, "type")
		delete(event, "_id")
		delete(event, "_session")
		delete(event, "_conn")
		keys = make([]string, 0, len(event))
		for key := range event {
			keys = append(keys, key)
		}
		msg = "property:" + keys[0]
	}
	return msg
}
