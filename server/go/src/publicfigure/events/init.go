///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
package events

import (
	"publicfigure/asserte"
)

/**
 * Handle init event.  Return information to
 * initialize this app.  Nothing right now.
 *
 * @author DanielWHoward
 **/
func Init(event map[string]interface{}, vars map[string]interface{}) map[string]interface{} {

	asserte.NoAsserte(event)

	// info: initial values loaded
	event["i"] = "initialized"
	return event
}
