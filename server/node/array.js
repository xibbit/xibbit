///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
/**
 * Return true if this array is numeric.
 *
 * @param a array An array.
 * @return boolean True if it is a numeric array.
 *
 * @author DanielWHoward
 **/
function has_numeric_keys(a) {
  return a instanceof Array;
}
exports.has_numeric_keys = has_numeric_keys;
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
function has_string_keys(a) {
  return (typeof a === 'object') && (a.constructor.name === 'Object');
}
exports.has_string_keys = has_string_keys;
/**
 * Concatenate arrays with numerical indices.
 *
 * @return array The concatenated array.
 *
 * @author DanielWHoward
 **/
function array_concat() {
  var a = [];
  for (var i=0; i < arguments.length; ++i) {
    a = a.concat(arguments[i]);
  }
  return a;
}
exports.array_concat = array_concat;
/**
 * Merge keys of objects with string indices.
 *
 * @return object The merged object.
 *
 * @author DanielWHoward
 **/
function array_merge(a, b) {
  return Object.assign({}, a, b);
}
exports.array_merge = array_merge;
