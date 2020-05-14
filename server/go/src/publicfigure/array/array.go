///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
package array

/**
 * Return true if this array is numeric.
 *
 * @param a array An array.
 * @return boolean True if it is a numeric array.
 *
 * @author DanielWHoward
 **/
func HasNumericKeys(a interface{}) bool {
	_, valid := a.([]interface{})
	return valid
}

/**
 * Return true if this array is associative.
 *
 * An associative array has at least one string key.
 *
 * @param a array An array.
 * @return boolean True if it is an associative array.
 *
 * @author DanielWHoward
 **/

func HasStringKeys(a interface{}) bool {
	_, valid := a.(map[string]interface{})
	return valid
}

/**
 * Concatenate arrays with numerical indices.
 *
 * @return array The concatenated array.
 *
 * @author DanielWHoward
 **/
func ArrayConcat(a []interface{}, b []interface{}) []interface{} {
	return append(a, b...)
}

/**
 * Merge keys of objects with string indices.
 *
 * @return object The merged object.
 *
 * @author DanielWHoward
 **/
func ArrayMerge(a map[string]interface{}, b map[string]interface{}) map[string]interface{} {
	r := make(map[string]interface{})
	for key, value := range a {
		r[key] = value
	}
	for key, value := range b {
		r[key] = value
	}
	return r
}

/**
 * Checks if a string value exists in a string array.
 *
 * @return needle The string to search for.
 * @return haystack The string array to search in.
 *
 * @author DanielWHoward
 **/
func ArrayIncludes(needle string, haystack []string) bool {
	for _, v := range haystack {
		if v == needle {
			return true
		}
	}
	return false
}
