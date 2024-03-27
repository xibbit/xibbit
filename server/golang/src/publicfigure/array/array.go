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
