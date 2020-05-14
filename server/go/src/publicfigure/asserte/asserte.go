///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
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
