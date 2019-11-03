///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
/**
 * A helper function for defining an event handler.
 *
 * @param eventType string The event name or type.
 * @param eventHandler function The event implementation.
 * @return object An optional Promise object.
 *
 * @author DanielWHoward
 **/
const api = (eventType, eventHandler) => self => self.api(eventType, eventHandler);
/**
 * A helper function for defining an authenticated event
 * handler.
 *
 * @param eventType string The event name or type.
 * @param eventHandler function The event implementation.
 * @return object An optional Promise object.
 *
 * @author DanielWHoward
 **/
const on = (eventType, eventHandler) => self => self.on(eventType, eventHandler);

module.exports = { api, on };
