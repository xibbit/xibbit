<?php
///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
/**
 * Return true if this array is numeric.
 *
 * @param $a array An array.
 * @return boolean True if it is a numeric array.
 *
 * @author DanielWHoward
 **/
function has_numeric_keys($a) {
  return is_array($a)
    && (count(array_filter(array_keys($a), 'is_string')) === 0);
}
/**
 * Return true if this array is associative.
 *
 * An associative array has at least one string key.
 *
 * @param $a array An array.
 * @return boolean True if it is an associative array.
 *
 * @author DanielWHoward
 **/
function has_string_keys($a) {
  return is_array($a)
    && (count(array_filter(array_keys($a), 'is_string')) > 0);
}
/**
 * Concatenate arrays with numerical indices.
 *
 * @param $a array An array to concentate.
 * @return array The concatenated array.
 *
 * @author DanielWHoward
 **/
function array_concat($a, $b, $c=array(), $d=array()) {
  return array_merge($a, $b, $c, $d);
}
?>
